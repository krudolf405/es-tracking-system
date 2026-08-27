import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';

interface Profile {
  id: string;
  fullName: string;
  matricNumber: string;
  email: string;
  qrCodeHash: string;
}

interface Attendance {
  signInTime: string;
  signOutTime: string | null;
  status: string;
}

interface ExamEntry {
  examSession: {
    id: string;
    courseName: string;
    courseCode: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    roomName: string;
  };
  attendance: Attendance | null;
  progress: 0 | 50 | 100;
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

function StudentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exams, setExams] = useState<ExamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrBlobUrl, setQrBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAll = async () => {
      try {
        setLoading(true);
        const [profileRes, examsRes] = await Promise.all([
          api.get<Profile>('/students/me', { signal: controller.signal }),
          api.get<ExamEntry[]>('/students/me/exams', { signal: controller.signal }),
        ]);
        setProfile(profileRes.data);
        setExams(examsRes.data);

        setQrLoading(true);
        const qrRes = await api.get('/students/me/qrcode', {
          responseType: 'blob',
          signal: controller.signal,
        });
        const blobUrl = URL.createObjectURL(qrRes.data);
        setQrBlobUrl(blobUrl);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'CanceledError') return;
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
        setQrLoading(false);
      }
    };

    fetchAll();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (qrBlobUrl) URL.revokeObjectURL(qrBlobUrl);
    };
  }, [qrBlobUrl]);

  const handleDownloadQR = async () => {
    try {
      const res = await api.get('/students/me/qrcode', { responseType: 'blob' });
      downloadBlob(res.data, `qr-code-${profile?.matricNumber || 'student'}.png`);
    } catch {
      toast.error('Failed to download QR code');
    }
  };

  const handleDownloadBulkQR = async () => {
    try {
      const res = await api.get('/students/me/qrcode/bulk', { responseType: 'blob' });
      downloadBlob(res.data, 'all-qr-codes.zip');
    } catch {
      toast.error('Failed to download QR codes');
    }
  };

  const progressConfig: Record<number, { color: string; label: string }> = {
    0: { color: 'bg-gray-300', label: 'Not Started' },
    50: { color: 'bg-blue-800', label: 'In Progress — Signed In' },
    100: { color: 'bg-green-600', label: 'Completed — Signed Out' },
  };

  const attendanceBadge = (status: string) => {
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

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DashboardLayout>
      <Toaster position="top-right" richColors />
      {loading && <p className="text-gray-400">Loading dashboard...</p>}

      {!loading && profile && (
        <>
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">Welcome, {profile.fullName}</h1>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {profile.matricNumber}
            </span>
          </div>

          {/* QR Code Card */}
          <div className="mb-8 rounded-lg border bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">My QR Code</h2>
            {qrLoading ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-gray-400">Loading QR code...</p>
              </div>
            ) : qrBlobUrl ? (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={qrBlobUrl}
                  alt="My QR Code"
                  className="h-48 w-48 rounded border object-contain"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleDownloadQR}
                    className="rounded bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900"
                  >
                    Download QR Code
                  </button>
                  <button
                    onClick={handleDownloadBulkQR}
                    className="rounded border border-blue-800 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50"
                  >
                    Download All QR Codes (ZIP)
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">QR code not available.</p>
            )}
          </div>

          {/* Exams Grid */}
          <h2 className="mb-4 text-lg font-semibold text-gray-800">My Exams</h2>
          {exams.length === 0 ? (
            <div className="rounded-lg border bg-white p-8 text-center text-gray-400 shadow">
              <p className="text-lg">No exam sessions enrolled. Contact your administrator.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {exams.map((entry) => {
                const cfg = progressConfig[entry.progress];
                return (
                  <div
                    key={entry.examSession.id}
                    className="rounded-lg border bg-white p-6 shadow transition hover:shadow-md"
                  >
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-800">
                        {entry.examSession.courseName}
                      </h3>
                      <p className="text-sm text-gray-500">{entry.examSession.courseCode}</p>
                    </div>

                    <div className="mb-4 space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Date:</span> {entry.examSession.date}
                      </p>
                      <p>
                        <span className="font-medium">Time:</span> {entry.examSession.startTime} –{' '}
                        {entry.examSession.endTime}
                      </p>
                      <p>
                        <span className="font-medium">Room:</span> {entry.examSession.roomName}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">{cfg.label}</span>
                        <span className="text-xs text-gray-400">{entry.progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${cfg.color}`}
                          style={{ width: `${entry.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Attendance Details */}
                    {entry.attendance && (
                      <div className="mb-3 rounded bg-gray-50 p-3 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Signed In:</span>{' '}
                          {formatTime(entry.attendance.signInTime)}
                        </p>
                        <p>
                          <span className="font-medium">Signed Out:</span>{' '}
                          {formatTime(entry.attendance.signOutTime)}
                        </p>
                      </div>
                    )}

                    {/* Status Badge */}
                    {entry.attendance && (
                      <div>{attendanceBadge(entry.attendance.status)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

export default StudentDashboard;
