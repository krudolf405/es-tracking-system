import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';
import { getSocket, disconnectSocket } from '../../store/socketStore';

interface SessionStats {
  id: string;
  courseName: string;
  courseCode: string;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalExpected: number;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  matricNumber: string;
  status: string;
  signInTime: string;
}

function AdminDashboard() {
  const [activeSessions, setActiveSessions] = useState<SessionStats[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [showAttendees, setShowAttendees] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      fetchStats().then((sessions) => {
        sessions?.forEach((s) => {
          socket.emit('joinRoom', { examSessionId: s.id });
        });
      });
    });

    socket.on('attendanceUpdated', (data: { examSessionId: string; stats: SessionStats }) => {
      setActiveSessions((prev) =>
        prev.map((s) =>
          s.id === data.examSessionId ? { ...s, ...data.stats } : s,
        ),
      );
    });

    socket.on('incidentLogged', (data: { type: string; description: string; reportedBy: string; studentName?: string }) => {
      toast.warning(
        `${data.type.replace(/_/g, ' ')} reported by ${data.reportedBy}${data.studentName ? ` - Student: ${data.studentName}` : ''}`,
        { duration: 6000 },
      );
    });

    fetchStats();

    return () => {
      disconnectSocket();
    };
  }, []);

  const fetchStats = async (): Promise<SessionStats[] | undefined> => {
    try {
      setLoading(true);
      const [statsRes, studentsRes] = await Promise.all([
        api.get<SessionStats[]>('/attendance/active-stats'),
        api.get<{ id: string }[]>('/students'),
      ]);
      setActiveSessions(statsRes.data);
      setTotalStudents(studentsRes.data.length);
      return statsRes.data;
    } catch {
      console.error('Failed to fetch dashboard data');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async (sessionId: string) => {
    try {
      const res = await api.get<AttendanceRecord[]>(`/attendance/session/${sessionId}`);
      setAttendees(res.data);
    } catch {
      setAttendees([]);
    }
  };

  const viewAttendees = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowAttendees(true);
    fetchAttendees(sessionId);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PRESENT: 'bg-green-100 text-green-700',
      LATE: 'bg-yellow-100 text-yellow-700',
      ABSENT: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[status] || ''}`}>
        {status}
      </span>
    );
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" richColors />
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Active Sessions
          </h2>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {activeSessions.length}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Total Students
          </h2>
          <p className="mt-2 text-3xl font-bold text-green-600">{totalStudents}</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Total Present
          </h2>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {activeSessions.reduce((sum, s) => sum + s.totalPresent, 0)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Total Late
          </h2>
          <p className="mt-2 text-3xl font-bold text-yellow-600">
            {activeSessions.reduce((sum, s) => sum + s.totalLate, 0)}
          </p>
        </div>
      </div>

      {/* Active Session Cards */}
      {loading && <p className="text-gray-400">Loading sessions...</p>}
      {!loading && activeSessions.length === 0 && (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-400 shadow">
          <p className="text-lg">No active exam sessions.</p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {activeSessions.map((session) => (
          <div key={session.id} className="rounded-lg border bg-white p-6 shadow transition hover:shadow-md">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-800">{session.courseName}</h2>
              <p className="text-sm text-gray-500">{session.courseCode}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded bg-blue-50 p-2">
                <p className="text-xs text-gray-500">Expected</p>
                <p className="text-xl font-bold text-blue-700">{session.totalExpected}</p>
              </div>
              <div className="rounded bg-green-50 p-2">
                <p className="text-xs text-gray-500">Present</p>
                <p className="text-xl font-bold text-green-700">{session.totalPresent}</p>
              </div>
              <div className="rounded bg-yellow-50 p-2">
                <p className="text-xs text-gray-500">Late</p>
                <p className="text-xl font-bold text-yellow-700">{session.totalLate}</p>
              </div>
            </div>
            <button
              onClick={() => viewAttendees(session.id)}
              className="mt-4 w-full rounded border border-blue-600 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
            >
              View Attendees
            </button>
          </div>
        ))}
      </div>

      {/* Attendees Modal */}
      {showAttendees && selectedSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Attendees</h2>
              <button
                onClick={() => setShowAttendees(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            {attendees.length === 0 ? (
              <p className="text-center text-gray-400">No attendees yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Matric</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendees.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{a.studentName}</td>
                      <td className="px-4 py-3 text-gray-500">{a.matricNumber}</td>
                      <td className="px-4 py-3">{statusBadge(a.status)}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(a.signInTime).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAttendees(false)}
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

export default AdminDashboard;
