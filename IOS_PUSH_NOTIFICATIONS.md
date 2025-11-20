# iOS Push Notifications for TeamSub-TV PWA

## Overview

iOS/iPadOS support for Web Push notifications was introduced in iOS 16.4 (March 2023) and continues to be supported in 2025. However, there are specific requirements and limitations compared to Android/Desktop browsers.

## Critical Requirements for iOS

### 1. PWA Installation Required
- **Push notifications ONLY work when the app is installed to the home screen**
- Regular Safari browsing does NOT support push notifications
- Users must tap "Share" → "Add to Home Screen" in Safari

### 2. Manifest Requirements
The manifest.json must include:
```json
{
  "display": "standalone"
}
```
✅ **Our manifest already has this configured**

### 3. User Interaction Required
- The notification permission request MUST be triggered by a user action (button click)
- Cannot be requested on page load
✅ **Our NotificationSettingsPage already implements this correctly**

### 4. HTTPS Requirement
- Push notifications require HTTPS (or localhost for development)
- Self-signed certificates are NOT supported in production

## Current Implementation Status

### ✅ Working Components:
1. **Backend Infrastructure**
   - VAPID keys configured
   - Push notification service working
   - Successfully sending notifications (201 status codes)

2. **Frontend PWA Setup**
   - Service worker with push event handler
   - Manifest.json configured correctly
   - Subscription UI implemented

3. **API Integration**
   - Subscribe/unsubscribe endpoints working
   - Preference management functional
   - Test notification endpoint operational

### ⚠️ Platform-Specific Issues:

#### iOS (iPhone/iPad)
**Status**: Push notifications are blocked by Safari
**Reason**:
- Push API is only available when the PWA is installed to home screen AND opened from the home screen icon
- Opening the site through Safari browser does not expose the Push API
- The browser reports "notifications are blocked" because the API is not available in browser context

**Solution**:
1. Install the PWA to home screen
2. Open the app from the home screen icon (not Safari)
3. Then try subscribing to notifications

#### Windows Edge
**Status**: Notifications sent successfully (201) but not displaying
**Reason**: Windows Notification Service (WNS) has additional requirements
- Requires Windows-level notification permissions
- May be blocked by Focus Assist
- Requires Edge to be in Windows notification settings

**Solution**:
1. Open Windows Settings → System → Notifications
2. Enable "Microsoft Edge" notifications
3. Disable "Focus Assist"
4. Ensure localhost:3001 is allowed in edge://settings/content/notifications

## Testing Instructions

### iOS Testing
1. Open Safari on iPhone/iPad
2. Navigate to your TeamSub-TV admin portal
3. Tap the Share button
4. Select "Add to Home Screen"
5. Give it a name and tap "Add"
6. **Close Safari completely**
7. Open the app from the home screen icon
8. Navigate to "My Notifications"
9. Click "Subscribe to Notifications"
10. Grant permission when prompted
11. Click "Send Test Notification"

### Android Testing (Chrome/Edge/Firefox)
1. Navigate to the admin portal
2. Install PWA when prompted (or use browser menu → Install)
3. Go to "My Notifications"
4. Subscribe and test

### Desktop Testing
1. Open in Chrome/Edge/Firefox
2. Navigate to "My Notifications"
3. Subscribe and test
4. Check browser notification settings if issues occur

## Known Limitations

### iOS/Safari Specific:
- ❌ No notification support in Safari browser (only installed PWA)
- ❌ No background sync while app is not in memory
- ⚠️ Limited action buttons support
- ⚠️ Notifications might be delayed if app is not recently used

### General Web Push:
- Requires user interaction to request permission
- User can revoke permission at any time
- Notifications may be throttled by the OS
- No guaranteed delivery (unlike native push)

## Troubleshooting

### "Notifications are blocked by the browser" on iOS
**Problem**: Push API not available
**Solution**:
- Ensure you opened the app from home screen icon, not Safari
- Verify iOS version is 16.4 or later
- Check Settings → Safari → Advanced → Experimental Features → ensure "Notifications" is enabled

### Notifications not appearing on Windows
**Problem**: WNS notifications sent but not displayed
**Solution**:
- Check Windows notification settings for Edge
- Disable Focus Assist temporarily
- Clear browser cache and re-subscribe
- Check edge://settings/content/notifications

### Subscription fails with 401 error
**Problem**: VAPID keys not configured or invalid
**Solution**:
- Verify .env has VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
- Ensure docker-compose.yml passes VAPID variables to backend
- Restart backend container: `docker-compose restart backend`

### Service worker not registering
**Problem**: PWA not installable or SW errors
**Solution**:
- Check browser console for errors
- Verify service-worker.js is accessible
- Ensure HTTPS is used (or localhost)
- Check manifest.json is valid

## Development vs Production

### Development (localhost)
- ✅ Works on all platforms without SSL
- ✅ Can test push notifications
- ⚠️ iOS requires actual device (not simulator)

### Production (HTTPS required)
- ✅ Valid SSL certificate required
- ❌ Self-signed certificates won't work on iOS
- ✅ Can use Let's Encrypt for free SSL

## API Reference

### Subscribe to Push Notifications
```typescript
POST /api/push-notifications/subscribe
Authorization: Bearer <token>

Body:
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  },
  "preferences": {
    "displayOffline": true,
    "displayOnline": false,
    "highErrors": true,
    "lowUptime": true,
    "performanceIssues": false
  }
}
```

### Send Test Notification
```typescript
POST /api/push-notifications/test
Authorization: Bearer <token>
```

### Get User Subscriptions
```typescript
GET /api/push-notifications/subscriptions
Authorization: Bearer <token>
```

## Next Steps

1. **Test on actual iOS device** (installed PWA, opened from home screen)
2. **Fix Windows notification display** (check OS notification settings)
3. **Add platform detection** to show appropriate guidance to users
4. **Implement notification preferences** to allow users to customize alerts
5. **Monitor notification delivery rates** to ensure reliability

## Resources

- [Apple - Supporting Web Push Notifications](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [MDN - Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web Push Protocol RFC](https://datatracker.ietf.org/doc/html/rfc8030)
- [iOS PWA Limitations](https://firt.dev/ios-15.4b)
