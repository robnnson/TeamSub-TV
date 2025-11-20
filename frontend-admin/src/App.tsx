import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import ContentPage from './pages/ContentPage';
import DisplaysPage from './pages/DisplaysPage';
import DisplayGroupsPage from './pages/DisplayGroupsPage';
import SchedulesPage from './pages/SchedulesPage';
import SettingsPage from './pages/SettingsPage';
import TickerSettingsPage from './pages/TickerSettingsPage';
import UsersPage from './pages/UsersPage';
import PlaylistsPage from './pages/PlaylistsPage';
import ReleaseNotesPage from './pages/ReleaseNotesPage';
import HelpPage from './pages/HelpPage';
import DisplayMonitoringPage from './pages/DisplayMonitoringPage';
import PushNotificationUtility from './pages/PushNotificationUtility';
import NotificationSettingsPage from './pages/NotificationSettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="content" element={<ContentPage />} />
            <Route path="displays" element={<DisplaysPage />} />
            <Route path="display-groups" element={<DisplayGroupsPage />} />
            <Route path="display-monitoring" element={<DisplayMonitoringPage />} />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="playlists" element={<PlaylistsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="ticker" element={<TickerSettingsPage />} />
            <Route path="push-notifications" element={<PushNotificationUtility />} />
            <Route path="notification-settings" element={<NotificationSettingsPage />} />
            <Route path="release-notes" element={<ReleaseNotesPage />} />
            <Route path="help" element={<HelpPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
