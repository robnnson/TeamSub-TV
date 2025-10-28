import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Monitor, FileText, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';

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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the Team Submarine Digital Signage Admin Portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                    {stat.total !== undefined && (
                      <span className="text-lg text-gray-500 ml-2">/ {stat.total}</span>
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
            <AlertCircle className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">FPCON Status</h2>
          </div>
          <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 ${getFpconColor(fpconStatus?.status)}`}>
            <span className="text-2xl font-bold">{fpconStatus?.status || 'Loading...'}</span>
          </div>
          <p className="text-sm text-gray-500 mt-3">Force Protection Condition Level</p>
        </div>

        {/* LAN Status */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">LAN Status</h2>
          </div>
          <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 ${getLanColor(lanStatus?.status)}`}>
            <span className="text-2xl font-bold">{lanStatus?.status || 'Loading...'}</span>
          </div>
          <p className="text-sm text-gray-500 mt-3">Local Area Network Status</p>
        </div>
      </div>

      {/* Content Breakdown */}
      {contentStats && contentStats.byType && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Content by Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(contentStats.byType).map(([type, count]) => (
              <div key={type} className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 capitalize">{type}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/content"
            className="flex items-center gap-3 p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <FileText className="w-6 h-6 text-primary-600" />
            <div>
              <p className="font-medium text-gray-900">Add Content</p>
              <p className="text-sm text-gray-600">Upload new media</p>
            </div>
          </a>
          <a
            href="/displays"
            className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <Monitor className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Register Display</p>
              <p className="text-sm text-gray-600">Add new screen</p>
            </div>
          </a>
          <a
            href="/schedules"
            className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <Clock className="w-6 h-6 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">Create Schedule</p>
              <p className="text-sm text-gray-600">Plan content display</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
