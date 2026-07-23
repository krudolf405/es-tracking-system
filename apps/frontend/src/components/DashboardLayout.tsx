import { ReactNode, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  const { token, user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  if (!token || !user) {
    return null;
  }

  const dashboardLink =
    user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-6">
            <Link to={dashboardLink} className="text-xl font-bold text-blue-600">
              Exam Tracking System
            </Link>
            <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              {user.role}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

export default DashboardLayout;
