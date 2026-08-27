import { useState, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const roleLabels: Record<string, string> = {
  STUDENT: 'Student',
  INVIGILATOR: 'Invigilator',
};

function SignUpPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'STUDENT';

  const [role, setRole] = useState<string>(initialRole);
  const [fullName, setFullName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/auth/register', {
        email,
        password,
        role,
        fullName: role === 'STUDENT' ? fullName : undefined,
        matricNumber: role === 'STUDENT' ? matricNumber : undefined,
      });
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Registration failed');
      } else {
        setError('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gray-100">
        <Link
          to="/"
          className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-800 transition hover:text-blue-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Account created!</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your {roleLabels[role] || 'account'} account is ready. You can now sign in with your
            email and password.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block w-full rounded-lg bg-blue-800 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-900"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
      <Link
        to="/"
        className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-800 transition hover:text-blue-900"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </Link>
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-center text-2xl font-bold text-gray-800">Exam Tracking System</h1>
        <h2 className="mb-6 mt-2 text-center text-lg font-semibold text-gray-600">Create an account</h2>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700">
              I am a
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-800 focus:outline-none"
            >
              <option value="STUDENT">Student</option>
              <option value="INVIGILATOR">Invigilator</option>
            </select>
          </div>

          {role === 'STUDENT' && (
            <>
              <div>
                <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-800 focus:outline-none"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label htmlFor="matricNumber" className="mb-1 block text-sm font-medium text-gray-700">
                  Matric Number
                </label>
                <input
                  id="matricNumber"
                  type="text"
                  value={matricNumber}
                  onChange={(e) => setMatricNumber(e.target.value)}
                  required
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-800 focus:outline-none"
                  placeholder="MAT/2025/001"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-800 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-800 focus:outline-none"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-800 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-900 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-800 hover:text-blue-900">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUpPage;