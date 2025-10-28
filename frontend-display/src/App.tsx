import { useState, useEffect, useCallback, useRef } from 'react';
import DisplayApiClient from './api';
import PairingCodeScreen from './components/PairingCodeScreen';
import ContentRenderer from './components/ContentRenderer';
import ErrorScreen from './components/ErrorScreen';
import Shell from './components/Shell';
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

  // Playlist state
  const [currentPlaylist, setCurrentPlaylist] = useState<string[] | null>(null);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);

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
        } else if (topSchedule.contentIds && topSchedule.contentIds.length > 0) {
          // Playlist - set or update playlist state
          const playlistChanged = JSON.stringify(currentPlaylist) !== JSON.stringify(topSchedule.contentIds);

          if (playlistChanged) {
            // New playlist - start from beginning
            console.log('Loading new playlist with', topSchedule.contentIds.length, 'items');
            setCurrentPlaylist(topSchedule.contentIds);
            setCurrentPlaylistIndex(0);
            const content = await apiClient.current.getContent(topSchedule.contentIds[0]);
            setCurrentContent(content);
          } else {
            // Same playlist - load current index item
            const index = currentPlaylistIndex % topSchedule.contentIds.length;
            console.log('Loading playlist item', index + 1, 'of', topSchedule.contentIds.length);
            const content = await apiClient.current.getContent(topSchedule.contentIds[index]);
            setCurrentContent(content);
          }
        } else {
          console.error('Schedule has no content or contentIds');
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

        eventSource.addEventListener('connected', (e) => {
          console.log('SSE connected:', e);
        });

        eventSource.addEventListener('content.changed', () => {
          console.log('Content changed event received');
          loadSchedules(false);
        });

        eventSource.addEventListener('schedule.triggered', () => {
          console.log('Schedule triggered event received');
          loadSchedules(false);
        });

        eventSource.addEventListener('content.update', () => {
          console.log('Content update event received');
          loadSchedules(false);
        });

        eventSource.addEventListener('heartbeat', () => {
          // Keep-alive heartbeat from server
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
    if (currentPlaylist && currentPlaylist.length > 1) {
      // Move to next item in playlist
      const nextIndex = (currentPlaylistIndex + 1) % currentPlaylist.length;
      console.log('Advancing to next playlist item:', nextIndex + 1, 'of', currentPlaylist.length);
      setCurrentPlaylistIndex(nextIndex);

      // Load next content
      if (apiClient.current) {
        apiClient.current.getContent(currentPlaylist[nextIndex])
          .then(content => {
            setCurrentContent(content);
            setError('');
          })
          .catch(err => {
            console.error('Failed to load next playlist item:', err);
            setError('Failed to load content');
          });
      }
    } else {
      // Single content or end of playlist - refresh to check for schedule changes
      console.log('Content complete, refreshing...');
      getCurrentContent();
    }
  }, [currentPlaylist, currentPlaylistIndex, getCurrentContent]);

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
        onRetry={() => loadSchedules(true)}
      />
    );
  }

  // Always show Shell, with content inside or welcome message
  return (
    <Shell
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
    </Shell>
  );
}
