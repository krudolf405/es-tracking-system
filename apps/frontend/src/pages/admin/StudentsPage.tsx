import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';

interface Student {
  id: string;
  fullName: string;
  matricNumber: string;
  email: string;
  qrCodeHash: string;
}

function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [qrStudent, setQrStudent] = useState<Student | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', matricNumber: '' });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get<Student[]>('/students');
      setStudents(res.data);
    } catch {
      console.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await api.post('/students', form);
      setShowAddModal(false);
      setForm({ email: '', password: '', fullName: '', matricNumber: '' });
      fetchStudents();
    } catch (err) {
      console.error('Failed to add student', err);
    }
  };

  const handleViewQr = async (student: Student) => {
    setQrStudent(student);
    try {
      const res = await api.get(`/students/${student.id}/qrcode`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      setQrDataUrl(url);
    } catch {
      console.error('Failed to load QR code');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          + Add Student
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Matric Number</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No students found.
                </td>
              </tr>
            )}
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{s.fullName}</td>
                <td className="px-4 py-3">{s.matricNumber}</td>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleViewQr(s)}
                    className="rounded bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                  >
                    View QR
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">Add Student</h2>
            <div className="space-y-3">
              <input
                placeholder="Full Name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                placeholder="Matric Number"
                value={form.matricNumber}
                onChange={(e) => setForm({ ...form, matricNumber: e.target.value })}
                className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrStudent && qrDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-xl">
            <h2 className="mb-2 text-lg font-bold">{qrStudent.fullName}</h2>
            <p className="mb-4 text-sm text-gray-500">{qrStudent.matricNumber}</p>
            <img src={qrDataUrl} alt="QR Code" className="mx-auto mb-4 h-48 w-48" />
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = qrDataUrl;
                  a.download = `qrcode-${qrStudent.matricNumber}.png`;
                  a.click();
                }}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Download
              </button>
              <button
                onClick={() => {
                  setQrStudent(null);
                  setQrDataUrl(null);
                }}
                className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default StudentsPage;
