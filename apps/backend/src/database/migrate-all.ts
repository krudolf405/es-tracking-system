import { Pool } from 'pg';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Applies all SQL migration files in apps/backend/drizzle/ in ascending order.
 *
 * Why not `drizzle-kit migrate`? The migration journal only tracks the first
 * few migrations, so we run every `.sql` file manually and record which ones
 * have already been applied in a `schema_migrations` table. This makes the
 * script safe to run repeatedly and fully reproducible on a fresh database.
 */
async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const dir = join(__dirname, '..', '..', 'drizzle');
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const already = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [file],
    );
    if (already.rowCount) {
      console.log(`SKIP  ${file} (already applied)`);
      continue;
    }

    const sql = readFileSync(join(dir, file), 'utf8');
    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const stmt of statements) {
        await client.query(stmt);
      }
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [
        file,
      ]);
      await client.query('COMMIT');
      console.log(`APPLY ${file} (${statements.length} statements)`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration failed for ${file}: ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }

  await pool.end();
  console.log('All migrations applied.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
