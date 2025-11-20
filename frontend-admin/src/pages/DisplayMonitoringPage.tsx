import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Cpu,
  HardDrive,
  Clock,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export default function DisplayMonitoringPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['displays-health'],
    queryFn: () => api.getAllDisplaysHealth(),
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['display-alerts'],
    queryFn: () => api.getDisplayAlerts(),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const handleManualRefresh = () => {
    refetchHealth();
    refetchAlerts();
  };

  // Calculate summary stats
  const summary = healthData ? {
    total: healthData.length,
    online: healthData.filter(d => d.status === 'online').length,
    offline: healthData.filter(d => d.status === 'offline').length,
    avgUptime: healthData.reduce((sum, d) => sum + d.uptime, 0) / healthData.length,
    avgHealthScore: healthData.reduce((sum, d) => sum + d.healthScore, 0) / healthData.length,
  } : null;

  const criticalAlerts = alerts?.filter(a => a.severity === 'high') || [];
  const warningAlerts = alerts?.filter(a => a.severity === 'medium') || [];

  if (healthLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Display Monitoring</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time health metrics and performance monitoring
          </p>
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Auto-refresh (30s)
          </label>
          <button
            onClick={handleManualRefresh}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Displays</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {summary.total}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Online</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {summary.online}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Offline</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {summary.offline}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Uptime</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {summary.avgUptime.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Health</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {summary.avgHealthScore.toFixed(0)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            Active Alerts ({alerts.length})
          </h2>
          <div className="space-y-2">
            {criticalAlerts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                  Critical ({criticalAlerts.length})
                </h3>
                {criticalAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-red-900 dark:text-red-100">{alert.displayName}</p>
                        <p className="text-sm text-red-800 dark:text-red-200 mt-1">{alert.message}</p>
                      </div>
                      <span className="text-xs text-red-600 dark:text-red-400">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {warningAlerts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2 mt-4">
                  Warnings ({warningAlerts.length})
                </h3>
                {warningAlerts.slice(0, 5).map((alert, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg mb-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-orange-900 dark:text-orange-100">{alert.displayName}</p>
                        <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">{alert.message}</p>
                      </div>
                      <span className="text-xs text-orange-600 dark:text-orange-400">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                {warningAlerts.length > 5 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    + {warningAlerts.length - 5} more warnings
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Display Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthData?.map((health) => (
          <div key={health.displayId} className="card p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{health.displayName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {health.status === 'online' ? (
                    <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                      <XCircle className="w-4 h-4" />
                      Offline
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  health.healthScore >= 90 ? 'text-green-600 dark:text-green-400' :
                  health.healthScore >= 70 ? 'text-orange-600 dark:text-orange-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {health.healthScore}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Health Score</div>
              </div>
            </div>

            {/* Uptime */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Uptime</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {health.uptime.toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    health.uptime >= 95 ? 'bg-green-600' :
                    health.uptime >= 80 ? 'bg-orange-600' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${health.uptime}%` }}
                />
              </div>
            </div>

            {/* Performance Metrics */}
            {health.performanceMetrics && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {health.performanceMetrics.cpuUsage !== undefined && (
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <Cpu className="w-4 h-4 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                    <div className="text-xs text-gray-600 dark:text-gray-400">CPU</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {health.performanceMetrics.cpuUsage.toFixed(0)}%
                    </div>
                  </div>
                )}
                {health.performanceMetrics.memoryUsage !== undefined && (
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <Activity className="w-4 h-4 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
                    <div className="text-xs text-gray-600 dark:text-gray-400">Memory</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {health.performanceMetrics.memoryUsage.toFixed(0)}%
                    </div>
                  </div>
                )}
                {health.performanceMetrics.diskUsage !== undefined && (
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <HardDrive className="w-4 h-4 mx-auto mb-1 text-green-600 dark:text-green-400" />
                    <div className="text-xs text-gray-600 dark:text-gray-400">Disk</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {health.performanceMetrics.diskUsage.toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400">Total Heartbeats</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{health.totalHeartbeats}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Missed</div>
                <div className="font-medium text-red-600 dark:text-red-400">{health.missedHeartbeats}</div>
              </div>
              {health.lastHeartbeat && (
                <div className="col-span-2">
                  <div className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last Heartbeat
                  </div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(health.lastHeartbeat).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Errors */}
            {health.errorLogs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Recent Errors ({health.errorLogs.length})
                </div>
                <div className="space-y-1">
                  {health.errorLogs.slice(0, 2).map((error, idx) => (
                    <div key={idx} className="text-xs">
                      <span className={`font-medium ${
                        error.severity === 'high' ? 'text-red-600 dark:text-red-400' :
                        error.severity === 'medium' ? 'text-orange-600 dark:text-orange-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        [{error.severity}]
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 ml-1">{error.message}</span>
                    </div>
                  ))}
                  {health.errorLogs.length > 2 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      + {health.errorLogs.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
