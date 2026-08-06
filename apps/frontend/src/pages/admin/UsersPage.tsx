import { useEffect, useState, FormEvent } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  studentName: string | null;
  matricNumber: string | null;
}

interface UserForm {
  email: string;
  password: string;
  role: string;
  fullName: string;
  matricNumber: string;
}

const emptyForm: UserForm = {
  email: '',
  password: '',
  role: 'INVIGILATOR',
  fullName: '',
  matricNumber: '',
};

const roleBadgeColors: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  LECTURER: 'bg-indigo-100 text-indigo-800',
  INVIGILATOR: 'bg-blue-100 text-blue-800',
  STUDENT: 'bg-green-100 text-green-800',
};

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get<User[]>('/users');
      setUsers(res.data);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post('/users', {
        email: form.email,
        password: form.password,
        role: form.role,
        fullName: form.role === 'STUDENT' ? form.fullName : undefined,
        matricNumber: form.role === 'STUDENT' ? form.matricNumber : undefined,
      });
      setSuccess(
        `${res.data.role === 'STUDENT' ? 'Student' : res.data.role === 'INVIGILATOR' ? 'Invigilator' : res.data.role === 'LECTURER' ? 'Lecturer' : 'Admin'} account created for ${res.data.email}`,
      );
      setShowModal(false);
      fetchUsers();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return date;
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        <button
          onClick={openModal}
          className="rounded bg-blue-800 px-4 py-2 text-sm text-white hover:bg-blue-900"
        >
          + Create Account
        </button>
      </div>

      {success && (
        <div className="mb-4 rounded bg-green-100 p-3 text-sm text-green-800">{success}</div>
      )}
      {error && (
        <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Matric Number</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No users yet. Click &quot;+ Create Account&quot; to add one.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{user.email}</td>
                <td className="px-4 py-3">{user.studentName || '—'}</td>
                <td className="px-4 py-3">{user.matricNumber || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      roleBadgeColors[user.role] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">Create Account</h2>
            {error && (
              <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded border px-3 py-2 text-sm focus:border-blue-800 focus:outline-none"
                >
                  <option value="INVIGILATOR">Invigilator</option>
                  <option value="STUDENT">Student</option>
                  <option value="LECTURER">Lecturer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {form.role === 'STUDENT' && (
                <>
                  <input
                    placeholder="Full Name"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                    className="w-full rounded border px-3 py-2 text-sm focus:border-blue-800 focus:outline-none"
                  />
                  <input
                    placeholder="Matric Number"
                    value={form.matricNumber}
                    onChange={(e) => setForm({ ...form, matricNumber: e.target.value })}
                    required
                    className="w-full rounded border px-3 py-2 text-sm focus:border-blue-800 focus:outline-none"
                  />
                </>
              )}

              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full rounded border px-3 py-2 text-sm focus:border-blue-800 focus:outline-none"
              />
              <input
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="w-full rounded border px-3 py-2 text-sm focus:border-blue-800 focus:outline-none"
              />
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-blue-800 px-4 py-2 text-sm text-white hover:bg-blue-900 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default UsersPage;