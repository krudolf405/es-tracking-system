import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import AdminLayout from '../../components/AdminLayout';
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

function ReportsPage() {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get<ExamSession[]>('/exam-sessions');
      setSessions(res.data);
    } catch {
      toast.error('Failed to load exam sessions');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (url: string, filename: string, label: string) => {
    setDownloading(label);
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success(`${filename} downloaded`);
    } catch {
      toast.error(`Failed to download ${filename}`);
    } finally {
      setDownloading(null);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
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
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Reports</h1>

      {loading && <p className="text-gray-400">Loading sessions...</p>}
      {!loading && sessions.length === 0 && (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-400 shadow">
          <p className="text-lg">No exam sessions found.</p>
        </div>
      )}

      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="rounded-lg border bg-white p-6 shadow">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{session.courseName}</h2>
                <p className="text-sm text-gray-500">{session.courseCode}</p>
              </div>
              {statusBadge(session.status)}
            </div>
            <div className="mb-4 text-sm text-gray-600">
              <span className="mr-4">Date: {session.date}</span>
              <span className="mr-4">Time: {session.startTime} - {session.endTime}</span>
              <span>Room: {session.room?.name || '—'}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  downloadFile(
                    `/reports/attendance/${session.id}/excel`,
                    `attendance-${session.courseCode}-${session.date}.xlsx`,
                    `excel-${session.id}`,
                  )
                }
                disabled={downloading === `excel-${session.id}`}
                className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
              >
                {downloading === `excel-${session.id}` ? 'Downloading...' : 'Attendance (Excel)'}
              </button>
              <button
                onClick={() =>
                  downloadFile(
                    `/reports/attendance/${session.id}/pdf`,
                    `attendance-${session.courseCode}-${session.date}.pdf`,
                    `att-pdf-${session.id}`,
                  )
                }
                disabled={downloading === `att-pdf-${session.id}`}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {downloading === `att-pdf-${session.id}` ? 'Downloading...' : 'Attendance (PDF)'}
              </button>
              <button
                onClick={() =>
                  downloadFile(
                    `/reports/incidents/${session.id}/pdf`,
                    `incidents-${session.courseCode}-${session.date}.pdf`,
                    `inc-pdf-${session.id}`,
                  )
                }
                disabled={downloading === `inc-pdf-${session.id}`}
                className="rounded bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {downloading === `inc-pdf-${session.id}` ? 'Downloading...' : 'Incidents (PDF)'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

export default ReportsPage;
