# Notification Settings UI - User Guide

## Overview

The **Notification Settings** page provides a user-friendly interface for subscribing to push notifications without using the browser console. You can easily enable/disable notifications, customize preferences, and manage all your subscribed devices from one place.

## Accessing Notification Settings

1. Log in to the TeamSub-TV Admin Portal at http://localhost:3001
2. Click **"My Notifications"** in the left sidebar (bell with ring icon 🔔)
3. You'll see the Notification Settings page

## Page Sections

### 1. Notification Status

Shows your current subscription status for this device:

- **Subscribed** (Green badge with bell icon) - You're receiving notifications on this device
- **Not Subscribed** (Gray badge with bell-off icon) - You're not receiving notifications

**Browser Permission Status**:
- ✅ **Granted**: Browser allows notifications
- ❌ **Denied**: Notifications are blocked in browser settings
- 🔔 **Default**: Permission not yet requested

### 2. Subscribe/Unsubscribe

**To Subscribe** (if not already subscribed):
1. Click the **"Subscribe to Notifications"** button
2. Browser will ask: "Allow notifications from localhost:3001?"
3. Click **"Allow"**
4. Done! You'll see a success message

**To Unsubscribe** (if already subscribed):
1. Click the **"Unsubscribe"** button
2. Done! You'll see a confirmation message

**Send Test Notification**:
- Click **"Send Test Notification"** to verify it's working
- You should receive a notification within seconds!

### 3. Notification Preferences

Once subscribed, you can customize which notifications you want to receive:

#### Available Preferences:

**🔴 Display Offline Alerts**
- Get notified when a display goes offline
- **Recommended**: ✓ Enabled (critical for monitoring)

**🟢 Display Online Notifications**
- Get notified when an offline display comes back online
- **Recommended**: ✓ Enabled (good for peace of mind)

**⚠️ High-Severity Errors**
- Get notified about critical errors needing immediate attention
- **Recommended**: ✓ Enabled (critical for issue resolution)

**📉 Low Uptime Warnings**
- Get notified when displays have poor uptime scores
- **Recommended**: Your choice (can be noisy if you have unreliable displays)

**🐌 Performance Issues**
- Get notified about performance degradation
- **Recommended**: ✓ Enabled (helps identify problems early)

**To Update Preferences**:
1. Check/uncheck the boxes for your desired notification types
2. Click **"Save Preferences"** button
3. Done! Changes apply immediately

### 4. Active Subscriptions

Shows all devices where you're subscribed to notifications:

- **Device Icon**: 📱 Phone or 💻 Computer
- **Device Name**: Browser type (Chrome, Firefox, Safari, Edge)
- **Subscription Date**: When this device was subscribed
- **"This Device"** badge: Shows which is the current device

**Multiple Devices**:
- You can subscribe on as many devices as you want
- Each device maintains its own preferences
- Useful for receiving notifications on desktop, phone, and tablet

### 5. Tips Section

Helpful information about push notifications:
- Notifications work even when the admin portal is closed
- Subscribe on multiple devices to receive notifications everywhere
- You'll also receive admin broadcasts
- Unsubscribing only affects the current device
- Preferences are saved per device

## Step-by-Step: First Time Setup

### Complete Walkthrough:

**Step 1: Navigate to Notification Settings**
- Log in to admin portal
- Click "My Notifications" in the sidebar

**Step 2: Subscribe**
- Click "Subscribe to Notifications" button
- When browser asks for permission, click "Allow"
- Wait for success message

**Step 3: Customize Preferences** (optional)
- Review the 5 notification types
- Uncheck any you don't want to receive
- Click "Save Preferences"

**Step 4: Test It**
- Click "Send Test Notification"
- Check that you receive the notification
- Minimize or close the browser - notifications still work!

**Step 5: Subscribe Other Devices** (optional)
- Open admin portal on phone, tablet, or other computer
- Repeat steps 1-4 on each device

## Common Tasks

### Enable/Disable Specific Notification Types

1. Go to "My Notifications" page
2. Scroll to "Notification Preferences" section
3. Check or uncheck desired notification types
4. Click "Save Preferences"

### Subscribe on Mobile Device

1. Open http://localhost:3001 on your phone
2. Log in to admin portal
3. Tap "My Notifications" in menu
4. Tap "Subscribe to Notifications"
5. Tap "Allow" when iOS/Android asks for permission
6. Done!

### Check How Many Devices Are Subscribed

1. Go to "My Notifications" page
2. Scroll to "Active Subscriptions" section
3. Count shows total number of subscribed devices
4. Click "Refresh" icon to update the list

### Unsubscribe from a Specific Device

**On the device you want to unsubscribe:**
1. Go to "My Notifications" page
2. Click "Unsubscribe" button
3. Confirm you see success message

**Note**: You cannot remotely unsubscribe other devices. You must unsubscribe from each device individually.

### Fix "Permission Denied" Issue

If browser permission shows as **Denied**:

**Chrome/Edge**:
1. Click the lock icon (🔒) in address bar
2. Click "Site settings"
3. Find "Notifications" and change to "Allow"
4. Reload the page
5. Click "Subscribe to Notifications" again

**Firefox**:
1. Click the lock icon (🔒) in address bar
2. Click "Clear cookies and site data"
3. Reload the page
4. Click "Subscribe to Notifications"
5. Click "Allow" when prompted

