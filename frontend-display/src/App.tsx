import { useState, useEffect, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import DisplayApiClient from './api';
import PairingCodeScreen from './components/PairingCodeScreen';
import ContentRenderer from './components/ContentRenderer';
import ErrorScreen from './components/ErrorScreen';
import Shell from './components/Shell';
import WeatherShell from './components/WeatherShell';
import DebugOverlay from './components/DebugOverlay';
import type { Content, Schedule, Display } from './types';

const API_URL = '/api';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const SCHEDULE_REFRESH_INTERVAL = 15000; // 15 seconds - faster updates for better real-time feel

export default function App() {
  const [configured, setConfigured] = useState(false);
  const [display, setDisplay] = useState<Display | null>(null);
  const [currentContent, setCurrentContent] = useState<Content | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);

  // Playlist state
  const [currentPlaylist, setCurrentPlaylist] = useState<{ contentId: string; durationOverride: number | null }[] | null>(null);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const [playlistShouldLoop, setPlaylistShouldLoop] = useState(true);

  const apiClient = useRef<DisplayApiClient | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Handle configuration
  const handleConfigured = useCallback(async (key: string) => {
    setError('');
    apiClient.current = new DisplayApiClient(key, API_URL);

    try {
      // Verify API key and get display info
      const displayData = await apiClient.current.getMyDisplayInfo();
      console.log('Connected successfully, display:', displayData);
      setDisplay(displayData);
      setConfigured(true);
      setLoading(false);
    } catch (err: any) {
      setError('Invalid API key or connection failed');
      setConfigured(false);
      apiClient.current = null;
      localStorage.removeItem('display_api_key');
      console.error('Configuration error:', err);
      setLoading(false);
    }
  }, []);

  // Initialize API client on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('display_api_key');
    if (savedApiKey) {
      handleConfigured(savedApiKey);
    } else {
      setLoading(false);
    }
  }, [handleConfigured]);

  // Load schedules
  const loadSchedules = useCallback(async (isInitialLoad = false) => {
    if (!apiClient.current || !display) return;

    try {
      const schedulesData = await apiClient.current.getSchedules(display.id);
      setSchedules(schedulesData);
      setError('');
    } catch (err: any) {
      console.error('Failed to load schedules:', err);
      // Only set error on initial load to avoid disrupting playback
      if (isInitialLoad) {
        setError('Failed to load schedules');
      }
    } finally {
      // Only clear loading state on initial load
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [display]);

  // Get current content based on schedules
  const getCurrentContent = useCallback(async () => {
    if (!apiClient.current || schedules.length === 0) return;

    const now = new Date();

    // Find active schedules
    const activeSchedules = schedules.filter((schedule) => {
      if (!schedule.isActive) return false;

      const start = new Date(schedule.startTime);
      const end = schedule.endTime ? new Date(schedule.endTime) : null;

      const isAfterStart = now >= start;
      const isBeforeEnd = !end || now <= end;

      return isAfterStart && isBeforeEnd;
    });

    // Sort by priority (higher first)
    activeSchedules.sort((a, b) => b.priority - a.priority);

    if (activeSchedules.length > 0) {
      const topSchedule = activeSchedules[0];

      try {
        // Handle both single content and playlists
        if (topSchedule.contentId) {
          // Single content - clear playlist state
          setCurrentPlaylist(null);
          setCurrentPlaylistIndex(0);
          const content = await apiClient.current.getContent(topSchedule.contentId);
          setCurrentContent(content);
        } else if (topSchedule.playlist?.items && topSchedule.playlist.items.length > 0) {
          // Playlist with full entity (includes loop setting and duration overrides)
          const playlistItems = topSchedule.playlist.items.map(item => ({
            contentId: item.contentId,
            durationOverride: item.durationOverride
          }));
          const playlistChanged = JSON.stringify(currentPlaylist) !== JSON.stringify(playlistItems);

          if (playlistChanged) {
            // New playlist - start from beginning
            console.log('[PLAYLIST] Loading new playlist with', playlistItems.length, 'items, loop:', topSchedule.playlist.loop);
            console.log('[PLAYLIST] Playlist name:', topSchedule.playlist.name);
            setCurrentPlaylist(playlistItems);
            setCurrentPlaylistIndex(0);
            setPlaylistShouldLoop(topSchedule.playlist.loop);
            const content = await apiClient.current.getContent(playlistItems[0].contentId);
            // Apply duration override if present
            if (playlistItems[0].durationOverride) {
              content.duration = playlistItems[0].durationOverride;
              console.log('[PLAYLIST] Applied duration override:', playlistItems[0].durationOverride, 'seconds');
            }
            setCurrentContent(content);
          } else {
            // Same playlist - load current index item
            const index = currentPlaylistIndex % playlistItems.length;
            console.log('[PLAYLIST] Loading playlist item', index + 1, 'of', playlistItems.length);
            const content = await apiClient.current.getContent(playlistItems[index].contentId);
            // Apply duration override if present
            if (playlistItems[index].durationOverride) {
              content.duration = playlistItems[index].durationOverride;
              console.log('[PLAYLIST] Applied duration override:', playlistItems[index].durationOverride, 'seconds');
            }
            setCurrentContent(content);
          }
        } else if (topSchedule.contentIds && topSchedule.contentIds.length > 0) {
          // Simple playlist (contentIds array) - always loops, no duration overrides
          const playlistItems = topSchedule.contentIds.map(contentId => ({
            contentId,
            durationOverride: null
          }));
          const playlistChanged = JSON.stringify(currentPlaylist) !== JSON.stringify(playlistItems);

          if (playlistChanged) {
            // New playlist - start from beginning
            console.log('[PLAYLIST] Loading new playlist with', playlistItems.length, 'items (simple mode, always loops)');
            setCurrentPlaylist(playlistItems);
            setCurrentPlaylistIndex(0);
            setPlaylistShouldLoop(true);
            const content = await apiClient.current.getContent(playlistItems[0].contentId);
            setCurrentContent(content);
          } else {
            // Same playlist - load current index item
            const index = currentPlaylistIndex % playlistItems.length;
            console.log('[PLAYLIST] Loading playlist item', index + 1, 'of', playlistItems.length);
            const content = await apiClient.current.getContent(playlistItems[index].contentId);
            setCurrentContent(content);
          }
        } else {
          console.error('Schedule has no content, contentIds, or playlist');
          setError('Schedule configuration error');
        }
        setError('');
      } catch (err) {
        console.error('Failed to load content:', err);
        setError('Failed to load content');
      }
    } else {
      // No active schedule - show default message
      setCurrentContent(null);
      setCurrentPlaylist(null);
      setCurrentPlaylistIndex(0);
    }
  }, [schedules, currentPlaylist, currentPlaylistIndex]);

  // Setup SSE connection
  useEffect(() => {
    if (!configured || !display || !apiClient.current) return;

    const connectSSE = () => {
      try {
        // Get the API key from localStorage
        const apiKey = localStorage.getItem('display_api_key');
        if (!apiKey) {
          console.error('No API key found for SSE connection');
          return;
        }

        // Create SSE connection with API key in URL
        const eventSource = new EventSource(
          `${API_URL}/sse/display?apiKey=${encodeURIComponent(apiKey)}`,
          { withCredentials: false }
        );

        eventSource.addEventListener('connected', () => {
          console.log('SSE connected');
        });

        eventSource.addEventListener('content.changed', () => {
          console.log('Content changed event received - forcing full page reload');
          window.location.reload();
        });

        eventSource.addEventListener('schedule.changed', () => {
          console.log('Schedule changed event received - forcing full page reload');
          window.location.reload();
        });

        eventSource.addEventListener('schedule.triggered', () => {
          console.log('Schedule triggered event received');
          loadSchedules(false);
        });

        eventSource.addEventListener('content.update', () => {
          console.log('Content update event received - forcing full page reload');
          window.location.reload();
        });

        eventSource.addEventListener('heartbeat', () => {
          // Keep-alive heartbeat from server
        });

        eventSource.addEventListener('debug.toggle', (e) => {
          const data = JSON.parse((e as MessageEvent).data);
          console.log('Debug toggle event received:', data);
          setShowDebugOverlay(data.enabled);
        });

        eventSource.addEventListener('screenshot.request', async () => {
          console.log('🎯 Screenshot request received!');
          try {
            console.log('📸 Starting screenshot capture...');
            // Capture screenshot of the entire document with reduced quality
            const canvas = await html2canvas(document.body, {
              logging: false,
              useCORS: true,
              allowTaint: true,
              scale: 0.5, // Reduce resolution by 50% to save file size
            });

            console.log('✅ Canvas created:', canvas.width, 'x', canvas.height);

            // Convert canvas to blob with JPEG compression for smaller file size
            canvas.toBlob(async (blob) => {
              if (!blob) {
                console.error('❌ Failed to create screenshot blob');
                return;
              }

              console.log('📦 Blob created:', blob.size, 'bytes', '(' + (blob.size / 1024 / 1024).toFixed(2) + ' MB)');

              // Upload screenshot to backend
              const formData = new FormData();
              formData.append('file', blob, 'screenshot.jpg');

              try {
                if (apiClient.current) {
                  console.log('⬆️ Uploading screenshot...');
                  await apiClient.current.uploadScreenshot(formData);
                  console.log('✅ Screenshot uploaded successfully!');
                } else {
                  console.error('❌ API client not available');
                }
              } catch (err) {
                console.error('❌ Failed to upload screenshot:', err);
              }
            }, 'image/jpeg', 0.7); // Use JPEG with 70% quality for better compression
          } catch (err) {
            console.error('❌ Failed to capture screenshot:', err);
          }
        });

        eventSource.onerror = (err) => {
          console.error('SSE error:', err);
          eventSource.close();

          // Retry connection after 5 seconds
          setTimeout(connectSSE, 5000);
        };

        eventSourceRef.current = eventSource;
      } catch (err) {
        console.error('Failed to setup SSE:', err);
      }
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [configured, display, loadSchedules]);

  // Load schedules on mount and periodically
  useEffect(() => {
    if (!configured || !display) return;

    // Initial load
    loadSchedules(true);

    // Periodic refresh (don't show loading state)
    const interval = setInterval(() => loadSchedules(false), SCHEDULE_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [configured, display, loadSchedules]);

  // Update current content when schedules change
  useEffect(() => {
    if (schedules.length > 0) {
      getCurrentContent();

      // Check for new content every minute
      const interval = setInterval(getCurrentContent, SCHEDULE_REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [schedules, getCurrentContent]);

  // Send heartbeat
  useEffect(() => {
    if (!configured || !display || !apiClient.current) return;

    const sendHeartbeat = async () => {
      try {
        await apiClient.current!.updateHeartbeat(display.id);
      } catch (err) {
        console.error('Heartbeat failed:', err);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [configured, display]);

  // Handle content completion
  const handleContentComplete = useCallback(() => {
    console.log('[PLAYLIST DEBUG] Content complete. Playlist:', currentPlaylist ? currentPlaylist.length + ' items' : 'none',
                'Index:', currentPlaylistIndex, 'Should loop:', playlistShouldLoop);

    if (currentPlaylist && currentPlaylist.length >= 1) {
      const isLastItem = currentPlaylistIndex === currentPlaylist.length - 1;
      console.log('[PLAYLIST DEBUG] Is last item:', isLastItem);

      // Check if we should advance to next item
      if (isLastItem && !playlistShouldLoop) {
        // Last item and no loop - refresh to check for schedule changes
        console.log('[PLAYLIST] Playlist completed (no loop). Refreshing to check for schedule changes...');
        getCurrentContent();
      } else {
        // Move to next item in playlist (with loop)
        const nextIndex = playlistShouldLoop
          ? (currentPlaylistIndex + 1) % currentPlaylist.length
          : Math.min(currentPlaylistIndex + 1, currentPlaylist.length - 1);

        console.log('[PLAYLIST] Advancing to next playlist item:', nextIndex + 1, 'of', currentPlaylist.length, 'loop:', playlistShouldLoop);
        setCurrentPlaylistIndex(nextIndex);

        // Load next content
        if (apiClient.current) {
          apiClient.current.getContent(currentPlaylist[nextIndex].contentId)
            .then(content => {
              // Apply duration override if present
              if (currentPlaylist[nextIndex].durationOverride) {
                content.duration = currentPlaylist[nextIndex].durationOverride;
                console.log('[PLAYLIST] Applied duration override:', currentPlaylist[nextIndex].durationOverride, 'seconds');
              }
              setCurrentContent(content);
              setError('');
            })
            .catch(err => {
              console.error('Failed to load next playlist item:', err);
              setError('Failed to load content');
            });
        }
      }
    } else {
      // Single content (not a playlist) - refresh to check for schedule changes
      console.log('Single content complete, refreshing...');
      getCurrentContent();
    }
  }, [currentPlaylist, currentPlaylistIndex, playlistShouldLoop, getCurrentContent]);


  if (!configured) {
    return <PairingCodeScreen onPaired={handleConfigured} />;
  }

  if (loading) {
    return (
      <div className="fullscreen-content">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorScreen
        displayName={display?.name}
        displayLocation={display?.location}
        error={error}
      />
    );
  }

  // Determine which Shell to use based on layoutType
  const ShellComponent = display?.layoutType === 'weather' ? WeatherShell : Shell;

  // Always show Shell, with content inside or welcome message
  return (
    <>
      <ShellComponent
        displayName={display?.name}
        displayLocation={display?.location}
        eventSource={eventSourceRef.current}
      >
        {currentContent ? (
          <ContentRenderer
            content={currentContent}
            apiUrl={API_URL}
            apiKey={localStorage.getItem('display_api_key') || undefined}
            onComplete={handleContentComplete}
          />
        ) : (
          <div className="text-center" style={{ color: '#999' }}>
            <div className="text-4xl mb-4">Welcome to the building</div>
            <div className="text-xl">
              {display ? `${display.name} - ${display.location}` : 'Waiting for content...'}
            </div>
            <div className="text-sm mt-4">
              {schedules.length === 0
                ? 'No schedules configured'
                : 'No active content at this time'}
            </div>
          </div>
        )}
      </ShellComponent>

      {showDebugOverlay && (
        <DebugOverlay
          display={display}
          schedules={schedules}
          currentContent={currentContent}
        />
      )}
    </>
  );
}
