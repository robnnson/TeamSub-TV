import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  FileText,
  Monitor,
  Calendar,
  Settings,
  LogOut,
  Shield,
  Users,
  MessageSquare,
  List,
} from 'lucide-react';
import { clsx } from 'clsx';
import { api } from '../../lib/api';
import ChangePasswordModal from '../ChangePasswordModal';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Content', href: '/content', icon: FileText },
  { name: 'Displays', href: '/displays', icon: Monitor },
  { name: 'Schedules', href: '/schedules', icon: Calendar },
  { name: 'Playlists', href: '/playlists', icon: List },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Ticker Messages', href: '/ticker', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    // Check if user must change password
    setShowChangePassword(api.mustChangePassword());
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePasswordChanged = () => {
    setShowChangePassword(false);
    // Reload the page to clear the flag
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200">
            <Shield className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="font-bold text-gray-900">Team Submarine</h1>
              <p className="text-xs text-gray-500">Admin Portal</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal onSuccess={handlePasswordChanged} />
      )}
    </div>
  );
}
