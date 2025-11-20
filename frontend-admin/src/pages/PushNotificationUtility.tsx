import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Bell, Send, TestTube, RefreshCw } from 'lucide-react';

interface NotificationForm {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  requireInteraction: boolean;
}

export default function PushNotificationUtility() {
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    body: '',
    url: '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    requireInteraction: false,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [subscriptionCount, setSubscriptionCount] = useState<number | null>(null);

  // Load subscription count on mount
  useEffect(() => {
    loadSubscriptionCount();
  }, []);

  const loadSubscriptionCount = async () => {
    try {
      const subscriptions = await api.getPushSubscriptions();
      setSubscriptionCount(subscriptions.length);
    } catch (error) {
      console.error('Failed to load subscription count:', error);
    }
  };

  const handleInputChange = (field: keyof NotificationForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const sendTestNotification = async () => {
    setLoading(true);
    setResult(null);

    try {
      await api.sendTestNotification();
      setResult({
        success: true,
        message: 'Test notification sent successfully to your subscribed devices!',
      });
      loadSubscriptionCount();
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Failed to send test notification',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendBroadcast = async () => {
    if (!form.title || !form.body) {
      setResult({
        success: false,
        message: 'Title and body are required',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload: any = {
        title: form.title,
        body: form.body,
      };

      if (form.url) payload.url = form.url;
      if (form.icon) payload.icon = form.icon;
      if (form.badge) payload.badge = form.badge;
      if (form.requireInteraction) payload.requireInteraction = true;

      const response = await api.broadcastNotification(payload);

      setResult({
        success: true,
        message: `Notification sent to ${response.sent} user(s)!`,
      });

      // Reset form on success
      setForm({
        title: '',
        body: '',
        url: '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        requireInteraction: false,
      });

      loadSubscriptionCount();
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Failed to send broadcast notification',
      });
    } finally {
      setLoading(false);
    }
  };

  const quickFillTemplate = (template: 'maintenance' | 'update' | 'alert') => {
    switch (template) {
      case 'maintenance':
        setForm({
          title: '🔧 Scheduled Maintenance',
          body: 'System maintenance scheduled for tonight at 2 AM EST. Expected downtime: 30 minutes.',
          url: '/displays',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          requireInteraction: true,
        });
        break;
      case 'update':
        setForm({
          title: '✨ New Feature Available',
          body: 'Check out the new display monitoring enhancements in the admin portal!',
          url: '/monitoring',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          requireInteraction: false,
        });
        break;
      case 'alert':
        setForm({
          title: '⚠️ System Alert',
          body: 'Multiple displays are experiencing connectivity issues. Please investigate.',
          url: '/displays',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          requireInteraction: true,
        });
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Push Notification Utility
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Send push notifications to all subscribed users. Perfect for system announcements,
          maintenance notifications, or testing.
        </p>
      </div>

      {/* Subscription Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Subscriptions</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {subscriptionCount !== null ? subscriptionCount : '...'}
              </p>
            </div>
            <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Notification Type</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Broadcast to All Users
          </div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Ready to Send</span>
          </div>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Templates</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => quickFillTemplate('maintenance')}
            className="btn-secondary"
            disabled={loading}
          >
            🔧 Maintenance
          </button>
          <button
            onClick={() => quickFillTemplate('update')}
            className="btn-secondary"
            disabled={loading}
          >
            ✨ Update
          </button>
          <button
            onClick={() => quickFillTemplate('alert')}
            className="btn-secondary"
            disabled={loading}
          >
            ⚠️ Alert
          </button>
        </div>
      </div>

      {/* Notification Form */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Compose Notification
        </h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter notification title"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message *
            </label>
            <textarea
              value={form.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              placeholder="Enter notification message"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Action URL (optional)
            </label>
            <input
              type="text"
              value={form.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="/displays or https://example.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              URL to open when notification is clicked
            </p>
          </div>

          {/* Advanced Options */}
          <details className="border-t dark:border-gray-700 pt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Advanced Options
            </summary>
            <div className="space-y-4 mt-4">
              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Icon URL
                </label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => handleInputChange('icon', e.target.value)}
                  placeholder="/icons/icon-192x192.png"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* Badge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Badge URL
                </label>
                <input
                  type="text"
                  value={form.badge}
                  onChange={(e) => handleInputChange('badge', e.target.value)}
                  placeholder="/icons/icon-72x72.png"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* Require Interaction */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requireInteraction}
                    onChange={(e) => handleInputChange('requireInteraction', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Require user interaction (notification won't auto-dismiss)
                  </span>
                </label>
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <div
          className={`p-4 rounded-lg ${
            result.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-xl">
              {result.success ? '✅' : '❌'}
            </span>
            <div className="flex-1">
              <p className="font-medium">{result.success ? 'Success!' : 'Error'}</p>
              <p className="text-sm mt-1">{result.message}</p>
            </div>
            <button
              onClick={() => setResult(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={sendBroadcast}
          disabled={loading || !form.title || !form.body}
          className="btn-primary flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Sending...' : `Send to All Users (${subscriptionCount || 0})`}
        </button>

        <button
          onClick={sendTestNotification}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <TestTube className="w-4 h-4" />
          {loading ? 'Sending...' : 'Send Test to Myself'}
        </button>

        <button
          onClick={loadSubscriptionCount}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Count
        </button>
      </div>

      {/* Help Text */}
      <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-2">
          💡 Tips
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Use emojis in titles to make notifications more eye-catching</li>
          <li>• Keep messages concise - most platforms truncate long text</li>
          <li>• Test notifications send only to your subscribed devices</li>
          <li>• Broadcasts send to all users who have subscribed to notifications</li>
          <li>• Users can manage their notification preferences in their settings</li>
        </ul>
      </div>
    </div>
  );
}
