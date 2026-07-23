import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InvigilatorLayout from './InvigilatorLayout';
import api from '../../api/axios';

interface ExamSession {
  id: string;
  courseName: string;
  courseCode: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  room: { name: string } | null;
}

function InvigilatorDashboard() {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignedSessions();
  }, []);

  const fetchAssignedSessions = async () => {
    try {
      const res = await api.get<ExamSession[]>('/exam-sessions');
      setSessions(res.data.filter((s) => s.status === 'ACTIVE' || s.status === 'SCHEDULED'));
    } catch {
      console.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[status] || ''}`}>
        {status}
      </span>
    );
  };

  return (
    <InvigilatorLayout>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Invigilator Dashboard</h1>
      {loading && <p className="text-gray-400">Loading...</p>}
      {!loading && sessions.length === 0 && (
        <div className="text-center text-gray-400">
          <p className="text-lg">No exam sessions assigned to you.</p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {sessions.map((session) => (
          <div key={session.id} className="rounded-lg border bg-white p-6 shadow">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{session.courseName}</h2>
                <p className="text-sm text-gray-500">{session.courseCode}</p>
              </div>
              {statusBadge(session.status)}
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Date:</span> {session.date}</p>
              <p><span className="font-medium">Time:</span> {session.startTime} - {session.endTime}</p>
              <p><span className="font-medium">Room:</span> {session.room?.name || '—'}</p>
            </div>
            <div className="mt-4">
              <Link
                to={`/invigilator/scan?sessionId=${session.id}`}
                className="inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Scan Attendance
              </Link>
            </div>
          </div>
        ))}
      </div>
    </InvigilatorLayout>
  );
}

export default InvigilatorDashboard;
