import { useState, useEffect } from 'react';
import { Shield, Wifi, AlertTriangle, Save, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

const FPCON_LEVELS = ['NORMAL', 'ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'];
const LAN_STATUSES = ['NORMAL', 'DEGRADED', 'OUTAGE'];

export default function SettingsPage() {
  const [fpconStatus, setFpconStatus] = useState('');
  const [lanStatus, setLanStatus] = useState('');
  const [loadingFpcon, setLoadingFpcon] = useState(true);
  const [loadingLan, setLoadingLan] = useState(true);
  const [savingFpcon, setSavingFpcon] = useState(false);
  const [savingLan, setSavingLan] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      setLoadingFpcon(true);
      setLoadingLan(true);
      setError('');

      const [fpcon, lan] = await Promise.all([
        api.getFpconStatus(),
        api.getLanStatus(),
      ]);

      setFpconStatus(fpcon.status);
      setLanStatus(lan.status);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load status settings');
    } finally {
      setLoadingFpcon(false);
      setLoadingLan(false);
    }
  };

  const handleSaveFpcon = async () => {
    try {
      setSavingFpcon(true);
      setError('');
      setSuccess('');

      await api.updateFpconStatus(fpconStatus);
      setSuccess('FPCON status updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update FPCON status');
    } finally {
      setSavingFpcon(false);
    }
  };

  const handleSaveLan = async () => {
    try {
      setSavingLan(true);
      setError('');
      setSuccess('');

      await api.updateLanStatus(lanStatus);
      setSuccess('LAN status updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update LAN status');
    } finally {
      setSavingLan(false);
    }
  };

  const getFpconColor = (level: string) => {
    switch (level) {
      case 'NORMAL':
        return 'bg-green-500';
      case 'ALPHA':
        return 'bg-blue-500';
      case 'BRAVO':
        return 'bg-yellow-500';
      case 'CHARLIE':
        return 'bg-orange-500';
      case 'DELTA':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getLanColor = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return 'bg-green-500';
      case 'DEGRADED':
        return 'bg-yellow-500';
      case 'OUTAGE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getFpconDescription = (level: string) => {
    switch (level) {
      case 'NORMAL':
        return 'Normal peacetime security measures';
      case 'ALPHA':
        return 'General threat of possible terrorist activity';
      case 'BRAVO':
        return 'Increased and more predictable threat of terrorist activity';
      case 'CHARLIE':
        return 'Incident occurred or intelligence received indicating terrorist action is imminent';
      case 'DELTA':
        return 'Terrorist attack has occurred or intelligence indicates imminent attack';
      default:
        return '';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={loadStatuses}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FPCON Status */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-lg ${fpconStatus ? getFpconColor(fpconStatus) : 'bg-gray-200'}`}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">FPCON Status</h2>
              <p className="text-sm text-gray-500">Force Protection Condition</p>
            </div>
          </div>

          {loadingFpcon ? (
            <div className="animate-pulse space-y-3">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Level
                </label>
                <select
                  value={fpconStatus}
                  onChange={(e) => setFpconStatus(e.target.value)}
                  className="input w-full"
                >
                  {FPCON_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              {fpconStatus && (
                <div className={`p-4 rounded-lg mb-4 ${
                  fpconStatus === 'NORMAL' ? 'bg-green-50 border border-green-200' :
                  fpconStatus === 'ALPHA' ? 'bg-blue-50 border border-blue-200' :
                  fpconStatus === 'BRAVO' ? 'bg-yellow-50 border border-yellow-200' :
                  fpconStatus === 'CHARLIE' ? 'bg-orange-50 border border-orange-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1 ${getFpconColor(fpconStatus)}`}></div>
                    <div>
                      <p className={`font-semibold mb-1 ${
                        fpconStatus === 'NORMAL' ? 'text-green-900' :
                        fpconStatus === 'ALPHA' ? 'text-blue-900' :
                        fpconStatus === 'BRAVO' ? 'text-yellow-900' :
                        fpconStatus === 'CHARLIE' ? 'text-orange-900' :
                        'text-red-900'
                      }`}>
                        FPCON {fpconStatus}
                      </p>
                      <p className={`text-sm ${
                        fpconStatus === 'NORMAL' ? 'text-green-700' :
                        fpconStatus === 'ALPHA' ? 'text-blue-700' :
                        fpconStatus === 'BRAVO' ? 'text-yellow-700' :
                        fpconStatus === 'CHARLIE' ? 'text-orange-700' :
                        'text-red-700'
                      }`}>
                        {getFpconDescription(fpconStatus)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveFpcon}
                disabled={savingFpcon}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {savingFpcon ? 'Updating...' : 'Update FPCON Status'}
              </button>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <strong>Note:</strong> Changing FPCON status will be displayed on all connected screens and may trigger automated security protocols.
              </div>
            </>
          )}
        </div>

        {/* LAN Status */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-lg ${lanStatus ? getLanColor(lanStatus) : 'bg-gray-200'}`}>
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">LAN Status</h2>
              <p className="text-sm text-gray-500">Network Operations</p>
            </div>
          </div>

          {loadingLan ? (
            <div className="animate-pulse space-y-3">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Network Status
                </label>
                <select
                  value={lanStatus}
                  onChange={(e) => setLanStatus(e.target.value)}
                  className="input w-full"
                >
                  {LAN_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {lanStatus && (
                <div className={`p-4 rounded-lg mb-4 ${
                  lanStatus === 'NORMAL' ? 'bg-green-50 border border-green-200' :
                  lanStatus === 'DEGRADED' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1 ${getLanColor(lanStatus)}`}></div>
                    <div>
                      <p className={`font-semibold mb-1 ${
                        lanStatus === 'NORMAL' ? 'text-green-900' :
                        lanStatus === 'DEGRADED' ? 'text-yellow-900' :
                        'text-red-900'
                      }`}>
                        {lanStatus === 'NORMAL' ? 'Network Operating Normally' :
                         lanStatus === 'DEGRADED' ? 'Network Performance Degraded' :
                         'Network Outage'}
                      </p>
                      <p className={`text-sm ${
                        lanStatus === 'NORMAL' ? 'text-green-700' :
                        lanStatus === 'DEGRADED' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {lanStatus === 'NORMAL' ? 'All network services are functioning normally' :
                         lanStatus === 'DEGRADED' ? 'Some network services may be slow or unavailable' :
                         'Network services are currently unavailable'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveLan}
                disabled={savingLan}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {savingLan ? 'Updating...' : 'Update LAN Status'}
              </button>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <strong>Note:</strong> Network status updates will be reflected on information displays throughout the facility.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Additional System Information */}
      <div className="card mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Application</span>
            <span className="font-medium text-gray-900">Team Submarine Digital Signage CMS</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Version</span>
            <span className="font-medium text-gray-900">1.0.0</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Environment</span>
            <span className="font-medium text-gray-900">Production</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">API Status</span>
            <span className="inline-flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-medium text-green-600">Connected</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