**Safari**:
1. Safari → Settings → Websites → Notifications
2. Find localhost:3001
3. Change to "Allow"
4. Reload the page
5. Click "Subscribe to Notifications" again

## Troubleshooting

### Issue: "Subscribe" button is disabled

**Cause**: Browser permission is set to "Denied"

**Solution**: Follow steps in "Fix Permission Denied Issue" above

### Issue: Subscription succeeds but "Active Subscriptions" shows 0

**Cause**: Backend hasn't updated yet or subscription failed

**Solution**:
1. Click the "Refresh" icon next to "Active Subscriptions"
2. If still 0, check browser console for errors (F12 → Console)
3. Try clicking "Unsubscribe" then "Subscribe" again

### Issue: Test notification not received

**Possible Causes**:
1. System notifications are muted
2. Do Not Disturb mode is enabled
3. Browser notifications are suppressed

**Solutions**:
- **Windows**: Check Settings → System → Notifications → Turn off Focus Assist
- **Mac**: Check System Preferences → Notifications → Turn off Do Not Disturb
- **Linux**: Check system notification settings
- Try closing the browser completely - notifications should appear on desktop

### Issue: Preferences won't save

**Cause**: You're not subscribed or API error

**Solution**:
1. Verify "Notification Status" shows "Subscribed" (green)
2. If not, click "Subscribe to Notifications" first
3. Try saving preferences again
4. Check browser console for errors

### Issue: Can't find "My Notifications" in sidebar

**Cause**: Navigation not updated or wrong route

**Solution**:
1. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. Hard reload (Ctrl+Shift+R or Cmd+Shift+R)
3. Log out and log back in
4. Look for "My Notifications" with bell-ring icon (🔔)

## What Happens After Subscribing?

Once you've subscribed and customized your preferences, you'll automatically receive notifications for:

### Automatic System Notifications:
- 🔴 Display goes offline (if enabled in preferences)
- 🟢 Display comes back online (if enabled in preferences)
- ⚠️ High-severity errors occur (if enabled in preferences)
- 📉 Display uptime drops below threshold (if enabled in preferences)
- 🐌 Performance degradation detected (if enabled in preferences)

### Admin Broadcasts:
- 📢 Announcements sent via Push Notification Utility
- 🔧 Maintenance notifications
- ✨ Feature update announcements
- ⚠️ System alerts

**Note**: Admin broadcasts bypass your preferences and are sent to all subscribed users.

## Best Practices

### Recommended Preference Settings:

**For System Administrators**:
- ✓ Display Offline Alerts
- ✓ Display Online Notifications
- ✓ High-Severity Errors
- ✓ Low Uptime Warnings
- ✓ Performance Issues

**For Casual Monitoring**:
- ✓ Display Offline Alerts
- ☐ Display Online Notifications
- ✓ High-Severity Errors
- ☐ Low Uptime Warnings
- ☐ Performance Issues

**For Critical Alerts Only**:
- ✓ Display Offline Alerts
- ☐ Display Online Notifications
- ✓ High-Severity Errors
- ☐ Low Uptime Warnings
- ☐ Performance Issues

### Multi-Device Strategy:

**Desktop Computer** (Primary):
- Enable all notification types
- Keep browser open during work hours
- Primary device for responding to alerts

**Mobile Phone** (Backup):
- Enable only critical notifications (offline, high errors)
- Ensures you're notified even away from desk
- Good for after-hours monitoring

**Tablet** (Optional):
- Mirror desktop settings
- Useful for on-site troubleshooting
- Dedicated monitoring display

## Comparison: Console vs UI

### Old Way (Browser Console):
- ❌ Required copying and pasting complex JavaScript code
- ❌ Intimidating for non-technical users
- ❌ Easy to make mistakes
- ❌ Hard to manage preferences
- ❌ Couldn't see all subscribed devices

### New Way (Notification Settings UI):
- ✅ Simple one-click subscription
- ✅ User-friendly interface
- ✅ Visual preference toggles
- ✅ Shows all subscribed devices
- ✅ Real-time status updates
- ✅ Built-in test notification feature

## Related Pages

**In the Admin Portal**:
- **Push Notifications** (`/push-notifications`) - Send broadcasts to all users
- **Display Monitoring** (`/display-monitoring`) - View display health and alerts
- **Settings** (`/settings`) - General system settings

**Documentation**:
- [PUSH_NOTIFICATION_UTILITY_GUIDE.md](PUSH_NOTIFICATION_UTILITY_GUIDE.md) - How to send notifications
- [PWA_AND_PUSH_NOTIFICATIONS.md](PWA_AND_PUSH_NOTIFICATIONS.md) - Technical implementation
- [HOW_TO_SUBSCRIBE_TO_PUSH_NOTIFICATIONS.md](HOW_TO_SUBSCRIBE_TO_PUSH_NOTIFICATIONS.md) - Console method (legacy)

## Summary

The Notification Settings UI makes it incredibly easy to:
1. Subscribe to push notifications with one click
2. Customize which notifications you want to receive
3. Manage subscriptions across multiple devices
4. Test notifications to ensure they're working
5. View all your active subscriptions in one place

No more browser console code! Just click, allow, and you're done! 🎉

---

**Questions or issues?** Check the troubleshooting section above or review the related documentation.
