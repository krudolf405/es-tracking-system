import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: ReactNode;
}

const dashboardPaths: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  LECTURER: '/student/dashboard',
  INVIGILATOR: '/invigilator/dashboard',
  STUDENT: '/student/dashboard',
};

function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-blue-800">
              Exam Tracking System
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-700 hover:text-blue-800">
                Home
              </Link>
              {isAuthenticated && user ? (
                <>
                  <Link
                    to={dashboardPaths[user.role] || '/'}
                    className="rounded-lg bg-blue-800 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-900"
                  >
                    My Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="rounded-lg border border-blue-800 px-4 py-1.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
                  >
                    Sign Up
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-lg bg-blue-800 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-900"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}

export default Layout;