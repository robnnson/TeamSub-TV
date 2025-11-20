# Changelog

All notable changes to TeamSub-TV will be documented in this file.

## [Unreleased]

### Added - 2025-11-20

#### Display Features Control
- Added toggle controls in Settings page to show/hide display features
- **News Ticker Toggle**: Control visibility of scrolling news headlines at the bottom of displays
- **Rotating Cards Toggle**: Control visibility of Metro, Status, Driving Times, and Bikeshare information panels
- Settings apply in real-time to all connected displays via Server-Sent Events (SSE)
- New backend endpoints:
  - `GET /api/settings/display/features` - Get current display feature settings
  - `PATCH /api/settings/display/features` - Update display feature settings (admin only)
- Display features default to enabled (shown) on initial setup

#### Display Shell Enhancements
- Added 5-day weather forecast display below current weather
- Added Annapolis, MD to driving times destinations
- Added Reagan National Airport to driving times destinations
- Integrated Navy/DoD news RSS feed into ticker
- Added Capital Bikeshare availability as 4th rotating panel
- Replaced bike emoji with official Capital Bikeshare logo
- News headlines appear in gold color (📰) in ticker
- Bikeshare data updates every minute
- News headlines update every 10 minutes

### Changed
- Settings page now displays 3 columns (FPCON, LAN, Display Features)
- Display features can now be independently toggled on/off
- Rotating transit slides increased from 3 to 4 (Metro, Status, Driving, Bikeshare)

### Technical
- Added `show_ticker` and `show_rotating_cards` settings to database
- Display features settings emit `settings.display.changed` SSE events
- Frontend displays listen for real-time settings updates
- Display features conditionally render based on settings state

---

## [Previous Features]

### Display Preview/Emulator
- Added display preview functionality in admin interface
- Playlist cycling preview with real-time updates
- Debug overlay toggle for troubleshooting

### Content Management
- Rich text editor with background color customization
- Content expiration dates foundation (backend entities and DTOs)
- Image, video, and text content support

### Display Management
- Display pairing via QR codes
- Health monitoring and alerts
- Screenshot capture capability
- Layout types: Standard and Weather shells

### Scheduling
- Schedule content to displays or display groups
- Priority-based scheduling
- Recurrence rules support
- Playlist support with duration overrides

### Settings & Status
- FPCON (Force Protection Condition) status management
- LAN (Network) status management
- Ticker message customization
- Real-time updates via SSE

### Push Notifications (PWA)
- Admin PWA with offline support
- Push notification system for display alerts
- Configurable notification preferences
- Service worker implementation

---

*Document created: 2025-11-20*
