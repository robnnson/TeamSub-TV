# Push Notification Utility - User Guide

## Overview

The Push Notification Utility is a web-based interface in the TeamSub-TV Admin Portal that allows administrators to send push notifications to all subscribed users. This is perfect for system announcements, maintenance notifications, or testing the push notification system.

## Accessing the Utility

1. Log in to the TeamSub-TV Admin Portal at http://localhost:3001
2. Click **"Push Notifications"** in the left sidebar navigation (bell icon)
3. You'll see the Push Notification Utility page

## Page Overview

The utility page contains several sections:

### 1. Subscription Statistics

At the top of the page, you'll see three cards showing:
- **Active Subscriptions**: Number of devices currently subscribed to notifications
- **Notification Type**: Shows "Broadcast to All Users"
- **Status**: Green indicator showing the system is ready to send

### 2. Quick Templates

Pre-filled notification templates for common scenarios:

**🔧 Maintenance**
- Title: "🔧 Scheduled Maintenance"
- Body: "System maintenance scheduled for tonight at 2 AM EST. Expected downtime: 30 minutes."
- Opens: /displays
- Requires interaction: Yes

**✨ Update**
- Title: "✨ New Feature Available"
- Body: "Check out the new display monitoring enhancements in the admin portal!"
- Opens: /monitoring
- Requires interaction: No

**⚠️ Alert**
- Title: "⚠️ System Alert"
- Body: "Multiple displays are experiencing connectivity issues. Please investigate."
- Opens: /displays
- Requires interaction: Yes

Click any template button to auto-fill the form with that template.

### 3. Compose Notification

The main form for creating custom notifications:

#### Required Fields:
- **Title**: The notification headline (keep it short and descriptive)
- **Message**: The notification body text

#### Optional Fields:
- **Action URL**: Where to navigate when the notification is clicked
  - Use relative paths like `/displays` or `/monitoring`
  - Or full URLs like `https://example.com`
  - Leave blank if no action needed

#### Advanced Options (click to expand):
- **Icon URL**: Custom icon for the notification (default: `/icons/icon-192x192.png`)
- **Badge URL**: Small badge icon (default: `/icons/icon-72x72.png`)
- **Require Interaction**: Check this to prevent the notification from auto-dismissing
  - Use for critical alerts that require user attention
  - Leave unchecked for informational notifications

### 4. Action Buttons

**Send to All Users (N)**
- Broadcasts the notification to all subscribed users
- Shows count of recipients in parentheses
- Disabled if title or message is empty
- Form resets after successful send

**Send Test to Myself**
- Sends the test notification only to your subscribed devices
- Great for testing notification appearance
- Does not use the form data - sends a standard test notification

**Refresh Count**
- Reloads the subscription count
- Use if you've added/removed subscriptions recently

## How to Use

### Sending a Broadcast Notification

1. **Option A - Use a Template**:
   - Click one of the template buttons
   - Review and edit the pre-filled content if needed
   - Click "Send to All Users"

2. **Option B - Create Custom Notification**:
   - Enter a title (e.g., "System Update")
   - Enter your message
   - Optionally add an action URL
   - Optionally expand Advanced Options for more settings
   - Click "Send to All Users"

3. **Confirmation**:
   - A green success message appears showing how many users received the notification
   - The form resets automatically
   - Subscription count refreshes

### Sending a Test Notification

1. Click "Send Test to Myself"
2. You'll receive a standard test notification on all your subscribed devices
3. No form data is required

## Tips for Effective Notifications

### Title Best Practices
- Keep it under 50 characters
- Use emojis to make it eye-catching (🔴 🟢 ⚠️ ✨ 🔧)
- Front-load important information
- Examples:
  - ✅ "🔴 Display Offline"
  - ❌ "We wanted to let you know that there is a display that has gone offline"

### Message Best Practices
- Keep it concise (under 120 characters ideal)
- Most platforms truncate long messages
- Focus on the action or information needed
- Examples:
  - ✅ "Display-3 has gone offline. Check connection."
  - ❌ "We have detected that the display in the conference room has experienced a connectivity issue and is no longer responding to ping requests..."

### Action URL Best Practices
- Use relative paths for internal pages: `/displays`, `/monitoring`
- Use full URLs for external resources: `https://status.example.com`
- Match URL to notification context (offline display → `/displays`)
- Leave blank for informational-only notifications

### Require Interaction
- **Use for**: Critical alerts, maintenance warnings, security notices
- **Don't use for**: Status updates, informational notices, feature announcements

## Examples

### Example 1: Emergency Maintenance
```
Title: 🔴 Emergency Maintenance
Message: Critical security update in progress. Expected completion: 15 minutes.
Action URL: /displays
Require Interaction: ✓ Yes
```

