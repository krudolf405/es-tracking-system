import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HealthCheck from './pages/HealthCheck';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentsPage from './pages/admin/StudentsPage';
import ExamsPage from './pages/admin/ExamsPage';
import RoomsPage from './pages/admin/RoomsPage';
import ReportsPage from './pages/admin/ReportsPage';
import StudentDashboard from './pages/student/StudentDashboard';
import InvigilatorDashboard from './pages/invigilator/InvigilatorDashboard';
import ScanAttendance from './pages/invigilator/ScanAttendance';

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <h1 className="text-2xl font-bold">Welcome to Exam Tracking System</h1>
          </Layout>
        }
      />
      <Route
        path="/health-check"
        element={
          <Layout>
            <HealthCheck />
          </Layout>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/students" element={<StudentsPage />} />
      <Route path="/admin/exams" element={<ExamsPage />} />
      <Route path="/admin/rooms" element={<RoomsPage />} />
      <Route path="/admin/reports" element={<ReportsPage />} />
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/invigilator/dashboard" element={<InvigilatorDashboard />} />
      <Route path="/invigilator/scan" element={<ScanAttendance />} />
    </Routes>
  );
}

export default App;
