import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
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
  remarks?: string;
}

function InvigilatorDashboard() {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [remarksModalSessionId, setRemarksModalSessionId] = useState<string | null>(null);
  const [remarksText, setRemarksText] = useState('');
  const [submittingRemarks, setSubmittingRemarks] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get<ExamSession[]>('/exam-sessions');
      setSessions(res.data.filter((s) => s.status === 'ACTIVE' || s.status === 'SCHEDULED' || s.status === 'COMPLETED'));
    } catch {
      console.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const submitRemarks = async () => {
    if (!remarksModalSessionId || !remarksText.trim()) return;
    setSubmittingRemarks(true);
    try {
      await api.patch(`/exam-sessions/${remarksModalSessionId}/remarks`, {
        remarks: remarksText,
      });
      toast.success('Remarks submitted successfully');
      setRemarksModalSessionId(null);
      setRemarksText('');
      fetchSessions();
    } catch {
      toast.error('Failed to submit remarks');
    } finally {
      setSubmittingRemarks(false);
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
            {session.status === 'COMPLETED' && (
              <div className="mt-3">
                {session.remarks ? (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Remarks:</p>
                    <p className="text-sm text-gray-700">{session.remarks}</p>
                    <button
                      onClick={() => {
                        setRemarksModalSessionId(session.id);
                        setRemarksText(session.remarks || '');
                      }}
                      className="mt-1 text-xs text-blue-800 hover:underline"
                    >
                      Edit Remarks
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setRemarksModalSessionId(session.id);
                      setRemarksText('');
                    }}
                    className="rounded bg-blue-800 px-3 py-1.5 text-xs text-white hover:bg-blue-900"
                  >
                    Add Remarks
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {remarksModalSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-800">Session Remarks</h2>
            <textarea
              value={remarksText}
              onChange={(e) => setRemarksText(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Enter overall remarks about this exam session..."
              className="w-full rounded border px-3 py-2 text-sm focus:border-blue-800 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">{remarksText.length}/1000 characters</p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setRemarksModalSessionId(null);
                  setRemarksText('');
                }}
                className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitRemarks}
                disabled={submittingRemarks || !remarksText.trim()}
                className="rounded bg-blue-800 px-4 py-2 text-sm text-white hover:bg-blue-900 disabled:opacity-50"
              >
                {submittingRemarks ? 'Submitting...' : 'Submit Remarks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </InvigilatorLayout>
  );
}

export default InvigilatorDashboard;
