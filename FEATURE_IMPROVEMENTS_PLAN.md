# TeamSub-TV Feature Improvements Implementation Plan

This document outlines the implementation plan for the "Top 5 Quick Wins" features to enhance the TeamSub-TV digital signage system.

## Status: In Progress

### Completed
- ✅ Display preview/emulator with playlist cycling
- ✅ Debug overlay feature
- ✅ Rich text editor with background colors
- ✅ Backend foundation for content expiration (entities, DTOs, service methods)

### In Progress
- 🔄 Feature #1: Content Expiration Dates

### Pending
- ⏳ Feature #2: Bulk Content Upload
- ⏳ Feature #3: Content Thumbnails
- ⏳ Feature #4: Display Screenshots
- ⏳ Feature #5: Dashboard Improvements

---

## Feature #1: Content Expiration Dates

**Goal**: Automatically archive old/expired content to keep the system clean.

### Backend (Partially Complete)
- [x] Add `expiresAt` (timestamp) and `isArchived` (boolean) fields to Content entity
- [x] Add `expiresAt` to CreateContentDto
- [x] Update `Content.create()` to accept expiresAt parameter
- [x] Add `Content.findAll()` to filter out archived content by default
- [x] Add `Content.archiveExpiredContent()` method
- [ ] Update all content controller methods to pass expiresAt:
  - [ ] `uploadImage()` - line 133
  - [ ] `createTextContent()` - line 161
  - [ ] Video upload endpoint
- [ ] Add `UpdateContentDto` with expiresAt field
- [ ] Add controller endpoint `POST /content/archive-expired` (manual trigger)
- [ ] Add controller endpoint `GET /content/archived` (view archived content)
- [ ] Add controller endpoint `POST /content/:id/unarchive` (restore archived content)
- [ ] Create scheduled job (cron) to run `archiveExpiredContent()` every hour

### Frontend
- [ ] Add expiration date picker to ImageModal in ContentPage.tsx
- [ ] Add expiration date picker to TextModal in ContentPage.tsx
- [ ] Pass expiresAt to API calls in `handleImageUpload()` and `handleTextSubmit()`
- [ ] Update content list to show expiration date badge
- [ ] Add "Archived" tab/filter to view archived content
- [ ] Add unarchive button for archived content
- [ ] Show warning color on content expiring soon (< 7 days)

### Implementation Steps
1. Update content controller to accept expiresAt in all creation methods
2. Add UpdateContentDto with expiresAt field
3. Create cron job service for auto-archiving
4. Add frontend date picker component
5. Update content list UI with expiration indicators
6. Add archived content view
7. Test expiration and archiving workflow

---

## Feature #2: Bulk Content Upload

**Goal**: Upload multiple images/videos at once instead of one at a time.

### Backend
- [ ] Update `POST /content/upload` to accept multiple files
- [ ] Add `files: Express.Multer.File[]` parameter instead of single `file`
- [ ] Loop through files and create content for each
- [ ] Return array of created content items
- [ ] Add validation for max files (e.g., 20 files max per upload)
- [ ] Add total size limit (e.g., 500MB max)

### Frontend
- [ ] Update file input to accept `multiple` attribute
- [ ] Show file list preview before upload
- [ ] Add progress indicator for bulk upload
- [ ] Display upload results (success/failure for each file)
- [ ] Add "Remove" button for individual files in preview
- [ ] Support drag-and-drop for multiple files

### Implementation Steps
1. Update backend upload endpoint for multiple files
2. Test with multiple file upload
3. Add frontend multiple file selector
4. Implement upload progress tracking
5. Add file preview list
6. Handle errors gracefully

---

## Feature #3: Content Thumbnails

**Goal**: Show preview thumbnails in content list for better visual browsing.

### Backend
- [ ] Install image processing library (sharp or jimp)
- [ ] Add thumbnail generation on image upload
- [ ] Store thumbnail in `thumbnails/` directory
- [ ] Update `thumbnailPath` field in Content entity (already exists!)
- [ ] Add endpoint `GET /content/:id/thumbnail` to serve thumbnails
- [ ] For videos: extract first frame as thumbnail using ffmpeg
- [ ] For text: generate thumbnail image with text preview
- [ ] Add background job queue for thumbnail generation (BullMQ)

### Frontend
- [ ] Update content list to show thumbnails instead of just icons
- [ ] Add thumbnail to content cards
- [ ] Show larger preview on hover
- [ ] Add placeholder image for content without thumbnails
- [ ] Lazy load thumbnails for better performance

### Implementation Steps
1. Install sharp/jimp library
2. Add thumbnail generation function
3. Update upload endpoint to generate thumbnails
4. Create thumbnail serving endpoint
5. Update frontend content list with thumbnail display
6. Add hover preview
7. Implement lazy loading

---

## Feature #4: Display Screenshot Capture

**Goal**: Capture and view actual screenshots from display clients.

### Backend
- [ ] Add endpoint `POST /displays/:id/screenshot` (triggers screenshot request via SSE)
- [ ] Add endpoint `GET /displays/:id/screenshot/latest` (returns latest screenshot)
- [ ] Store screenshots in `screenshots/` directory
- [ ] Add cleanup job for old screenshots (keep only latest 10 per display)
- [ ] Emit SSE event 'screenshot.request' to display
- [ ] Add screenshot metadata to Display entity (lastScreenshotAt, lastScreenshotPath)

