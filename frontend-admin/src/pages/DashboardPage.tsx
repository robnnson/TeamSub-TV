import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Monitor, FileText, Calendar, AlertCircle, CheckCircle, Clock, TrendingUp, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function DashboardPage() {
  const { data: contentStats } = useQuery({
    queryKey: ['content-stats'],
    queryFn: () => api.getContentStats(),
  });

  const { data: displayStats } = useQuery({
    queryKey: ['display-stats'],
    queryFn: () => api.getDisplayStats(),
  });

  const { data: scheduleStats } = useQuery({
    queryKey: ['schedule-stats'],
    queryFn: () => api.getScheduleStats(),
  });

  const { data: fpconStatus } = useQuery({
    queryKey: ['fpcon-status'],
    queryFn: () => api.getFpconStatus(),
  });

  const { data: lanStatus } = useQuery({
    queryKey: ['lan-status'],
    queryFn: () => api.getLanStatus(),
  });

  const { data: recentContent } = useQuery({
    queryKey: ['recent-content'],
    queryFn: async () => {
      const content = await api.getContent();
      return content.slice(0, 5); // Get 5 most recent
    },
  });

  const { data: allDisplays } = useQuery({
    queryKey: ['all-displays'],
    queryFn: () => api.getDisplays(),
  });

  const stats = [
    {
      name: 'Total Content',
      value: contentStats?.total || 0,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      name: 'Online Displays',
      value: displayStats?.online || 0,
      total: displayStats?.total || 0,
      icon: Monitor,
      color: 'bg-green-500',
    },
    {
      name: 'Active Schedules',
      value: scheduleStats?.active || 0,
      icon: Calendar,
      color: 'bg-purple-500',
    },
  ];

  const getFpconColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'NORMAL':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ALPHA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'BRAVO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CHARLIE':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'DELTA':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLanColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'NORMAL':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DEGRADED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'OUTAGE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome to the Team Submarine Digital Signage Admin Portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {stat.value}
                    {stat.total !== undefined && (
                      <span className="text-lg text-gray-500 dark:text-gray-400 ml-2">/ {stat.total}</span>
                    )}
                  </p>
                </div>
                <div className={`${stat.color} p-4 rounded-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* FPCON Status */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">FPCON Status</h2>
          </div>
          <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 ${getFpconColor(fpconStatus?.status)}`}>
            <span className="text-2xl font-bold">{fpconStatus?.status || 'Loading...'}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Force Protection Condition Level</p>
        </div>

        {/* LAN Status */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">LAN Status</h2>
          </div>
          <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 ${getLanColor(lanStatus?.status)}`}>
            <span className="text-2xl font-bold">{lanStatus?.status || 'Loading...'}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Local Area Network Status</p>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Content Distribution Chart */}
        {contentStats && contentStats.byType && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Content Distribution
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(contentStats.byType).map(([type, count]) => ({
                    name: type.charAt(0).toUpperCase() + type.slice(1),
                    value: count,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.keys(contentStats.byType).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#0284c7', '#7c3aed', '#f59e0b', '#10b981'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Content
          </h2>
          <div className="space-y-3">
            {recentContent && recentContent.length > 0 ? (
              recentContent.map((content) => (
                <div key={content.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      content.type === 'image' ? 'bg-blue-500' :
                      content.type === 'video' ? 'bg-purple-500' :
                      content.type === 'text' ? 'bg-orange-500' :
                      'bg-green-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{content.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{content.type}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(content.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No recent content</p>
            )}
          </div>
        </div>
      </div>

      {/* Display Status Overview */}
      {allDisplays && allDisplays.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Display Status Overview</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              {
                name: 'Displays',
                Online: allDisplays.filter(d => {
                  if (!(d as any).lastHeartbeat) return false;
                  const lastSeen = new Date((d as any).lastHeartbeat);
                  const now = new Date();
                  return (now.getTime() - lastSeen.getTime()) / 1000 < 120;
                }).length,
                Offline: allDisplays.filter(d => {
                  if (!(d as any).lastHeartbeat) return true;
                  const lastSeen = new Date((d as any).lastHeartbeat);
                  const now = new Date();
                  return (now.getTime() - lastSeen.getTime()) / 1000 >= 120;
                }).length,
              },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Online" fill="#10b981" />
              <Bar dataKey="Offline" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/content"
            className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg transition-colors"
          >
            <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Add Content</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upload new media</p>
            </div>
          </a>
          <a
            href="/displays"
            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors"
          >
            <Monitor className="w-6 h-6 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Register Display</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add new screen</p>
            </div>
          </a>
          <a
            href="/schedules"
            className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors"
          >
            <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Create Schedule</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Plan content display</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
