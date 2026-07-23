import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';

interface Room {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  role: string;
}

interface Invigilator {
  id: string;
  email: string;
  role: string;
}

interface ExamSession {
  id: string;
  courseName: string;
  courseCode: string;
  date: string;
  startTime: string;
  endTime: string;
  room: Room | null;
  invigilators: Invigilator[];
  status: string;
}

function ExamsPage() {
  const [exams, setExams] = useState<ExamSession[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [invigilators, setInvigilators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    courseName: '',
    courseCode: '',
    date: '',
    startTime: '',
    endTime: '',
    roomId: '',
    invigilatorIds: [] as string[],
  });

  useEffect(() => {
    Promise.all([fetchExams(), fetchRooms(), fetchInvigilators()]);
  }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get<ExamSession[]>('/exam-sessions');
      setExams(res.data);
    } catch {
      console.error('Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const data = (await api.get<Room[]>('/rooms')).data;
      setRooms(data);
    } catch {
      setRooms([]);
    }
  };

  const fetchInvigilators = async () => {
    try {
      const res = await api.get<User[]>('/users/invigilators');
      setInvigilators(res.data);
    } catch {
      // Fallback: show empty while we build out users endpoint
      setInvigilators([]);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/exam-sessions', form);
      setShowModal(false);
      setForm({
        courseName: '',
        courseCode: '',
        date: '',
        startTime: '',
        endTime: '',
        roomId: '',
        invigilatorIds: [],
      });
      fetchExams();
    } catch (err) {
      console.error('Failed to create exam', err);
    }
  };

  const toggleInvigilator = (id: string) => {
    setForm((prev) => ({
      ...prev,
      invigilatorIds: prev.invigilatorIds.includes(id)
        ? prev.invigilatorIds.filter((i) => i !== id)
        : [...prev.invigilatorIds, id],
    }));
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-600',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Examinations</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          + Schedule Exam
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Invigilators</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && exams.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No exams scheduled.
                </td>
              </tr>
            )}
            {exams.map((exam) => (
              <tr key={exam.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{exam.courseName}</td>
                <td className="px-4 py-3">{exam.courseCode}</td>
                <td className="px-4 py-3">{exam.date}</td>
                <td className="px-4 py-3">
                  {exam.startTime} - {exam.endTime}
                </td>
                <td className="px-4 py-3">{exam.room?.name || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {exam.invigilators.length > 0
                      ? exam.invigilators.map((inv) => (
                          <span
                            key={inv.id}
                            className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
                          >
                            {inv.email}
                          </span>
                        ))
                      : '—'}
                  </div>
                </td>
                <td className="px-4 py-3">{statusBadge(exam.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">Schedule Exam</h2>
            <div className="space-y-3">
              <input
                placeholder="Course Name"
                value={form.courseName}
                onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                placeholder="Course Code"
                value={form.courseCode}
                onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
                className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <div className="flex space-x-3">
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-1/2 rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-1/2 rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <select
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Room</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Assign Invigilators
                </label>
                <div className="max-h-32 space-y-1 overflow-y-auto rounded border p-2">
                  {invigilators.length === 0 && (
                    <p className="text-xs text-gray-400">
                      No invigilators available. Add users with INVIGILATOR role.
                    </p>
                  )}
                  {invigilators.map((inv) => (
                    <label key={inv.id} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.invigilatorIds.includes(inv.id)}
                        onChange={() => toggleInvigilator(inv.id)}
                        className="rounded"
                      />
                      <span>{inv.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default ExamsPage;
