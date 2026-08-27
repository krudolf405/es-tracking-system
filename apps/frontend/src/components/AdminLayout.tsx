import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Users', path: '/admin/users' },
  { label: 'Students', path: '/admin/students' },
  { label: 'Enrollments', path: '/admin/enrollments' },
  { label: 'Examinations', path: '/admin/exams' },
  { label: 'Rooms', path: '/admin/rooms' },
  { label: 'Reports', path: '/admin/reports' },
];

function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();

  if (!token || !user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-lg font-bold text-blue-800">Exam Tracking</h1>
          <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{user.role}</p>
        </div>
        <nav className="mt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block border-l-4 px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'border-blue-800 bg-blue-50 text-blue-900'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-64 border-t p-4">
          <div className="text-sm text-gray-600">{user.email}</div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="mt-2 text-sm text-red-500 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

export default AdminLayout;
