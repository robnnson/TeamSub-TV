# PWA and Push Notifications Setup Guide

This guide explains how to set up the Progressive Web App (PWA) features and push notifications for the TeamSub-TV Admin Portal.

## Prerequisites

- Node.js installed
- Backend and frontend running
- HTTPS enabled (required for PWA and push notifications in production)

## Step 1: Generate VAPID Keys

VAPID keys are required for push notifications. Generate them using:

```bash
cd backend
npm run generate:vapid
```

This will output three environment variables. Copy them to your `.env` file:

```env
VAPID_PUBLIC_KEY=your-generated-public-key
VAPID_PRIVATE_KEY=your-generated-private-key
VAPID_SUBJECT=mailto:admin@teamsub-tv.local
```

## Step 2: Create PWA Icons

The PWA requires icons in multiple sizes. Create icons in `frontend-admin/public/icons/`:

- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

You can use an online tool like [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator) or create them manually.

**Temporary Solution:**
For development, you can create simple colored squares:

```bash
cd frontend-admin/public
mkdir -p icons
# Use ImageMagick or similar to create simple icons
```

## Step 3: Rebuild Backend

The backend needs to be rebuilt with the new push notifications module and web-push dependency:

```bash
docker-compose up -d --build backend
```

## Step 4: Register Service Worker

The service worker is automatically registered in the frontend. It handles:

- Offline caching
- Push notifications
- Background sync

## Step 5: Test PWA Installation

### Desktop (Chrome/Edge):
1. Navigate to http://localhost:3001
2. Look for the install icon in the address bar
3. Click "Install" to add to desktop

### Mobile:
1. Open http://localhost:3001 in mobile browser
2. Tap the browser menu
3. Select "Add to Home Screen"

## Step 6: Enable Push Notifications

### In the Admin Portal:

1. Log in to the admin portal
2. The app will request notification permission
3. Click "Allow" to enable push notifications
4. Configure notification preferences (coming soon)

## Push Notification Events

The system automatically sends push notifications for:

### Critical Alerts (Enabled by default):
- **Display Offline** - When a display goes offline
- **High-Severity Errors** - Critical errors from displays

### Optional Alerts (Opt-in):
- **Display Online** - When a display comes back online
- **Performance Issues** - High CPU/memory usage warnings
- **Low Uptime** - When display uptime falls below 90%

## Testing Push Notifications

### Test Notification API:
Send a test notification:

```bash
curl -X POST http://localhost:3000/api/push-notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Broadcast Notification (Admin only):
```bash
curl -X POST http://localhost:3000/api/push-notifications/broadcast \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "System Maintenance",
    "body": "Scheduled maintenance in 30 minutes",
    "url": "/"
  }'
```

## API Endpoints

### Subscribe to Push Notifications:
```
POST /api/push-notifications/subscribe
```

### Unsubscribe:
```
DELETE /api/push-notifications/unsubscribe/:endpoint
```

### Update Preferences:
```
PATCH /api/push-notifications/preferences/:endpoint
```

### Get Subscriptions:
```
GET /api/push-notifications/subscriptions
```

### Send Test Notification:
```
POST /api/push-notifications/test
```

### Broadcast (Admin):
```
POST /api/push-notifications/broadcast
```

## Troubleshooting

### Push Notifications Not Working:

1. **Check VAPID Keys**: Ensure they're correctly set in `.env`
2. **HTTPS Required**: PWA and push notifications require HTTPS in production
3. **Permission Denied**: User must grant notification permission
4. **Service Worker**: Check browser console for service worker errors

### PWA Not Installing:

1. **HTTPS Required**: Localhost works for development, but production needs HTTPS
2. **Manifest**: Verify `/manifest.json` is accessible
3. **Icons**: Ensure all required icon sizes exist
4. **Service Worker**: Must be successfully registered

### Service Worker Not Updating:

1. Close all tabs of the app
2. Clear browser cache
3. Unregister old service workers in DevTools
4. Hard refresh (Ctrl+Shift+R)

## Production Deployment

For production:

1. **Enable HTTPS**: Required for PWA and push notifications
2. **Update manifest.json**: Change URLs to production domain
3. **Generate Production Icons**: Use high-quality logo
4. **Configure CSP**: Content Security Policy for service workers
5. **Test on Multiple Devices**: iOS, Android, Desktop

## Security Considerations

- VAPID keys should be kept secret
- Push subscriptions are user-specific
- Endpoint URLs contain sensitive tokens
- Always use HTTPS in production

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| PWA Install | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ⚠️* | ✅ |
| Service Workers | ✅ | ✅ | ✅ | ✅ |

*Safari on iOS requires iOS 16.4+ for web push notifications

## Further Reading

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
