import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
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

interface Attendee {
  id: string;
  studentId: string;
  studentName: string;
  matricNumber: string;
  status: string;
  signInTime: string;
  signOutTime: string | null;
}

interface ScanFeedback {
  type: 'success' | 'error';
  message: string;
}

type IncidentType = 'MALPRACTICE' | 'UNAUTHORIZED_ENTRY' | 'TECHNICAL_ISSUE' | 'OTHER';

function ScanAttendance() {
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get('sessionId');

  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState(sessionIdParam || '');
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);

  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState<IncidentType>('MALPRACTICE');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentStudentId, setIncidentStudentId] = useState('');
  const [submittingIncident, setSubmittingIncident] = useState(false);
  const [scanMode, setScanMode] = useState<'signin' | 'signout'>('signin');

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch {
        /* ignore cleanup errors */
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchAttendees(selectedSessionId);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    if (scanning) {
      stopScanner();
    }
  }, [scanMode, scanning, stopScanner]);

  const fetchSessions = async () => {
    try {
      const res = await api.get<ExamSession[]>('/exam-sessions');
      setSessions(res.data.filter((s) => s.status === 'ACTIVE' || s.status === 'SCHEDULED'));
    } catch {
      console.error('Failed to fetch sessions');
    }
  };

  const fetchAttendees = async (sessionId: string) => {
    try {
      const res = await api.get<Attendee[]>(`/attendance/session/${sessionId}`);
      setAttendees(res.data);
    } catch {
      setAttendees([]);
    }
  };

  const submitIncident = async () => {
    if (!incidentDescription.trim()) return;
    setSubmittingIncident(true);
    try {
      await api.post('/incidents', {
        examSessionId: selectedSessionId,
        studentId: incidentStudentId || undefined,
        type: incidentType,
        description: incidentDescription,
      });
      toast.success('Incident logged successfully');
      setShowIncidentModal(false);
      setIncidentDescription('');
      setIncidentStudentId('');
      setIncidentType('MALPRACTICE');
    } catch {
      toast.error('Failed to log incident');
    } finally {
      setSubmittingIncident(false);
    }
  };

  const handleScan = async (qrCodeHash: string) => {
    try {
      if (scanMode === 'signin') {
        const res = await api.post('/attendance/check-in', {
          examSessionId: selectedSessionId,
          qrCodeHash,
        });
        const { student, status } = res.data;
        setFeedback({ type: 'success', message: `Signed In: ${student.fullName} (${status})` });
      } else {
        const res = await api.post('/attendance/check-out', {
          examSessionId: selectedSessionId,
          qrCodeHash,
        });
        const { student } = res.data;
        setFeedback({ type: 'success', message: `Signed Out: ${student.fullName}` });
      }
      fetchAttendees(selectedSessionId);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Scan Error';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setTimeout(() => {
        html5QrCodeRef.current?.resume();
      }, 1500);
    }
  };

  const startScanner = async () => {
    if (!selectedSessionId) return;
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          scanner.pause();
          await handleScan(decodedText.trim());
        },
        () => {
          /* no-op */
        },
      );
    } catch (err) {
      console.error('Camera error:', err);
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

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

  const incidentTypes: { value: IncidentType; label: string }[] = [
    { value: 'MALPRACTICE', label: 'Malpractice' },
    { value: 'UNAUTHORIZED_ENTRY', label: 'Unauthorized Entry' },
    { value: 'TECHNICAL_ISSUE', label: 'Technical Issue' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <InvigilatorLayout>
      <Toaster position="top-right" richColors />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Scan Attendance</h1>
        {selectedSessionId && (
          <button
            onClick={() => setShowIncidentModal(true)}
            className="rounded bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700"
          >
            Log Incident
          </button>
        )}
      </div>

      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">Exam Session</label>
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="w-full max-w-md rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Select an exam session</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.courseName} ({s.courseCode}) - {s.date} {s.startTime}
            </option>
          ))}
        </select>
      </div>

      {feedback && (
        <div
          className={`mb-4 rounded p-3 text-center text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {selectedSessionId && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-6 shadow">
            <div className="mb-4 flex rounded-lg border bg-gray-100 p-1">
              <button
                onClick={() => setScanMode('signin')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                  scanMode === 'signin' ? 'bg-blue-800 text-white shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setScanMode('signout')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                  scanMode === 'signout' ? 'bg-orange-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign Out
              </button>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">QR Scanner</h2>
              {!scanning ? (
                <button
                  onClick={startScanner}
                  className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                  Start Scanning
                </button>
              ) : (
                <button
                  onClick={stopScanner}
                  className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                >
                  Stop Scanning
                </button>
              )}
            </div>
            <div
              ref={scannerRef}
              id="qr-reader"
              className="mx-auto w-full max-w-sm"
              style={{ minHeight: scanning ? 300 : 100 }}
            />
            <p className="mt-2 text-center text-xs text-gray-400">
              Requires HTTPS or localhost for camera access.
            </p>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-bold text-gray-800">
              Students ({attendees.length})
            </h2>
            {attendees.length === 0 ? (
              <p className="text-sm text-gray-400">No students checked in yet.</p>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {attendees.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded bg-gray-50 p-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{a.studentName}</p>
                      <p className="text-xs text-gray-500">{a.matricNumber}</p>
                    </div>
                    <div className="text-right">
                      {statusBadge(a.status)}
                      <p className="mt-1 text-xs text-gray-400">
                        In: {new Date(a.signInTime).toLocaleTimeString()}
                      </p>
                      {a.signOutTime ? (
                        <p className="text-xs text-gray-400">
                          Out: {new Date(a.signOutTime).toLocaleTimeString()}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">Out: —</p>
                      )}
                      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                        <div
                          className={`h-1.5 rounded-full ${
                            a.signOutTime ? 'bg-green-500' : 'bg-blue-800'
                          }`}
                          style={{ width: a.signOutTime ? '100%' : '50%' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-800">Log Incident</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Student</label>
                <select
                  value={incidentStudentId}
                  onChange={(e) => setIncidentStudentId(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- No specific student --</option>
                  {attendees.map((a) => (
                    <option key={a.studentId} value={a.studentId}>
                      {a.studentName} ({a.matricNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Incident Type</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                  className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {incidentTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Describe the incident..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowIncidentModal(false);
                  setIncidentDescription('');
                  setIncidentStudentId('');
                }}
                className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitIncident}
                disabled={submittingIncident || !incidentDescription.trim()}
                className="rounded bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {submittingIncident ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </InvigilatorLayout>
  );
}

export default ScanAttendance;
