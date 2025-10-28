import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, MessageSquare } from 'lucide-react';
import { api } from '../lib/api';

export default function TickerSettingsPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTickerMessages();
  }, []);

  const loadTickerMessages = async () => {
    try {
      setLoading(true);
      const setting = await api.getSetting('ticker_messages');
      const parsedMessages = JSON.parse(setting.value);
      setMessages(parsedMessages);
      setError('');
    } catch (err: any) {
      console.error('Failed to load ticker messages:', err);
      setError('Failed to load ticker messages');
      // Default messages if none exist
      setMessages([
        'Welcome to Team-Sub Navigator',
        'Stay informed with real-time transit updates and weather information',
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMessage = () => {
    setMessages([...messages, '']);
  };

  const handleRemoveMessage = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index));
  };

  const handleMessageChange = (index: number, value: string) => {
    const updated = [...messages];
    updated[index] = value;
    setMessages(updated);
  };

  const handleSave = async () => {
    // Filter out empty messages
    const filteredMessages = messages.filter(msg => msg.trim() !== '');

    if (filteredMessages.length === 0) {
      setError('Please add at least one message');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await api.updateSetting('ticker_messages', JSON.stringify(filteredMessages));

      setSuccess('Ticker messages saved successfully! Displays will update automatically.');
      setMessages(filteredMessages);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to save ticker messages:', err);
      setError(err.response?.data?.message || 'Failed to save ticker messages');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading ticker settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ticker Messages</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage the scrolling messages displayed at the bottom of all displays
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Messages'}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-800">{success}</div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Messages</h2>
          </div>
          <button
            onClick={handleAddMessage}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Message
          </button>
        </div>

        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No ticker messages yet</p>
              <p className="text-sm mt-2">Click "Add Message" to create your first ticker message</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600">{index + 1}</span>
                </div>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => handleMessageChange(index, e.target.value)}
                  placeholder="Enter ticker message..."
                  className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  onClick={() => handleRemoveMessage(index)}
                  className="flex-shrink-0 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                  title="Remove message"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Preview</h3>
          <div className="relative h-12 bg-gray-900 rounded overflow-hidden">
            <div className="absolute whitespace-nowrap animate-scroll">
              {messages.filter(m => m.trim()).map((msg, i) => (
                <span key={i} className="text-white text-sm mr-12">
                  ● {msg}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
          padding-left: 100%;
        }
      `}</style>
    </div>
  );
}