### Example 2: New Feature
```
Title: ✨ New Dashboard Available
Message: Check out the new real-time monitoring dashboard!
Action URL: /monitoring
Require Interaction: ☐ No
```

### Example 3: Display Alert
```
Title: ⚠️ Multiple Displays Offline
Message: 5 displays in Building A are not responding. Please investigate.
Action URL: /displays
Require Interaction: ✓ Yes
```

### Example 4: General Announcement
```
Title: 📢 Staff Meeting Tomorrow
Message: All-hands meeting at 10 AM in the main conference room.
Action URL: (leave blank)
Require Interaction: ☐ No
```

## Troubleshooting

### "Active Subscriptions" shows 0
**Problem**: No users have subscribed to push notifications yet.

**Solution**:
1. Users need to grant notification permission in their browser
2. Users must subscribe via the browser console (until UI is implemented)
3. See [NEXT_STEPS.md](NEXT_STEPS.md#2-test-push-notifications-manual) for subscription instructions

### Error: "Unauthorized"
**Problem**: Your session has expired or you're not logged in.

**Solution**:
1. Log out and log back in
2. Ensure you have admin privileges

### Notifications not received
**Problem**: Users aren't receiving the notifications you send.

**Possible Causes**:
1. Users haven't subscribed to notifications
2. Users have blocked notifications in their browser
3. VAPID keys not configured properly
4. Service worker not registered

**Solutions**:
1. Check that VAPID keys are in `.env` file
2. Verify backend logs: `docker-compose logs backend | grep -i push`
3. Check browser DevTools → Application → Service Workers
4. Verify notification permission granted in browser settings

### "Send to All Users" button disabled
**Problem**: The button is grayed out and unclickable.

**Solution**:
- You must fill in both **Title** and **Message** fields
- These are required for all broadcast notifications

## Technical Details

### How It Works

1. You compose a notification in the utility
2. Click "Send to All Users"
3. Backend retrieves all active push subscriptions from database
4. Backend sends push notification to each subscription via web-push library
5. Browser service workers receive the push event
6. Notifications appear on user devices even if app is closed

### API Endpoints Used

The utility uses these backend API endpoints:

- `GET /api/push-notifications/subscriptions` - Get subscription count
- `POST /api/push-notifications/test` - Send test notification
- `POST /api/push-notifications/broadcast` - Send to all users

### User Preferences

Currently, all subscribed users receive broadcast notifications. In the future, users will be able to configure preferences for:
- Display offline notifications
- Display online notifications
- High-severity errors
- Low uptime warnings
- Performance issues

Broadcast notifications via this utility will bypass user preferences and go to everyone.

## Security Considerations

### Who Can Send Notifications?

- Only authenticated admin users can access this utility
- JWT authentication required
- Admin role required for broadcast endpoint

### Rate Limiting

Consider implementing rate limiting in production to prevent:
- Accidental spam (clicking send multiple times)
- Notification fatigue
- API abuse

### Best Practices

1. **Don't overuse**: Reserve broadcasts for important announcements
2. **Test first**: Use "Send Test to Myself" before broadcasting
3. **Consider timing**: Avoid sending during off-hours unless urgent
4. **Be respectful**: Remember notifications interrupt users
5. **Monitor feedback**: Track if users are unsubscribing after broadcasts

## Future Enhancements

Planned improvements to the utility:

- [ ] Preview notification before sending
- [ ] Schedule notifications for future delivery
- [ ] Target specific user groups or roles
- [ ] Notification templates management
- [ ] Send to individual users
- [ ] Notification history/audit log
- [ ] A/B testing for notification content
- [ ] Analytics (delivery rate, click rate)
- [ ] Rich notifications with images
- [ ] Action buttons in notifications

## Support

For issues or questions:
- Check backend logs: `docker-compose logs backend`
- Verify VAPID keys configured: `cat .env | grep VAPID`
- Review setup guide: [PWA_AND_PUSH_NOTIFICATIONS.md](PWA_AND_PUSH_NOTIFICATIONS.md)
- Check next steps: [NEXT_STEPS.md](NEXT_STEPS.md)

## Related Documentation

- **PWA Setup**: [PWA_SETUP.md](PWA_SETUP.md) - Initial PWA and push notification setup
- **Implementation Guide**: [PWA_AND_PUSH_NOTIFICATIONS.md](PWA_AND_PUSH_NOTIFICATIONS.md) - Technical implementation details
- **Next Steps**: [NEXT_STEPS.md](NEXT_STEPS.md) - Testing and future development

---

**Happy Broadcasting!** 📢
