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
  totalSignedOut: number;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  matricNumber: string;
  status: string;
  signInTime: string;
  signOutTime?: string;
}

interface StudentRecord {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  matricNumber?: string;
}

interface PresentStudentRecord {
  examSessionId: string;
  courseName: string;
  courseCode: string;
  studentId: string;
  studentName: string;
  matricNumber: string;
  status: string;
  signInTime: string;
  signOutTime?: string;
}

interface AbsentStudentRecord {
  examSessionId: string;
  courseName: string;
  courseCode: string;
  studentId: string;
  studentName: string;
  matricNumber: string;
}

function AdminDashboard() {
  const [activeSessions, setActiveSessions] = useState<SessionStats[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [showAttendees, setShowAttendees] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  const [drillDownData, setDrillDownData] = useState<any[]>([]);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownLoading, setDrillDownLoading] = useState(false);

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

  const openDrillDown = async (title: string, data?: any[]) => {
    setDrillDownTitle(title);
    setShowDrillDown(true);

    if (data) {
      setDrillDownData(data);
      return;
    }

    setDrillDownLoading(true);
    setDrillDownData([]);

    try {
      if (title === 'Active Sessions') {
        setDrillDownData(activeSessions);
      } else if (title === 'Total Students') {
        const res = await api.get<StudentRecord[]>('/students');
        setDrillDownData(res.data);
      } else if (title === 'Total Present') {
        const res = await api.get<PresentStudentRecord[]>('/attendance/present-students');
        setDrillDownData(res.data.filter((r) => r.status === 'PRESENT'));
      } else if (title === 'Total Late') {
        const res = await api.get<PresentStudentRecord[]>('/attendance/present-students');
        setDrillDownData(res.data.filter((r) => r.status === 'LATE'));
      } else if (title === 'Absent Today') {
        const res = await api.get<AbsentStudentRecord[]>('/attendance/absent-students');
        setDrillDownData(res.data);
      }
    } catch {
      setDrillDownData([]);
      toast.error(`Failed to load ${title.toLowerCase()} data`);
    } finally {
      setDrillDownLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PRESENT: 'bg-green-100 text-green-700',
      LATE: 'bg-yellow-100 text-yellow-700',
      ABSENT: 'bg-red-100 text-red-700',
      SIGNED_OUT: 'bg-gray-100 text-gray-600',
    };
    return (
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[status] || ''}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const formatTime = (t?: string) => (t ? new Date(t).toLocaleTimeString() : '—');

  const totalPresent = activeSessions.reduce((sum, s) => sum + s.totalPresent, 0);
  const totalLate = activeSessions.reduce((sum, s) => sum + s.totalLate, 0);
  const totalAbsent = activeSessions.reduce((sum, s) => sum + s.totalAbsent, 0);

  const statCards = [
    { label: 'Active Sessions', value: activeSessions.length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', title: 'Active Sessions' },
    { label: 'Total Students', value: totalStudents, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', title: 'Total Students' },
    { label: 'Total Present', value: totalPresent, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', title: 'Total Present' },
    { label: 'Total Late', value: totalLate, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100', title: 'Total Late' },
    { label: 'Absent Today', value: totalAbsent, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', title: 'Absent Today' },
  ];

  return (
    <AdminLayout>
      <Toaster position="top-right" richColors />
      <h1 className="mb-6 text-2xl font-bold text-blue-800">Dashboard</h1>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            onClick={() => openDrillDown(card.title)}
            className={`cursor-pointer rounded-lg border ${card.border} ${card.bg} p-6 shadow transition hover:shadow-md`}
          >
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              {card.label}
            </h2>
            <p className={`mt-2 text-3xl font-bold ${card.color}`}>
              {loading ? '—' : card.value}
            </p>
          </div>
        ))}
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
            <div className="grid grid-cols-4 gap-3 text-center">
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
              <div className="rounded bg-red-50 p-2">
                <p className="text-xs text-gray-500">Absent</p>
                <p className="text-xl font-bold text-red-700">{session.totalAbsent}</p>
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

      {/* Drill-Down Modal */}
      {showDrillDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="mx-4 max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-blue-800">{drillDownTitle}</h2>
              <button
                onClick={() => setShowDrillDown(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                &times;
              </button>
            </div>

            {drillDownLoading ? (
              <p className="py-8 text-center text-gray-400">Loading...</p>
            ) : drillDownData.length === 0 ? (
              <p className="py-8 text-center text-gray-400">No data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                    <tr>
                      {drillDownTitle === 'Active Sessions' && (
                        <>
                          <th className="px-4 py-3">Course Name</th>
                          <th className="px-4 py-3">Code</th>
                          <th className="px-4 py-3">Expected</th>
                          <th className="px-4 py-3">Present</th>
                          <th className="px-4 py-3">Late</th>
                          <th className="px-4 py-3">Absent</th>
                        </>
                      )}
                      {drillDownTitle === 'Total Students' && (
                        <>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Matric</th>
                        </>
                      )}
                      {(drillDownTitle === 'Total Present' || drillDownTitle === 'Total Late') && (
                        <>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Matric</th>
                          <th className="px-4 py-3">Course</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Sign-In</th>
                          <th className="px-4 py-3">Sign-Out</th>
                        </>
                      )}
                      {drillDownTitle === 'Absent Today' && (
                        <>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Matric</th>
                          <th className="px-4 py-3">Course</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {drillDownTitle === 'Active Sessions' &&
                      drillDownData.map((s: SessionStats) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{s.courseName}</td>
                          <td className="px-4 py-3 text-gray-500">{s.courseCode}</td>
                          <td className="px-4 py-3">{s.totalExpected}</td>
                          <td className="px-4 py-3">{s.totalPresent}</td>
                          <td className="px-4 py-3">{s.totalLate}</td>
                          <td className="px-4 py-3">{s.totalAbsent}</td>
                        </tr>
                      ))}

                    {drillDownTitle === 'Total Students' &&
                      drillDownData.map((s: StudentRecord) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">
                            {s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{s.email || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{s.matricNumber || '—'}</td>
                        </tr>
                      ))}

                    {(drillDownTitle === 'Total Present' || drillDownTitle === 'Total Late') &&
                      drillDownData.map((s: PresentStudentRecord, i: number) => (
                        <tr key={`${s.studentId}-${s.examSessionId}-${i}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{s.studentName}</td>
                          <td className="px-4 py-3 text-gray-500">{s.matricNumber}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {s.courseName} ({s.courseCode})
                          </td>
                          <td className="px-4 py-3">{statusBadge(s.status)}</td>
                          <td className="px-4 py-3 text-gray-500">{formatTime(s.signInTime)}</td>
                          <td className="px-4 py-3 text-gray-500">{formatTime(s.signOutTime)}</td>
                        </tr>
                      ))}

                    {drillDownTitle === 'Absent Today' &&
                      drillDownData.map((s: AbsentStudentRecord, i: number) => (
                        <tr key={`${s.studentId}-${s.examSessionId}-${i}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{s.studentName}</td>
                          <td className="px-4 py-3 text-gray-500">{s.matricNumber}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {s.courseName} ({s.courseCode})
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowDrillDown(false)}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendees Modal */}
      {showAttendees && selectedSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-blue-800">Attendees</h2>
              <button
                onClick={() => setShowAttendees(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                &times;
              </button>
            </div>
            {attendees.length === 0 ? (
              <p className="py-8 text-center text-gray-400">No attendees yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Matric</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sign-In</th>
                    <th className="px-4 py-3">Sign-Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendees.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{a.studentName}</td>
                      <td className="px-4 py-3 text-gray-500">{a.matricNumber}</td>
                      <td className="px-4 py-3">{statusBadge(a.status)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatTime(a.signInTime)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatTime(a.signOutTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAttendees(false)}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
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
