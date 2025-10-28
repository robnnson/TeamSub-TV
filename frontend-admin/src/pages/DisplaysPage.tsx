import { useState, useEffect } from 'react';
import { Monitor, Plus, Trash2, Key, Circle, X, Copy, Check } from 'lucide-react';
import { api } from '../lib/api';
import type { Display } from '../types';

export default function DisplaysPage() {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    loadDisplays();
  }, []);

  const loadDisplays = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getDisplays();
      setDisplays(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load displays');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDisplay = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete display "${name}"?`)) return;

    try {
      await api.deleteDisplay(id);
      await loadDisplays();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete display');
    }
  };

  const handleRegenerateKey = async (id: string, name: string) => {
    if (!confirm(`Regenerate API key for "${name}"? The old key will stop working immediately.`)) return;

    try {
      const result = await api.regenerateDisplayKey(id);
      alert(`New API key generated:\n\n${result.apiKey}\n\nSave this key - it won't be shown again!`);
      await loadDisplays();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to regenerate API key');
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'text-green-500' : 'text-gray-400';
  };

  const getStatusBadge = (status: string) => {
    return status === 'online'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Display Management</h1>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Register Display
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : displays.length === 0 ? (
        <div className="card text-center py-12">
          <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No displays registered</h3>
          <p className="text-gray-600 mb-4">Register your first display to start broadcasting content.</p>
          <button onClick={() => setShowRegisterModal(true)} className="btn btn-primary">
            Register Display
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displays.map((display) => (
            <div key={display.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Monitor className="w-8 h-8 text-primary-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{display.name}</h3>
                    <p className="text-sm text-gray-500">{display.location}</p>
                  </div>
                </div>
                <Circle
                  className={`w-3 h-3 fill-current ${getStatusColor(display.status)}`}
                />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(display.status)}`}>
                    {display.status}
                  </span>
                </div>
                {display.lastSeen && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Seen:</span>
                    <span className="text-gray-900">
                      {new Date(display.lastSeen).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Registered:</span>
                  <span className="text-gray-900">
                    {new Date(display.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleRegenerateKey(display.id, display.name)}
                  className="flex-1 btn btn-secondary text-sm py-1.5 flex items-center justify-center gap-1"
                >
                  <Key className="w-3.5 h-3.5" />
                  New Key
                </button>
                <button
                  onClick={() => handleDeleteDisplay(display.id, display.name)}
                  className="btn btn-danger text-sm py-1.5 px-3"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            setShowRegisterModal(false);
            loadDisplays();
          }}
        />
      )}
    </div>
  );
}

function RegisterModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setRegistering(true);
      setError('');
      const result = await api.createDisplay({ name, location, pairingCode });
      setApiKey(result.apiKey || null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register display');
    } finally {
      setRegistering(false);
    }
  };

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (apiKey) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Display Registered!</h2>
            <button onClick={onSuccess} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 font-medium mb-2">✓ Display Paired Successfully!</p>
            <p className="text-green-700 text-sm">
              The display will automatically connect within a few seconds. No manual configuration needed!
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key (for reference)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKey}
                readOnly
                className="input flex-1 font-mono text-sm"
              />
              <button
                onClick={handleCopy}
                className="btn btn-secondary px-3"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>Automatic Pairing:</strong> The display is now paired and will automatically start showing content.
              The API key above is for reference only - the display already has it.
            </p>
          </div>

          <button onClick={onSuccess} className="btn btn-primary w-full">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Register Display</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pairing Code *
              </label>
              <input
                type="text"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code from display"
                className="input w-full font-mono text-lg tracking-wider text-center"
                required
                maxLength={6}
                pattern="\d{6}"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-digit code shown on the display screen
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lobby Display 1"
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Building A - Main Lobby"
                className="input w-full"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={registering}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={registering}
              >
                {registering ? 'Registering...' : 'Register'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
