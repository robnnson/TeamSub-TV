# How to Subscribe to Push Notifications

## Quick Start Guide

This guide shows you how to register your device (computer, phone, or tablet) to receive push notifications from the TeamSub-TV Admin Portal.

## Prerequisites

- Access to the TeamSub-TV Admin Portal (http://localhost:3001)
- Admin account credentials
- Modern browser (Chrome, Edge, Firefox, or Safari)
- Browser must allow notifications (check browser settings)

## Step-by-Step Instructions

### Step 1: Log In to the Admin Portal

1. Open your browser and navigate to http://localhost:3001
2. Log in with your admin credentials
3. You should see the main dashboard

### Step 2: Grant Notification Permission

When you first load the page after login, you may see a notification permission prompt:

**Desktop (Chrome/Edge/Firefox)**:
- A browser popup will ask: "Allow notifications from localhost:3001?"
- Click **"Allow"** or **"Yes"**

**Mobile (iOS/Android)**:
- A system prompt will appear
- Tap **"Allow"** to grant permission

If you don't see the prompt, or if you accidentally clicked "Block", see the [Troubleshooting](#troubleshooting) section below.

### Step 3: Subscribe Using Browser Console

Since the UI for subscribing isn't built yet, we'll use the browser's developer console:

#### On Desktop (Chrome/Edge/Firefox):

1. **Open Developer Tools**:
   - **Windows/Linux**: Press `F12` or `Ctrl + Shift + J`
   - **Mac**: Press `Cmd + Option + J`

2. **Click the "Console" tab** at the top of the developer tools panel

3. **Copy and paste the following code** into the console:

```javascript
// Subscribe to push notifications
(async function() {
  try {
    console.log('🔔 Starting push notification subscription...');

    // 1. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.error('❌ Notification permission denied');
      return;
    }
    console.log('✅ Notification permission granted');

    // 2. Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service worker ready');

    // 3. Subscribe to push manager with VAPID key
    const vapidPublicKey = 'BKjUcgQrGNZSQuYdMmTRXNgZNP1HiuyQSyZXY-3JsYRBCDxf54ZqEqN77jkyA5DiQGKhU-edr3AOQuHYtTZ9zGM';

    // Convert VAPID key
    function urlBase64ToUint8Array(base64String) {
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
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
    console.log('✅ Push subscription created');

    // 4. Send subscription to backend
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('❌ Not logged in. Please log in first.');
      return;
    }

    const subJSON = subscription.toJSON();
    const response = await fetch('/api/push-notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        endpoint: subJSON.endpoint,
        p256dhKey: subJSON.keys.p256dh,
        authKey: subJSON.keys.auth,
        preferences: {
          displayOffline: true,
          displayOnline: true,
          highErrors: true,
          lowUptime: true,
          performanceIssues: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Subscription failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Successfully subscribed to push notifications!');
    console.log('📊 Subscription details:', result);
    console.log('');
    console.log('🎉 You will now receive push notifications for:');
    console.log('   • Display offline alerts');
    console.log('   • Display online notifications');
    console.log('   • High-severity errors');
    console.log('   • Low uptime warnings');
    console.log('   • Performance issues');
    console.log('');
    console.log('💡 Test it: Go to Push Notifications page and click "Send Test to Myself"');

  } catch (error) {
    console.error('❌ Subscription failed:', error);
    console.log('');
    console.log('🔍 Troubleshooting:');
    console.log('   1. Make sure you are logged in');
    console.log('   2. Check that notification permission is granted');
    console.log('   3. Verify service worker is registered');
    console.log('   4. Check browser console for errors');
  }
})();
```

4. **Press Enter** to execute the code

5. **Watch the console output**:
   - You should see green checkmarks (✅) as each step completes
   - Final message: "✅ Successfully subscribed to push notifications!"
   - If you see red X marks (❌), check the [Troubleshooting](#troubleshooting) section

#### On Mobile (iOS Safari / Android Chrome):

1. **Open Developer Tools**:
   - **iOS Safari**: Settings → Safari → Advanced → Enable "Web Inspector"
   - **Android Chrome**: Menu → More Tools → Developer Tools

2. **Follow the same steps** as desktop to open console and paste the code

**Easier Mobile Alternative**: Subscribe on desktop first, then install the PWA on mobile - it will share the same subscription.

### Step 4: Verify Subscription

After subscribing, verify it worked:

1. **Go to the Push Notifications page**:
   - Click "Push Notifications" in the left sidebar

2. **Check the subscription count**:
   - The "Active Subscriptions" card should show at least 1
   - Click "Refresh Count" if it still shows 0

3. **Send a test notification**:
   - Click the "Send Test to Myself" button
   - You should receive a notification within a few seconds
   - The notification will appear even if the browser tab is closed!

### Step 5: Subscribe Additional Devices (Optional)

To receive notifications on multiple devices (e.g., desktop + phone):

1. Log in to the admin portal on each device
2. Repeat Steps 2-4 on each device
3. Each device creates a separate subscription
4. The "Active Subscriptions" count will increase for each device

## What Notifications Will I Receive?

After subscribing with the default preferences, you'll receive:

### Automatic System Notifications:
- 🔴 **Display Goes Offline** - When a display stops responding
- 🟢 **Display Comes Online** - When an offline display reconnects
- ⚠️ **High-Severity Errors** - Critical errors that need attention
- 📉 **Low Uptime Warnings** - Displays with poor uptime scores
- 🐌 **Performance Issues** - Performance degradation alerts

### Manual Broadcasts:
- 📢 **Admin Announcements** - Sent via the Push Notification Utility
- 🔧 **Maintenance Notifications** - Scheduled maintenance alerts
- ✨ **Feature Updates** - New feature announcements

## Notification Preferences

The default subscription enables **all notification types**. In the future, you'll be able to customize preferences through a UI. For now, you can modify preferences by re-running the subscription code and changing this section:

```javascript
preferences: {
  displayOffline: true,      // ← Change to false to disable
  displayOnline: true,       // ← Change to false to disable
  highErrors: true,          // ← Change to false to disable
  lowUptime: true,          // ← Change to false to disable
  performanceIssues: true   // ← Change to false to disable
}
```

## Unsubscribing

To stop receiving push notifications:

### Option 1: Via Browser Console

```javascript
// Unsubscribe from push notifications
(async function() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Unsubscribed from push notifications');

      // Also remove from backend
      const token = localStorage.getItem('accessToken');
      const endpoint = encodeURIComponent(subscription.endpoint);
      await fetch(`/api/push-notifications/unsubscribe/${endpoint}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Subscription removed from server');
    } else {
      console.log('ℹ️ No active subscription found');
    }
  } catch (error) {
    console.error('❌ Unsubscribe failed:', error);
  }
})();
```

### Option 2: Via Browser Settings

**Chrome/Edge**:
1. Click the lock icon in the address bar
2. Click "Site settings"
3. Under "Notifications", select "Block"

**Firefox**:
1. Click the lock icon in the address bar
2. Click "Clear cookies and site data"
3. Reload the page

**Safari**:
1. Safari → Settings → Websites → Notifications
2. Find localhost:3001 and set to "Deny"

## Troubleshooting

### Issue: "Notification permission denied"

**Problem**: You clicked "Block" when asked for notification permission.

**Solution**:
1. **Chrome/Edge**:
   - Click the lock icon in the address bar
   - Click "Site settings"
   - Find "Notifications" and change to "Allow"
   - Reload the page

2. **Firefox**:
   - Click the lock icon in the address bar
   - Click the "X" next to "Blocked" under Permissions → Notifications
   - Click "Allow" when prompted

3. **Safari**:
   - Safari → Settings → Websites → Notifications
   - Find localhost:3001 and change to "Allow"
   - Reload the page

### Issue: "Service worker not ready"

**Problem**: Service worker hasn't registered yet.

**Solution**:
1. Reload the page (Ctrl+R or Cmd+R)
2. Wait a few seconds for service worker to register
3. Try the subscription code again
4. Check DevTools → Application → Service Workers to verify registration

### Issue: "Not logged in"

**Problem**: No access token found in localStorage.

**Solution**:
1. Make sure you're logged in to the admin portal
2. Check that you see the dashboard (not the login page)
3. Try logging out and back in
4. Run the subscription code again

### Issue: "Subscription failed: Unauthorized"

**Problem**: Your session has expired.

**Solution**:
1. Log out of the admin portal
2. Log back in
3. Run the subscription code again

### Issue: "Active Subscriptions" still shows 0

**Problem**: Backend hasn't updated or subscription didn't save.

**Solution**:
1. Click "Refresh Count" button
2. Check browser console for errors
3. Try the subscription code again
4. Check backend logs: `docker-compose logs backend | grep -i push`

### Issue: Test notification not received

**Possible Causes**:
1. **Browser notifications are muted**:
   - Check system notification settings
   - On Windows: Settings → System → Notifications
   - On Mac: System Preferences → Notifications
   - On Linux: System Settings → Notifications

2. **Focus Assist / Do Not Disturb is on**:
   - Windows: Turn off Focus Assist
   - Mac: Turn off Do Not Disturb
   - Check system tray/menu bar for DND icon

3. **Browser in background**:
   - Some browsers suppress notifications when in background
   - Try minimizing the browser completely
   - The notification should appear on your desktop

4. **Service worker issue**:
   - Open DevTools → Application → Service Workers
   - Click "Unregister" then reload the page
   - Re-subscribe using the console code

## Checking Subscription Status

To check if you're currently subscribed:

```javascript
// Check subscription status
(async function() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('✅ You are subscribed to push notifications');
      console.log('📊 Subscription endpoint:', subscription.endpoint);

      // Check server-side subscription
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/push-notifications/subscriptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const subscriptions = await response.json();
      console.log('📊 Total subscriptions on server:', subscriptions.length);
      console.log('📋 All subscriptions:', subscriptions);
    } else {
      console.log('❌ You are not subscribed to push notifications');
      console.log('💡 Run the subscription code to subscribe');
    }
  } catch (error) {
    console.error('❌ Error checking subscription:', error);
  }
})();
```

## Advanced: Subscribe with Custom Preferences

To subscribe with custom notification preferences:

```javascript
// Subscribe with custom preferences
(async function() {
  // ... (same as above until the fetch call) ...

  // Customize these preferences:
  const myPreferences = {
    displayOffline: true,      // ✓ Get notified when displays go offline
    displayOnline: false,      // ✗ Don't notify when displays come back online
    highErrors: true,          // ✓ Notify about critical errors
    lowUptime: false,         // ✗ Don't notify about low uptime
    performanceIssues: true   // ✓ Notify about performance issues
  };

  const response = await fetch('/api/push-notifications/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      endpoint: subJSON.endpoint,
      p256dhKey: subJSON.keys.p256dh,
      authKey: subJSON.keys.auth,
      preferences: myPreferences  // ← Use custom preferences
    })
  });

  // ... (rest of the code)
})();
```

## Future UI Implementation

In the future, there will be a user-friendly UI for:
- One-click subscription (no console code needed)
- Managing notification preferences with checkboxes
- Viewing all your subscribed devices
- Unsubscribing individual devices
- Testing notifications from the settings page

For now, the console method works perfectly and gives you full control!

## Related Documentation

- **Using the Notification Utility**: [PUSH_NOTIFICATION_UTILITY_GUIDE.md](PUSH_NOTIFICATION_UTILITY_GUIDE.md)
- **PWA Setup**: [PWA_SETUP.md](PWA_SETUP.md)
- **Implementation Details**: [PWA_AND_PUSH_NOTIFICATIONS.md](PWA_AND_PUSH_NOTIFICATIONS.md)
- **Next Steps**: [NEXT_STEPS.md](NEXT_STEPS.md)

## Need Help?

If you're still having trouble:
1. Check backend logs: `docker-compose logs backend`
2. Check frontend console for errors (F12 → Console tab)
3. Verify VAPID keys: `cat .env | grep VAPID`
4. Make sure service worker is registered: DevTools → Application → Service Workers

---

**Once subscribed, you'll receive real-time push notifications even when the admin portal is closed!** 🔔
