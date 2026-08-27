import { useEffect, useState, FormEvent } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';

interface Enrollment {
  id: string;
  studentId: string;
  courseCode: string;
  enrolledAt: string;
  studentName: string;
  matricNumber: string;
  email: string;
}

interface Student {
  id: string;
  fullName: string;
  matricNumber: string;
  email: string;
  qrCodeHash: string;
}

interface CourseGroup {
  courseCode: string;
  students: Enrollment[];
}

const emptyForm = {
  courseCode: '',
  studentIds: [] as string[],
};

function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrollments();
    fetchStudents();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const res = await api.get<Enrollment[]>('/enrollments');
      setEnrollments(res.data);
    } catch {
      setError('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get<Student[]>('/students');
      setStudents(res.data);
    } catch {
      setError('Failed to load students');
    }
  };

  const courseGroups: CourseGroup[] = enrollments.reduce<CourseGroup[]>((acc, e) => {
    const group = acc.find((g) => g.courseCode === e.courseCode);
    if (group) {
      group.students.push(e);
    } else {
      acc.push({ courseCode: e.courseCode, students: [e] });
    }
    return acc;
  }, []);

  const openModal = () => {
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  };

  const toggleStudent = (id: string) => {
    setForm((prev) => {
      const exists = prev.studentIds.includes(id);
      return {
        ...prev,
        studentIds: exists
          ? prev.studentIds.filter((s) => s !== id)
          : [...prev.studentIds, id],
      };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post('/enrollments', {
        studentIds: form.studentIds,
        courseCode: form.courseCode,
      });
      const count = res.data.length ?? form.studentIds.length;
      setSuccess(
        `${count} student${count === 1 ? '' : 's'} enrolled in ${form.courseCode}`,
      );
      setShowModal(false);
      fetchEnrollments();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to enroll students');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string, courseCode: string) => {
    try {
      await api.delete(`/enrollments/${id}`);
      setSuccess(`Removed student from ${courseCode}`);
      fetchEnrollments();
    } catch {
      setError('Failed to remove enrollment');
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
        <h1 className="text-2xl font-bold text-gray-800">Enrollments</h1>
        <button
          onClick={openModal}
          className="rounded bg-blue-800 px-4 py-2 text-sm text-white hover:bg-blue-900"
        >
          + Enroll Students
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
              <th className="px-4 py-3">Course Code</th>
              <th className="px-4 py-3">Enrolled Students</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && courseGroups.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  No enrollments yet. Click &quot;+ Enroll Students&quot; to get started.
                </td>
              </tr>
            )}
            {courseGroups.map((group) => {
              const isExpanded = expanded === group.courseCode;
              return (
                <tr key={group.courseCode} className="align-top hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold">{group.courseCode}</td>
                  <td className="px-4 py-3">{group.students.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-3">
                      <button
                        onClick={() =>
                          setExpanded(isExpanded ? null : group.courseCode)
                        }
                        className="text-sm font-medium text-blue-800 hover:text-blue-900"
                      >
                        {isExpanded ? 'Hide Students' : 'View Students'}
                      </button>
                      <button
                        onClick={openModal}
                        className="text-sm font-medium text-blue-800 hover:text-blue-900"
                      >
                        Enroll Students
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 rounded border">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-600">
                            <tr>
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">Matric Number</th>
                              <th className="px-3 py-2">Email</th>
                              <th className="px-3 py-2">Enrolled</th>
                              <th className="px-3 py-2">Remove</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {group.students.map((s) => (
                              <tr key={s.id}>
                                <td className="px-3 py-2 font-medium">{s.studentName}</td>
                                <td className="px-3 py-2">{s.matricNumber}</td>
                                <td className="px-3 py-2">{s.email}</td>
                                <td className="px-3 py-2">{formatDate(s.enrolledAt)}</td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() => handleRemove(s.id, group.courseCode)}
                                    className="text-sm font-medium text-red-500 hover:text-red-700"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">Enroll Students</h2>
            {error && (
              <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Course Code
                </label>
                <input
                  placeholder="e.g. CS101"
                  value={form.courseCode}
                  onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
                  required
                  className="w-full rounded border px-3 py-2 text-sm focus:border-blue-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Students
                </label>
                <div className="max-h-60 space-y-1 overflow-y-auto rounded border p-2">
                  {students.length === 0 && (
                    <p className="px-1 py-2 text-sm text-gray-400">No students available</p>
                  )}
                  {students.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center space-x-2 rounded px-1 py-1 text-sm hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={form.studentIds.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="h-4 w-4 text-blue-800 focus:ring-blue-800"
                      />
                      <span>
                        {student.fullName}{' '}
                        <span className="text-gray-500">({student.matricNumber})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

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
                  disabled={saving || form.studentIds.length === 0}
                  className="rounded bg-blue-800 px-4 py-2 text-sm text-white hover:bg-blue-900 disabled:opacity-50"
                >
                  {saving ? 'Enrolling...' : 'Enroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default EnrollmentsPage;