### Frontend Display
- [ ] Listen for 'screenshot.request' SSE event
- [ ] Capture screenshot using html2canvas library
- [ ] Convert canvas to blob
- [ ] Upload screenshot to backend via `POST /displays/me/screenshot`
- [ ] Show subtle notification when screenshot is taken

### Frontend Admin
- [ ] Add "Screenshot" button to display cards
- [ ] Show loading state while capturing
- [ ] Display screenshot in modal when received
- [ ] Add timestamp to screenshot
- [ ] Add download button for screenshot

### Implementation Steps
1. Install html2canvas in frontend-display
2. Add screenshot capture logic to display client
3. Create backend endpoints for screenshot handling
4. Add screenshot trigger button to admin
5. Implement screenshot display modal
6. Add cleanup job for old screenshots

---

## Feature #5: Dashboard Improvements

**Goal**: Better visualization of system status and activity.

### New Widgets/Charts
- [ ] **Display Status Grid**: Visual grid showing all displays (green/red/gray for online/offline/unpaired)
- [ ] **Content Usage Chart**: Bar chart of most-played content (last 7 days)
- [ ] **Schedule Timeline**: Timeline view of upcoming schedules
- [ ] **Recent Activity Feed**: List of recent events (content created, displays registered, etc.)
- [ ] **System Health**: Display count, content count, active schedules count
- [ ] **Quick Actions**: Buttons for common tasks (upload content, create schedule, register display)

### Backend
- [ ] Add endpoint `GET /analytics/content-usage` (track content playback)
- [ ] Add endpoint `GET /analytics/display-uptime` (display online percentage)
- [ ] Add event tracking for content playback
- [ ] Store playback history in database (new PlaybackHistory entity)
- [ ] Add aggregation queries for charts

### Frontend
- [ ] Install chart library (recharts or chart.js)
- [ ] Create DisplayStatusGrid component
- [ ] Create ContentUsageChart component
- [ ] Create ScheduleTimeline component
- [ ] Create RecentActivityFeed component
- [ ] Create SystemHealthWidget component
- [ ] Update DashboardPage with new layout

### Implementation Steps
1. Design dashboard layout mockup
2. Create PlaybackHistory entity and tracking
3. Build analytics endpoints
4. Install and configure chart library
5. Create individual dashboard widgets
6. Integrate widgets into dashboard page
7. Add real-time updates via SSE

---

## Implementation Order

**Recommended sequence for maximum value with minimum complexity:**

1. **Content Expiration** (50% complete) - Foundation is done, finish the UI
2. **Bulk Upload** - Straightforward backend/frontend change
3. **Content Thumbnails** - Enhances UX significantly
4. **Dashboard Improvements** - Ties everything together with better visibility
5. **Display Screenshots** - Most complex, requires display-side changes

---

## Testing Checklist

### Content Expiration
- [ ] Create content with expiration date
- [ ] Verify content is hidden after expiration
- [ ] Verify manual archive/unarchive works
- [ ] Test cron job archiving
- [ ] Verify archived content not shown in schedules

### Bulk Upload
- [ ] Upload 10 images at once
- [ ] Upload mixed image/video files
- [ ] Test error handling for invalid files
- [ ] Verify size limits work
- [ ] Test progress tracking

### Content Thumbnails
- [ ] Verify thumbnails generated for images
- [ ] Verify video thumbnails extracted
- [ ] Test text content thumbnails
- [ ] Verify thumbnail lazy loading
- [ ] Test hover preview

### Display Screenshots
- [ ] Capture screenshot from active display
- [ ] Verify screenshot upload works
- [ ] Test screenshot viewing in admin
- [ ] Verify cleanup of old screenshots
- [ ] Test with different content types on display

### Dashboard
- [ ] Verify all widgets load correctly
- [ ] Test real-time updates
- [ ] Verify charts display accurate data
- [ ] Test responsive layout
- [ ] Verify quick actions work

---

## Database Schema Changes

### Content Table (Already Updated)
```sql
ALTER TABLE content
ADD COLUMN expiresAt TIMESTAMP NULL,
ADD COLUMN isArchived BOOLEAN DEFAULT FALSE;
```

### New Table: PlaybackHistory (For Dashboard Analytics)
```sql
CREATE TABLE playback_history (
  id UUID PRIMARY KEY,
  content_id UUID REFERENCES content(id),
  display_id UUID REFERENCES displays(id),
  schedule_id UUID REFERENCES schedules(id),
  played_at TIMESTAMP DEFAULT NOW(),
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_playback_history_content ON playback_history(content_id);
CREATE INDEX idx_playback_history_display ON playback_history(display_id);
CREATE INDEX idx_playback_history_played_at ON playback_history(played_at);
```

---

## Notes & Considerations

- **Performance**: Thumbnail generation should be async (use BullMQ queue)
- **Storage**: Monitor media and screenshot storage growth
- **Cleanup**: Implement regular cleanup jobs for old files
- **Caching**: Consider Redis caching for analytics queries
- **Real-time**: Use existing SSE infrastructure for live updates
- **Mobile**: Ensure admin interface remains mobile-responsive
- **Security**: Validate file types and sizes strictly
- **Accessibility**: Ensure all new UI is keyboard-navigable

---

## Next Session TODO

1. Finish content expiration feature (controllers + frontend UI)
2. Start bulk upload implementation
3. Begin thumbnail generation system

---

*Document created: 2025-11-19*
*Last updated: 2025-11-19*
