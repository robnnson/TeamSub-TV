import { useState, useEffect } from 'react';
import type { Display, Schedule } from '../types';

interface DebugOverlayProps {
  display: Display | null;
  schedules: Schedule[];
  currentContent: any;
}

export default function DebugOverlay({ display, schedules, currentContent }: DebugOverlayProps) {
  const systemInfo = {
    userAgent: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    windowSize: `${window.innerWidth}x${window.innerHeight}`,
    pixelRatio: window.devicePixelRatio,
    online: navigator.onLine,
    language: navigator.language,
    platform: navigator.platform,
    cookiesEnabled: navigator.cookieEnabled,
  };

  const [uptime, setUptime] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update uptime every second
    const interval = setInterval(() => {
      setUptime(prev => prev + 1);
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const activeSchedules = schedules.filter(s => s.isActive);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#00ff00',
        fontFamily: 'monospace',
        fontSize: '14px',
        padding: '20px',
        overflowY: 'auto',
        zIndex: 9999,
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          marginBottom: '20px',
          borderBottom: '2px solid #00ff00',
          paddingBottom: '10px'
        }}>
          <h1 style={{ fontSize: '24px', margin: 0 }}>🐛 DEBUG OVERLAY</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left Column */}
          <div>
            {/* Display Info */}
            <div style={{ marginBottom: '20px', background: 'rgba(0, 255, 0, 0.1)', padding: '15px', borderRadius: '4px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#00ffff' }}>📺 DISPLAY INFO</h2>
              <div><strong>ID:</strong> {display?.id || 'N/A'}</div>
              <div><strong>Name:</strong> {display?.name || 'N/A'}</div>
              <div><strong>Location:</strong> {display?.location || 'N/A'}</div>
              <div><strong>Status:</strong> <span style={{ color: display?.status === 'online' ? '#00ff00' : '#ff0000' }}>{display?.status?.toUpperCase() || 'UNKNOWN'}</span></div>
              <div><strong>Layout Type:</strong> {display?.layoutType || 'standard'}</div>
              <div><strong>Last Seen:</strong> {display?.lastSeen ? new Date(display.lastSeen).toLocaleString() : 'N/A'}</div>
            </div>

            {/* Current Content */}
            <div style={{ marginBottom: '20px', background: 'rgba(0, 255, 0, 0.1)', padding: '15px', borderRadius: '4px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#00ffff' }}>🎬 CURRENT CONTENT</h2>
              {currentContent ? (
                <>
                  <div><strong>ID:</strong> {currentContent.id}</div>
                  <div><strong>Title:</strong> {currentContent.title}</div>
                  <div><strong>Type:</strong> {currentContent.type}</div>
                  <div><strong>Duration:</strong> {currentContent.duration}s</div>
                  {currentContent.filePath && <div><strong>File:</strong> {currentContent.filePath}</div>}
                  {currentContent.metadata && (
                    <div>
                      <strong>Metadata:</strong>
                      <pre style={{ marginTop: '5px', fontSize: '12px', overflow: 'auto' }}>
                        {JSON.stringify(currentContent.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: '#ffff00' }}>No content loaded</div>
              )}
            </div>

            {/* Schedules */}
            <div style={{ marginBottom: '20px', background: 'rgba(0, 255, 0, 0.1)', padding: '15px', borderRadius: '4px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#00ffff' }}>📅 SCHEDULES</h2>
              <div><strong>Total:</strong> {schedules.length}</div>
              <div><strong>Active:</strong> <span style={{ color: activeSchedules.length > 0 ? '#00ff00' : '#ffff00' }}>{activeSchedules.length}</span></div>
              {activeSchedules.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  {activeSchedules.map((schedule, i) => (
                    <div key={schedule.id} style={{ marginBottom: '8px', paddingLeft: '10px', borderLeft: '2px solid #00ff00' }}>
                      <div><strong>#{i + 1}</strong> Priority: {schedule.priority}</div>
                      <div style={{ fontSize: '12px' }}>
                        {schedule.contentId && 'Single Content'}
                        {schedule.playlist && `Playlist: ${schedule.playlist.name} (${schedule.playlist.items.length} items, loop: ${schedule.playlist.loop})`}
                        {schedule.contentIds && `Simple Playlist (${schedule.contentIds.length} items)`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* System Info */}
            <div style={{ marginBottom: '20px', background: 'rgba(0, 255, 0, 0.1)', padding: '15px', borderRadius: '4px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#00ffff' }}>💻 SYSTEM INFO</h2>
              <div><strong>Current Time:</strong> {currentTime.toLocaleString()}</div>
              <div><strong>Uptime:</strong> {formatUptime(uptime)}</div>
              <div><strong>Online:</strong> <span style={{ color: systemInfo.online ? '#00ff00' : '#ff0000' }}>{systemInfo.online ? 'YES' : 'NO'}</span></div>
              <div><strong>Screen:</strong> {systemInfo.screenResolution}</div>
              <div><strong>Window:</strong> {systemInfo.windowSize}</div>
              <div><strong>Pixel Ratio:</strong> {systemInfo.pixelRatio}</div>
              <div><strong>Language:</strong> {systemInfo.language}</div>
              <div><strong>Platform:</strong> {systemInfo.platform}</div>
              <div><strong>Cookies:</strong> {systemInfo.cookiesEnabled ? 'Enabled' : 'Disabled'}</div>
            </div>

            {/* Browser Info */}
            <div style={{ marginBottom: '20px', background: 'rgba(0, 255, 0, 0.1)', padding: '15px', borderRadius: '4px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#00ffff' }}>🌐 BROWSER</h2>
              <div style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                {systemInfo.userAgent}
              </div>
            </div>

            {/* Storage Info */}
            <div style={{ marginBottom: '20px', background: 'rgba(0, 255, 0, 0.1)', padding: '15px', borderRadius: '4px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#00ffff' }}>💾 STORAGE</h2>
              <div><strong>API Key:</strong> {localStorage.getItem('display_api_key') ? '✓ Set' : '✗ Not Set'}</div>
              <div><strong>Local Storage Items:</strong> {localStorage.length}</div>
            </div>

            {/* Connection Info */}
            <div style={{ marginBottom: '20px', background: 'rgba(0, 255, 0, 0.1)', padding: '15px', borderRadius: '4px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#00ffff' }}>🔌 CONNECTION</h2>
              <div><strong>API URL:</strong> /api</div>
              <div><strong>SSE:</strong> <span style={{ color: '#00ff00' }}>Connected</span></div>
              <div><strong>Protocol:</strong> {window.location.protocol}</div>
              <div><strong>Host:</strong> {window.location.host}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '20px',
          paddingTop: '10px',
          borderTop: '2px solid #00ff00',
          textAlign: 'center',
          fontSize: '12px',
          color: '#ffff00'
        }}>
          To exit debug mode, click the "Debug On" button in the admin panel
        </div>
      </div>
    </div>
  );
}
