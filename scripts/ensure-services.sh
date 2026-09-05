#!/usr/bin/env bash
# ensure-services.sh
#
# Keeps the backend (port 3010) and frontend (port 5173) running and restarts
# them automatically if they crash or are killed (e.g. by the OOM killer under
# memory pressure). The database is expected to already be up (Docker container
# on port 5433).
#
# Usage:
#   ./scripts/ensure-services.sh            # run in the foreground (supervisor loop)
#   nohup ./scripts/ensure-services.sh &    # run in the background
#
# Run once per boot, or add to startup. See README "Run without Docker".

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PID=""
FRONTEND_PID=""
CHECK_INTERVAL="${CHECK_INTERVAL:-10}"   # seconds between liveness checks
RESTART_DELAY="${RESTART_DELAY:-4}"      # seconds to wait before restarting a dead service
DB_HOST="${DB_HOST:-127.0.0.1}"          # database host (Docker container gateway)
DB_PORT="${DB_PORT:-5433}"               # database host port

# Wait until the PostgreSQL database is reachable, so the backend can connect at
# boot (the Docker DB and this service start around the same time).
wait_for_db() {
  echo "[ensure-services] waiting for database on ${DB_HOST}:${DB_PORT} ..."
  for i in $(seq 1 60); do
    if (exec 3<>"/dev/tcp/$DB_HOST/$DB_PORT") 2>/dev/null; then
      exec 3>&- 3<&-
      echo "[ensure-services] database is reachable"
      return 0
    fi
    sleep 2
  done
  echo "[ensure-services] WARNING: database not reachable after 120s; starting services anyway (supervisor will retry)"
  return 0
}

start_backend() {
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    return 0
  fi
  echo "[ensure-services] starting backend on :3010"
  (
    cd "$ROOT"
    exec node -r dotenv/config apps/backend/dist/main.js
  ) >>"$ROOT/logs/backend.log" 2>&1 &
  BACKEND_PID=$!
}

start_frontend() {
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    return 0
  fi
  echo "[ensure-services] starting frontend on :5173"
  (
    cd "$ROOT"
    exec npm run preview -w apps/frontend
  ) >>"$ROOT/logs/frontend.log" 2>&1 &
  FRONTEND_PID=$!
}

mkdir -p "$ROOT/logs"

wait_for_db
start_backend
start_frontend

echo "[ensure-services] supervisor running (interval=${CHECK_INTERVAL}s). Ctrl-C to stop."

cleanup() {
  echo "[ensure-services] stopping..."
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

while true; do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "[ensure-services] backend died; restarting in ${RESTART_DELAY}s"
    sleep "$RESTART_DELAY"
    wait_for_db
    start_backend
  fi
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "[ensure-services] frontend died; restarting in ${RESTART_DELAY}s"
    sleep "$RESTART_DELAY"
    start_frontend
  fi
  sleep "$CHECK_INTERVAL"
done
