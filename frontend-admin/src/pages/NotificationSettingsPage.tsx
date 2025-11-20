import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Bell, BellOff, Check, X, Smartphone, Monitor, RefreshCw, AlertCircle, Info } from 'lucide-react';

interface NotificationPreferences {
  displayOffline: boolean;
  displayOnline: boolean;
  highErrors: boolean;
  lowUptime: boolean;
  performanceIssues: boolean;
}

interface Subscription {
  id: string;
  endpoint: string;
  preferences: NotificationPreferences;
  createdAt: string;
  userAgent?: string;
}

export default function NotificationSettingsPage() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<PushSubscription | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    displayOffline: true,
    displayOnline: true,
    highErrors: true,
    lowUptime: true,
    performanceIssues: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // iOS detection
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  const isStandalone = () => {
    return (window.matchMedia('(display-mode: standalone)').matches) ||
           ((window.navigator as any).standalone === true);
  };

  const isPushSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  };

  useEffect(() => {
    checkSubscriptionStatus();
    loadSubscriptions();
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setCurrentSubscription(subscription);
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const subs = await api.getPushSubscriptions();
      setSubscriptions(subs);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    console.log('Requesting notification permission...');
    console.log('Current permission:', Notification.permission);
    console.log('Is iOS:', isIOS());
    console.log('Is Standalone:', isStandalone());
    console.log('Push supported:', isPushSupported());

    if (!('Notification' in window)) {
      setMessage({ type: 'error', text: 'Notifications are not supported in this browser' });
      return false;
    }

    if (Notification.permission === 'granted') {
      console.log('Permission already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      const msg = isIOS()
        ? 'Notification permission was denied. On iOS, you need to:\n1. Open Settings app\n2. Scroll down to find this app\n3. Enable Notifications'
        : 'Notification permission was denied. Please enable it in your browser settings.';
      setMessage({
        type: 'error',
        text: msg,
      });
      return false;
    }

    try {
      console.log('Calling Notification.requestPermission()...');
      const result = await Notification.requestPermission();
      console.log('Permission result:', result);
      setPermission(result);

      if (result === 'granted') {
        return true;
      } else {
        const msg = isIOS()
          ? 'Permission denied. Check Settings > This App > Notifications'
          : 'Notification permission was denied';
        setMessage({ type: 'error', text: msg });
        return false;
      }
    } catch (error: any) {
      console.error('Permission request error:', error);
      setMessage({
        type: 'error',
        text: `Failed to request notification permission: ${error.message || 'Unknown error'}`
      });
      return false;
    }
  };

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  };

  const subscribe = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Check browser support
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported in this browser');
      }

      // Request permission
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        setLoading(false);
        return;
      }

      // Wait for service worker
      const registration = await navigator.serviceWorker.ready;

      // VAPID public key from backend
      const vapidPublicKey = 'BKjUcgQrGNZSQuYdMmTRXNgZNP1HiuyQSyZXY-3JsYRBCDxf54ZqEqN77jkyA5DiQGKhU-edr3AOQuHYtTZ9zGM';

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      // Send to backend
      const subJSON = subscription.toJSON();
      await api.subscribeToPushNotifications({
        endpoint: subJSON.endpoint!,
        keys: {
          p256dh: subJSON.keys!.p256dh,
          auth: subJSON.keys!.auth,
        },
        preferences,
      });

      setCurrentSubscription(subscription);
      setIsSubscribed(true);
      setMessage({
        type: 'success',
        text: 'Successfully subscribed to push notifications! You will now receive alerts on this device.',
      });

      // Reload subscriptions list
      await loadSubscriptions();
    } catch (error: any) {
      console.error('Subscription error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to subscribe to push notifications',
      });
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    setMessage(null);

    try {
      if (currentSubscription) {
        // Unsubscribe from push manager
        await currentSubscription.unsubscribe();

        // Remove from backend
        const endpoint = encodeURIComponent(currentSubscription.endpoint);
        await api.unsubscribeFromPushNotifications(endpoint);

        setCurrentSubscription(null);
        setIsSubscribed(false);
        setMessage({
          type: 'success',
          text: 'Successfully unsubscribed from push notifications on this device.',
        });

        // Reload subscriptions list
        await loadSubscriptions();
      }
    } catch (error: any) {
      console.error('Unsubscribe error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to unsubscribe from push notifications',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async () => {
    if (!currentSubscription) return;

    setLoading(true);
    setMessage(null);

    try {
      const endpoint = encodeURIComponent(currentSubscription.endpoint);
      await api.updatePushNotificationPreferences(endpoint, preferences);

      setMessage({
        type: 'success',
        text: 'Notification preferences updated successfully!',
      });

      // Reload subscriptions list
      await loadSubscriptions();
    } catch (error: any) {
      console.error('Update preferences error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update notification preferences',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await api.sendTestNotification();
      setMessage({
        type: 'success',
        text: 'Test notification sent! Check your device for the notification.',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send test notification',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="w-5 h-5" />;
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const getDeviceName = (endpoint: string, userAgent?: string) => {
    const current = currentSubscription?.endpoint === endpoint;
    let name = 'Unknown Device';

    if (userAgent) {
      if (userAgent.includes('Chrome')) name = 'Chrome Browser';
      else if (userAgent.includes('Firefox')) name = 'Firefox Browser';
      else if (userAgent.includes('Safari')) name = 'Safari Browser';
      else if (userAgent.includes('Edge')) name = 'Edge Browser';
    }

    return current ? `${name} (This Device)` : name;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Notification Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage push notifications and preferences for this device
        </p>
      </div>

      {/* iOS PWA Information Banner */}
      {isIOS() && !isStandalone() && (
        <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                iOS Push Notifications Require Installation
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                On iOS devices, push notifications only work when the app is installed to your home screen.
              </p>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>Tap the Share button in Safari</li>
                <li>Select "Add to Home Screen"</li>
                <li>Open the app from your home screen (not Safari)</li>
                <li>Return to this page to enable notifications</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* iOS PWA Installed but Push Not Supported Warning */}
      {isIOS() && isStandalone() && !isPushSupported() && (
        <div className="card p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Push Notifications Not Available
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Your iOS version may not support push notifications. iOS 16.4 or later is required for push notification support in web apps.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Permission Status */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Notification Status
          </h2>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            isSubscribed
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
          }`}>
            {isSubscribed ? (
              <>
                <Bell className="w-4 h-4" />
                Subscribed
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4" />
                Not Subscribed
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              permission === 'granted'
                ? 'bg-green-100 dark:bg-green-900/30'
                : permission === 'denied'
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              {permission === 'granted' ? (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : permission === 'denied' ? (
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              ) : (
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Browser Permission: {permission.charAt(0).toUpperCase() + permission.slice(1)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {permission === 'granted' && 'This browser is allowed to show notifications'}
                {permission === 'denied' && 'Notifications are blocked. Enable them in browser settings.'}
                {permission === 'default' && 'Click subscribe to grant notification permission'}
              </p>
            </div>
          </div>

          {/* Subscribe/Unsubscribe Button */}
          <div className="flex gap-3">
            {!isSubscribed ? (
              <button
                onClick={subscribe}
                disabled={loading || permission === 'denied'}
                className="btn-primary flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                {loading ? 'Subscribing...' : 'Subscribe to Notifications'}
              </button>
            ) : (
              <>
                <button
                  onClick={unsubscribe}
                  disabled={loading}
                  className="btn-secondary flex items-center gap-2"
                >
                  <BellOff className="w-4 h-4" />
                  {loading ? 'Unsubscribing...' : 'Unsubscribe'}
                </button>
                <button
                  onClick={sendTestNotification}
                  disabled={loading}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  {loading ? 'Sending...' : 'Send Test Notification'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-xl">
              {message.type === 'success' ? '✅' : '❌'}
            </span>
            <div className="flex-1">
              <p className="font-medium">{message.type === 'success' ? 'Success!' : 'Error'}</p>
              <p className="text-sm mt-1">{message.text}</p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Notification Preferences */}
      {isSubscribed && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Notification Preferences
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose which types of notifications you want to receive
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={preferences.displayOffline}
                onChange={(e) => setPreferences({ ...preferences, displayOffline: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">Display Offline Alerts</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when a display goes offline
                </p>
              </div>
              <span className="text-2xl">🔴</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={preferences.displayOnline}
                onChange={(e) => setPreferences({ ...preferences, displayOnline: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">Display Online Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when an offline display comes back online
                </p>
              </div>
              <span className="text-2xl">🟢</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={preferences.highErrors}
                onChange={(e) => setPreferences({ ...preferences, highErrors: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">High-Severity Errors</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified about critical errors that need immediate attention
                </p>
              </div>
              <span className="text-2xl">⚠️</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={preferences.lowUptime}
                onChange={(e) => setPreferences({ ...preferences, lowUptime: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">Low Uptime Warnings</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when displays have poor uptime scores
                </p>
              </div>
              <span className="text-2xl">📉</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={preferences.performanceIssues}
                onChange={(e) => setPreferences({ ...preferences, performanceIssues: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">Performance Issues</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified about performance degradation and issues
                </p>
              </div>
              <span className="text-2xl">🐌</span>
            </label>
          </div>

          <div className="mt-6">
            <button
              onClick={updatePreferences}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      )}

      {/* Active Subscriptions */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Active Subscriptions
          </h2>
          <button
            onClick={loadSubscriptions}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BellOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active subscriptions</p>
            <p className="text-sm mt-1">Subscribe on this or other devices to receive notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="text-gray-600 dark:text-gray-400">
                  {getDeviceIcon(sub.userAgent)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {getDeviceName(sub.endpoint, sub.userAgent)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Subscribed {new Date(sub.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {currentSubscription?.endpoint === sub.endpoint && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                    Current
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-2">
          💡 About Push Notifications
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Notifications work even when the admin portal is closed</li>
          <li>• Subscribe on multiple devices to receive notifications everywhere</li>
          <li>• You'll also receive admin broadcasts sent via the Push Notification Utility</li>
          <li>• Unsubscribing only affects the current device</li>
          <li>• Your preferences are saved per device</li>
        </ul>
      </div>
    </div>
  );
}
