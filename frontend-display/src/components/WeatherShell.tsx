import { useEffect, useState, ReactNode } from 'react';

interface WeatherShellProps {
  children: ReactNode;
  displayName?: string;
  displayLocation?: string;
  eventSource?: EventSource | null;
}

interface ForecastDay {
  date: string;
  high: number;
  low: number;
  icon: string;
  description: string;
}

export default function WeatherShell({ children, displayName, displayLocation, eventSource }: WeatherShellProps) {
  const [clockTime, setClockTime] = useState('');
  const [clockDate, setClockDate] = useState('');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [currentTransitSlide, setCurrentTransitSlide] = useState(0);
  const [weather, setWeather] = useState({ temp: '--', desc: 'Loading...', icon: '', humidity: '--', wind: '--' });
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [driveTimes, setDriveTimes] = useState<any[]>([]);
  const [fpconStatus, setFpconStatus] = useState({ status: 'LOADING...', color: '#666' });
  const [lanStatus, setLanStatus] = useState({ status: 'LOADING...', color: '#666' });
  const [tickerMessages, setTickerMessages] = useState<string[]>([
    'Welcome to Team Sub TV',
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

  // Fetch current weather
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

  // Fetch 5-day forecast
  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const res = await fetch(
          'https://api.openweathermap.org/data/2.5/forecast?q=Washington,DC,US&units=imperial&appid=9fcfc0149fef9015a6eaba1df22caf5b'
        );
        const data = await res.json();

        // Group forecasts by day and get daily highs/lows
        const dailyForecasts: { [key: string]: { temps: number[], icons: string[], descs: string[] } } = {};

        data.list.forEach((item: any) => {
          const date = new Date(item.dt * 1000);
          const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          if (!dailyForecasts[dateKey]) {
            dailyForecasts[dateKey] = { temps: [], icons: [], descs: [] };
          }

          dailyForecasts[dateKey].temps.push(item.main.temp);
          dailyForecasts[dateKey].icons.push(item.weather[0].icon);
          dailyForecasts[dateKey].descs.push(item.weather[0].description);
        });

        // Convert to array and take first 5 days
        const forecastArray: ForecastDay[] = Object.entries(dailyForecasts)
          .slice(0, 5)
          .map(([date, data]) => ({
            date,
            high: Math.round(Math.max(...data.temps)),
            low: Math.round(Math.min(...data.temps)),
            icon: `https://openweathermap.org/img/wn/${data.icons[Math.floor(data.icons.length / 2)]}@2x.png`,
            description: data.descs[0].charAt(0).toUpperCase() + data.descs[0].slice(1),
          }));

        setForecast(forecastArray);
      } catch (err) {
        console.error('Failed to fetch forecast:', err);
      }
    };

    fetchForecast();
    const interval = setInterval(fetchForecast, 600000); // Update every 10 minutes
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

    fetchFpconStatus();
  }, []);

  // Fetch LAN status from backend
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

    fetchLANStatus();
  }, []);

  // Fetch ticker messages from backend
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
      }
    };

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

        {/* Enhanced Clock + Current Weather Display */}
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
          minWidth: '400px',
        }}>
          <div style={{ fontSize: '4.5em', fontWeight: 'bold', fontFamily: "'Courier New', monospace" }}>{clockTime}</div>
          <div style={{ fontSize: '2.2em', fontWeight: 'normal', marginTop: '5px', opacity: 0.9 }}>{clockDate}</div>

          {/* Current Weather in same container */}
          <div style={{
            marginTop: '15px',
            paddingTop: '15px',
            borderTop: '2px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px',
          }}>
            {weather.icon && <img src={weather.icon} alt="Weather" style={{ width: '80px', height: '80px' }} />}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '3em', color: '#fff', fontWeight: 'bold' }}>{weather.temp}</div>
              <div style={{ fontSize: '1.5em', color: '#ddd' }}>{weather.desc}</div>
              <div style={{ fontSize: '1.2em', color: '#bbb', marginTop: '5px' }}>
                H: {weather.humidity} | W: {weather.wind}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid with 5-day forecast */}
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
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: '15px 15px 0 0',
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
            borderRadius: '0 0 15px 15px',
          }}>
            <div style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              paddingLeft: '100%',
              animation: 'scroll-left 30s linear infinite',
            }}>
              {displayName && displayLocation && (
                <span style={{ fontSize: '2.2em', marginRight: '50px' }}>
                  ● {displayName} - {displayLocation}
                </span>
              )}
              {tickerMessages.map((message, index) => (
                <span key={index} style={{ fontSize: '2.2em', marginRight: '50px' }}>
                  ● {message}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 5-Day Forecast Panel (Top right) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '15px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}>
          <h2 style={{ color: '#333', fontSize: '2.5em', marginBottom: '15px', borderBottom: '3px solid #667eea', paddingBottom: '10px' }}>
            5-Day Forecast
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 'calc(100% - 60px)', overflowY: 'auto' }}>
            {forecast.length > 0 ? forecast.map((day, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px',
                background: 'linear-gradient(to right, #e3f2fd, #bbdefb)',
                borderRadius: '8px',
              }}>
                <div style={{ flex: 1, fontSize: '1.6em', fontWeight: 'bold', color: '#333' }}>
                  {day.date}
                </div>
                <img src={day.icon} alt={day.description} style={{ width: '50px', height: '50px' }} />
                <div style={{ flex: 1, textAlign: 'right', fontSize: '1.5em', color: '#555' }}>
                  <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>{day.high}°</span>
                  {' / '}
                  <span style={{ color: '#1976d2', fontWeight: 'bold' }}>{day.low}°</span>
                </div>
              </div>
            )) : (
              <div style={{ padding: '12px', color: '#666', fontSize: '1.5em' }}>Loading forecast...</div>
            )}
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
            <h2 style={{ color: '#333', fontSize: '2.5em', marginBottom: '15px', borderBottom: '3px solid #667eea', paddingBottom: '10px' }}>
              Next Trains - Navy Yard
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.3em', color: '#888', marginBottom: '10px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '24px', height: '24px', fill: '#888' }}>
                <path d="M13.5 5.5C14.33 5.5 15 4.83 15 4C15 3.17 14.33 2.5 13.5 2.5C12.67 2.5 12 3.17 12 4C12 4.83 12.67 5.5 13.5 5.5ZM9 22V15.5L7 13V8.5H8.5V12L11 14.5V22H9ZM16.75 22L15 14H17L18.75 22H16.75ZM18.5 10C17.67 10 17 10.67 17 11.5C17 12.33 17.67 13 18.5 13C19.33 13 20 12.33 20 11.5C20 10.67 19.33 10 18.5 10Z"/>
              </svg>
              <span>14 min walk</span>
            </div>
            <div style={{ maxHeight: 'calc(100% - 80px)', overflowY: 'auto' }}>
              {trains.length > 0 ? trains.slice(0, 4).map((train, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  margin: '8px 0',
                  background: 'linear-gradient(to right, #e8f5e9, #c8e6c9)',
                  borderRadius: '8px',
                  fontSize: '1.4em',
                }}>
                  <span style={{ fontWeight: 'bold', color: '#1b5e20', minWidth: '70px' }}>{train.Line}</span>
                  <span style={{ flex: 1, color: '#333', margin: '0 10px', fontSize: '0.9em' }}>to {train.Destination}</span>
                  <span style={{ color: '#667eea', fontWeight: 'bold', minWidth: '70px', textAlign: 'right' }}>{train.Min} min</span>
                </div>
              )) : <div style={{ padding: '12px', color: '#666', fontSize: '1.3em' }}>No upcoming trains.</div>}
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
            <h2 style={{ color: '#333', fontSize: '2.5em', marginBottom: '15px', borderBottom: '3px solid #667eea', paddingBottom: '10px' }}>
              Status Information
            </h2>
            <div style={{ background: 'rgba(255, 255, 255, 0.5)', border: '2px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '1.3em', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Force Protection Condition
              </h3>
              <div style={{ fontSize: '3em', fontWeight: 600, letterSpacing: '1px', color: fpconStatus.color }}>
                {fpconStatus.status}
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.5)', border: '2px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.3em', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Network Status
              </h3>
              <div style={{ fontSize: '3em', fontWeight: 600, letterSpacing: '1px', color: lanStatus.color }}>
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
            <h2 style={{ color: '#333', fontSize: '2.5em', marginBottom: '15px', borderBottom: '3px solid #667eea', paddingBottom: '10px' }}>
              Driving Times
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: 'calc(100% - 60px)' }}>
              {driveTimes.length > 0 ? driveTimes.map((drive, i) => (
                <div key={i} style={{
                  background: 'linear-gradient(to right, #f5f7fa, #c3cfe2)',
                  padding: '10px',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#333' }}>{drive.name}</span>
                    <span style={{ fontSize: '1.4em', color: '#667eea', fontWeight: 'bold' }}>{drive.minutes} min</span>
                  </div>
                  <div style={{ fontSize: '1.1em', color: '#666' }}>Arrives approx. at {drive.arrival}</div>
                </div>
              )) : <div style={{ padding: '12px', color: '#666', fontSize: '1.3em' }}>Loading driving times...</div>}
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
