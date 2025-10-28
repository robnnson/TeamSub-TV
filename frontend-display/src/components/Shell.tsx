import { useEffect, useState, ReactNode } from 'react';

interface ShellProps {
  children: ReactNode;
  displayName?: string;
  displayLocation?: string;
  eventSource?: EventSource | null;
}

export default function Shell({ children, displayName, displayLocation, eventSource }: ShellProps) {
  const [clockTime, setClockTime] = useState('');
  const [clockDate, setClockDate] = useState('');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [currentTransitSlide, setCurrentTransitSlide] = useState(0);
  const [weather, setWeather] = useState({ temp: '--', desc: 'Loading...', icon: '', humidity: '--', wind: '--' });
  const [trains, setTrains] = useState<any[]>([]);
  const [driveTimes, setDriveTimes] = useState<any[]>([]);
  const [fpconStatus, setFpconStatus] = useState({ status: 'LOADING...', color: '#666' });
  const [lanStatus, setLanStatus] = useState({ status: 'LOADING...', color: '#666' });
  const [tickerMessages, setTickerMessages] = useState<string[]>([
    'Welcome to Team-Sub Navigator',
    'Metro Arrivals Updated Every 30s',
  ]);

  const banners = [
    '/img/Team-Sub Navigator Banner_JAN-FEB-MAR.jpg',
    '/img/Team-Sub Navigator Banner_APR-MAY-JUN.jpg',
    '/img/Team-Sub Navigator Banner_JUL-AUG-SEP.jpg',
    '/img/Team-Sub Navigator Banner_OCT-NOV-DEC.jpg',
  ];

  // Update clock every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      setClockTime(time);
      setClockDate(date);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotate banners every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Rotate transit slides every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTransitSlide((prev) => (prev + 1) % 3); // 3 slides: metro, status, driving
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.openweathermap.org/data/2.5/weather?q=Washington,DC,US&units=imperial&appid=9fcfc0149fef9015a6eaba1df22caf5b'
        );
        const data = await res.json();
        const temp = Math.round(data.main.temp);
        const desc = data.weather[0].description;
        const iconCode = data.weather[0].icon;
        const humidity = data.main.humidity;
        const windSpeed = Math.round(data.wind.speed * 1.60934);
        setWeather({
          temp: `${temp}°F`,
          desc: desc.charAt(0).toUpperCase() + desc.slice(1),
          icon: `https://openweathermap.org/img/wn/${iconCode}@2x.png`,
          humidity: `${humidity}%`,
          wind: `${windSpeed} km/h`,
        });
      } catch {
        setWeather({ temp: '--', desc: 'Weather unavailable', icon: '', humidity: '--', wind: '--' });
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  // Fetch train arrivals
  useEffect(() => {
    const fetchTrainArrivals = async () => {
      const apiKey = 'd1df6a70755d42398beefaf6ee90a662';
      const stationCode = 'F05';
      const url = `https://api.wmata.com/StationPrediction.svc/json/GetPrediction/${stationCode}`;

      try {
        const response = await fetch(url, { headers: { api_key: apiKey } });
        const data = await response.json();
        const validTrains = data.Trains.filter((train: any) => !isNaN(parseInt(train.Min)));
        setTrains(validTrains);
      } catch {
        setTrains([]);
      }
    };

    fetchTrainArrivals();
    const interval = setInterval(fetchTrainArrivals, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch driving times
  useEffect(() => {
    const fetchDrivingTime = async (fromLat: number, fromLon: number, toLat: number, toLon: number) => {
      const key = '5mbANdobpExgtq28V5rxlSylvDx87ulH';
      const url = `https://api.tomtom.com/routing/1/calculateRoute/${fromLat},${fromLon}:${toLat},${toLon}/json?key=${key}&travelMode=car`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        const summary = data.routes?.[0]?.summary;
        const mins = Math.round(summary.travelTimeInSeconds / 60);
        const arrival = new Date(Date.now() + summary.travelTimeInSeconds * 1000);
        return {
          minutes: mins,
          arrival: arrival.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        };
      } catch {
        return { minutes: 'N/A', arrival: '—' };
      }
    };

    const fetchAllDrivingTimes = async () => {
      const from = [38.87382041883797, -76.9972499997064];
      const destinations = [
        { name: 'Pentagon', to: [38.868746, -77.056708] },
        { name: 'Joint Base Anacostia-Bolling', to: [38.835532, -76.995000] },
        { name: 'Andrews AFB', to: [38.810794, -76.866222] },
        { name: 'Pax River', to: [38.273144, -76.453244] },
        { name: 'Reston, VA', to: [38.958630, -77.357002] },
      ];

      const times = [];
      for (const dest of destinations) {
        const { minutes, arrival } = await fetchDrivingTime(from[0], from[1], dest.to[0], dest.to[1]);
        times.push({ name: dest.name, minutes, arrival });
      }
      setDriveTimes(times);
    };

    fetchAllDrivingTimes();
    const interval = setInterval(fetchAllDrivingTimes, 300000);
    return () => clearInterval(interval);
  }, []);

  // Fetch FPCON status from backend
  useEffect(() => {
    const fetchFpconStatus = async () => {
      try {
        const apiKey = localStorage.getItem('display_api_key');
        const headers: Record<string, string> = {};
        if (apiKey) {
          headers['x-api-key'] = apiKey;
        }

        const res = await fetch('/api/settings/status/fpcon', { headers });
        const data = await res.json();
        const status = data.status?.toUpperCase() || 'UNKNOWN';
        const colorMap: Record<string, string> = {
          NORMAL: '#4caf50',
          ALPHA: '#03a9f4',
          BRAVO: '#ffc107',
          CHARLIE: '#ff5722',
          DELTA: '#f44336',
        };
        setFpconStatus({ status, color: colorMap[status] || '#666' });
      } catch {
        setFpconStatus({ status: 'Unavailable', color: '#666' });
      }
    };

    // Fetch once on mount, then rely on SSE for updates
    fetchFpconStatus();
  }, []);

  // Fetch LAN status from backend (initial load only, updates via SSE)
  useEffect(() => {
    const fetchLANStatus = async () => {
      try {
        const apiKey = localStorage.getItem('display_api_key');
        const headers: Record<string, string> = {};
        if (apiKey) {
          headers['x-api-key'] = apiKey;
        }

        const res = await fetch('/api/settings/status/lan', { headers });
        const data = await res.json();
        const status = data.status?.toUpperCase() || 'UNKNOWN';
        const colorMap: Record<string, string> = {
          NORMAL: '#4caf50',
          DEGRADED: '#ffc107',
          OUTAGE: '#f44336',
        };
        setLanStatus({ status, color: colorMap[status] || '#666' });
      } catch {
        setLanStatus({ status: 'Unavailable', color: '#666' });
      }
    };

    // Fetch once on mount, then rely on SSE for updates
    fetchLANStatus();
  }, []);

  // Fetch ticker messages from backend (initial load only, updates via SSE)
  useEffect(() => {
    const fetchTickerMessages = async () => {
      try {
        const apiKey = localStorage.getItem('display_api_key');
        const headers: Record<string, string> = {};
        if (apiKey) {
          headers['x-api-key'] = apiKey;
        }

        const res = await fetch('/api/settings/ticker_messages', { headers });
        const data = await res.json();
        const messages = JSON.parse(data.value);
        setTickerMessages(messages);
      } catch (err) {
        console.error('Failed to load ticker messages:', err);
        // Keep default messages on error
      }
    };

    // Fetch once on mount, then rely on SSE for updates
    fetchTickerMessages();
  }, []);

  // Listen for FPCON/LAN/Ticker status changes via SSE
  useEffect(() => {
    if (!eventSource) return;

    const handleFpconChange = (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      const status = data.status?.toUpperCase() || 'UNKNOWN';
      const colorMap: Record<string, string> = {
        NORMAL: '#4caf50',
        ALPHA: '#03a9f4',
        BRAVO: '#ffc107',
        CHARLIE: '#ff5722',
        DELTA: '#f44336',
      };
      setFpconStatus({ status, color: colorMap[status] || '#666' });
      console.log('FPCON status updated via SSE:', status);
    };

    const handleLanChange = (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      const status = data.status?.toUpperCase() || 'UNKNOWN';
      const colorMap: Record<string, string> = {
        NORMAL: '#4caf50',
        DEGRADED: '#ffc107',
        OUTAGE: '#f44336',
      };
      setLanStatus({ status, color: colorMap[status] || '#666' });
      console.log('LAN status updated via SSE:', status);
    };

    const handleSettingsChange = (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      // Check if ticker_messages setting was updated
      if (data.key === 'ticker_messages') {
        try {
          const messages = JSON.parse(data.value);
          setTickerMessages(messages);
          console.log('Ticker messages updated via SSE:', messages);
        } catch (err) {
          console.error('Failed to parse ticker messages:', err);
        }
      }
    };

    eventSource.addEventListener('fpcon.changed', handleFpconChange);
    eventSource.addEventListener('lan.changed', handleLanChange);
    eventSource.addEventListener('settings.changed', handleSettingsChange);

    return () => {
      eventSource.removeEventListener('fpcon.changed', handleFpconChange);
      eventSource.removeEventListener('lan.changed', handleLanChange);
      eventSource.removeEventListener('settings.changed', handleSettingsChange);
    };
  }, [eventSource]);

  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: '#002855',
      overflow: 'hidden',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      padding: 0,
    }}>
      {/* Banner Section */}
      <div style={{ position: 'relative', width: '100%', height: '25%', overflow: 'hidden', background: '#000' }}>
        {banners.map((banner, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              opacity: index === currentBanner ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
            }}
          >
            <img src={banner} alt={`Banner ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}

        {/* Clock Display */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '30px',
          background: 'rgba(0, 40, 85, 0.9)',
          color: 'white',
          padding: '15px 30px',
          borderRadius: '10px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          zIndex: 10,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '4.5em', fontWeight: 'bold', fontFamily: "'Courier New', monospace" }}>{clockTime}</div>
          <div style={{ fontSize: '2.2em', fontWeight: 'normal', marginTop: '5px', opacity: 0.9 }}>{clockDate}</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '15px',
        padding: '15px',
      }}>
        {/* Main Content Area (Left side, spans 2 rows) */}
        <div style={{
          gridRow: 'span 2',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '15px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            bottom: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflowY: 'auto',
          }}>
            {children}
          </div>

          {/* Announcements Ticker */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(0, 40, 85, 0.95)',
            color: 'white',
            padding: '15px 0',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              paddingLeft: '100%',
              animation: 'scroll-left 30s linear infinite',
            }}>
              {/* Display name/location as first message if available */}
              {displayName && displayLocation && (
                <span style={{ fontSize: '2.2em', marginRight: '50px' }}>
                  ● {displayName} - {displayLocation}
                </span>
              )}
              {/* Dynamic ticker messages from backend */}
              {tickerMessages.map((message, index) => (
                <span key={index} style={{ fontSize: '2.2em', marginRight: '50px' }}>
                  ● {message}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Weather Card (Top right) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '15px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
          <h2 style={{ color: '#333', fontSize: '2.8em', marginBottom: '15px', borderBottom: '3px solid #667eea', paddingBottom: '10px' }}>
            Current Weather
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
            {weather.icon && <img src={weather.icon} alt="Weather" style={{ width: '120px', height: '120px' }} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '4.5em', color: '#667eea', fontWeight: 'bold' }}>{weather.temp}</div>
              <div style={{ fontSize: '2em', color: '#666' }}>{weather.desc}</div>
              <div style={{ marginTop: '10px', color: '#888', fontSize: '1.5em' }}>
                <span>Humidity: {weather.humidity}</span><br />
                <span>Wind: {weather.wind}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transit Times (Bottom right) - Rotating content */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '15px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Metro Slide */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            bottom: '20px',
            opacity: currentTransitSlide === 0 ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            overflow: 'hidden',
          }}>
            <h2 style={{ color: '#333', fontSize: '2.8em', marginBottom: '15px', borderBottom: '3px solid #667eea', paddingBottom: '10px' }}>
              Next Trains - Navy Yard
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5em', color: '#888', marginBottom: '10px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '28px', height: '28px', fill: '#888' }}>
                <path d="M13.5 5.5C14.33 5.5 15 4.83 15 4C15 3.17 14.33 2.5 13.5 2.5C12.67 2.5 12 3.17 12 4C12 4.83 12.67 5.5 13.5 5.5ZM9 22V15.5L7 13V8.5H8.5V12L11 14.5V22H9ZM16.75 22L15 14H17L18.75 22H16.75ZM18.5 10C17.67 10 17 10.67 17 11.5C17 12.33 17.67 13 18.5 13C19.33 13 20 12.33 20 11.5C20 10.67 19.33 10 18.5 10Z"/>
              </svg>
              <span>14 min walk</span>
            </div>
            <div style={{ maxHeight: 'calc(100% - 80px)', overflowY: 'auto' }}>
              {trains.length > 0 ? trains.map((train, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  margin: '8px 0',
                  background: 'linear-gradient(to right, #e8f5e9, #c8e6c9)',
                  borderRadius: '8px',
                  fontSize: '1.6em',
                }}>
                  <span style={{ fontWeight: 'bold', color: '#1b5e20', minWidth: '90px' }}>{train.Line}</span>
                  <span style={{ flex: 1, color: '#333', margin: '0 10px' }}>to {train.Destination}</span>
                  <span style={{ color: '#667eea', fontWeight: 'bold', minWidth: '90px', textAlign: 'right' }}>{train.Min} min</span>
                </div>
              )) : <div style={{ padding: '12px', color: '#666', fontSize: '1.5em' }}>No upcoming trains.</div>}
            </div>
          </div>

          {/* Status Slide */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            bottom: '20px',
            opacity: currentTransitSlide === 1 ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            overflow: 'hidden',
          }}>
            <h2 style={{ color: '#333', fontSize: '2.8em', marginBottom: '15px', borderBottom: '3px solid #667eea', paddingBottom: '10px' }}>
              Status Information
            </h2>
            <div style={{ background: 'rgba(255, 255, 255, 0.5)', border: '2px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '1.5em', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Force Protection Condition
              </h3>
              <div style={{ fontSize: '3.5em', fontWeight: 600, letterSpacing: '1px', color: fpconStatus.color }}>
                {fpconStatus.status}
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.5)', border: '2px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.5em', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Network Status
              </h3>
              <div style={{ fontSize: '3.5em', fontWeight: 600, letterSpacing: '1px', color: lanStatus.color }}>
                {lanStatus.status}
              </div>
            </div>
          </div>

          {/* Driving Times Slide */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            bottom: '20px',
            opacity: currentTransitSlide === 2 ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            overflow: 'hidden',
          }}>
            <h2 style={{ color: '#333', fontSize: '2.8em', marginBottom: '15px', borderBottom: '3px solid #667eea', paddingBottom: '10px' }}>
              Driving Times
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: 'calc(100% - 60px)' }}>
              {driveTimes.length > 0 ? driveTimes.map((drive, i) => (
                <div key={i} style={{
                  background: 'linear-gradient(to right, #f5f7fa, #c3cfe2)',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.6em', fontWeight: 'bold', color: '#333' }}>{drive.name}</span>
                    <span style={{ fontSize: '1.6em', color: '#667eea', fontWeight: 'bold' }}>{drive.minutes} min</span>
                  </div>
                  <div style={{ fontSize: '1.3em', color: '#666' }}>Arrives approx. at {drive.arrival}</div>
                </div>
              )) : <div style={{ padding: '12px', color: '#666', fontSize: '1.5em' }}>Loading driving times...</div>}
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes scroll-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }
        `}
      </style>
    </div>
  );
}
