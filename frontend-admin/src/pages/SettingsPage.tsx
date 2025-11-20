import { useState, useEffect } from 'react';
import { Shield, Wifi, AlertTriangle, Save, RefreshCw, Monitor, MessageSquare, RotateCcw, Train, Activity, Car, Bike, Newspaper } from 'lucide-react';
import { api } from '../lib/api';

const FPCON_LEVELS = ['NORMAL', 'ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'];
const LAN_STATUSES = ['NORMAL', 'DEGRADED', 'OUTAGE'];

export default function SettingsPage() {
  const [fpconStatus, setFpconStatus] = useState('');
  const [lanStatus, setLanStatus] = useState('');
  const [showTicker, setShowTicker] = useState(true);
  const [showRotatingCards, setShowRotatingCards] = useState(true);
  const [showMetroCard, setShowMetroCard] = useState(true);
  const [showStatusCard, setShowStatusCard] = useState(true);
  const [showDrivingCard, setShowDrivingCard] = useState(true);
  const [showBikeshareCard, setShowBikeshareCard] = useState(true);
  const [showNewsHeadlines, setShowNewsHeadlines] = useState(true);
  const [loadingFpcon, setLoadingFpcon] = useState(true);
  const [loadingLan, setLoadingLan] = useState(true);
  const [loadingDisplay, setLoadingDisplay] = useState(true);
  const [savingFpcon, setSavingFpcon] = useState(false);
  const [savingLan, setSavingLan] = useState(false);
  const [savingDisplay, setSavingDisplay] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      setLoadingFpcon(true);
      setLoadingLan(true);
      setLoadingDisplay(true);
      setError('');

      const [fpcon, lan, displayFeatures] = await Promise.all([
        api.getFpconStatus(),
        api.getLanStatus(),
        api.getDisplayFeatures(),
      ]);

      setFpconStatus(fpcon.status);
      setLanStatus(lan.status);
      setShowTicker(displayFeatures.showTicker);
      setShowRotatingCards(displayFeatures.showRotatingCards);
      setShowMetroCard(displayFeatures.showMetroCard);
      setShowStatusCard(displayFeatures.showStatusCard);
      setShowDrivingCard(displayFeatures.showDrivingCard);
      setShowBikeshareCard(displayFeatures.showBikeshareCard);
      setShowNewsHeadlines(displayFeatures.showNewsHeadlines);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load status settings');
    } finally {
      setLoadingFpcon(false);
      setLoadingLan(false);
      setLoadingDisplay(false);
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

  const handleSaveDisplayFeatures = async () => {
    try {
      setSavingDisplay(true);
      setError('');
      setSuccess('');

      await api.updateDisplayFeatures({
        showTicker,
        showRotatingCards,
        showMetroCard,
        showStatusCard,
        showDrivingCard,
        showBikeshareCard,
        showNewsHeadlines
      });
      setSuccess('Display features updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update display features');
    } finally {
      setSavingDisplay(false);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* Display Features */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-indigo-500">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Display Features</h2>
              <p className="text-sm text-gray-500">Control display elements</p>
            </div>
          </div>

          {loadingDisplay ? (
            <div className="animate-pulse space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-4">
                {/* News Ticker Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="font-medium text-gray-900">Ticker Banner</p>
                      <p className="text-sm text-gray-500">Show scrolling ticker at bottom of display</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTicker(!showTicker)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      showTicker ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        showTicker ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* News Headlines Toggle - Only show when ticker is enabled */}
                {showTicker && (
                  <div className="ml-8 flex items-center justify-between p-3 bg-gray-100 rounded-lg border border-gray-300">
                    <div className="flex items-center gap-3">
                      <Newspaper className="w-4 h-4 text-indigo-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Navy/DoD News Headlines</p>
                        <p className="text-xs text-gray-500">Show RSS news headlines in ticker</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowNewsHeadlines(!showNewsHeadlines)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showNewsHeadlines ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showNewsHeadlines ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* Rotating Cards Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="font-medium text-gray-900">Rotating Cards</p>
                      <p className="text-sm text-gray-500">Show Metro, Status, Driving Times, and Bikeshare panels</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRotatingCards(!showRotatingCards)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      showRotatingCards ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        showRotatingCards ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Individual Card Toggles - Only show when rotating cards are enabled */}
                {showRotatingCards && (
                  <div className="ml-8 space-y-3 mt-3 p-4 bg-gray-100 rounded-lg border border-gray-300">
                    <p className="text-sm font-medium text-gray-700 mb-2">Individual Card Settings:</p>

                    {/* Metro Card */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Train className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm text-gray-900">Metro Arrivals</span>
                      </div>
                      <button
                        onClick={() => setShowMetroCard(!showMetroCard)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          showMetroCard ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            showMetroCard ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Status Card */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm text-gray-900">FPCON/LAN Status</span>
                      </div>
                      <button
                        onClick={() => setShowStatusCard(!showStatusCard)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          showStatusCard ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            showStatusCard ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Driving Times Card */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm text-gray-900">Driving Times</span>
                      </div>
                      <button
                        onClick={() => setShowDrivingCard(!showDrivingCard)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          showDrivingCard ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            showDrivingCard ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Bikeshare Card */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bike className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm text-gray-900">Capital Bikeshare</span>
                      </div>
                      <button
                        onClick={() => setShowBikeshareCard(!showBikeshareCard)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          showBikeshareCard ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            showBikeshareCard ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveDisplayFeatures}
                disabled={savingDisplay}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {savingDisplay ? 'Updating...' : 'Update Display Features'}
              </button>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <strong>Note:</strong> Display feature changes will take effect immediately on all connected displays via real-time updates.
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
