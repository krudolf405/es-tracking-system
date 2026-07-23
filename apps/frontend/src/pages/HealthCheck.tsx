import { useEffect, useState } from 'react';
import axios from 'axios';

function HealthCheck() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get<{ status: string }>(`${import.meta.env.VITE_API_URL}/health`)
      .then((res) => setStatus(res.data.status))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold">Backend Health Check</h2>
      {error && <p className="text-red-600">Error: {error}</p>}
      {status && <p className="text-green-600">Status: {status}</p>}
      {!status && !error && <p className="text-gray-500">Checking...</p>}
    </div>
  );
}

export default HealthCheck;
