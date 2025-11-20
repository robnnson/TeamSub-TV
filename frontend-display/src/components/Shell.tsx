import { useEffect, useState, ReactNode } from 'react';

interface ShellProps {
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

export default function Shell({ children, displayName, displayLocation, eventSource }: ShellProps) {
  const [clockTime, setClockTime] = useState('');
  const [clockDate, setClockDate] = useState('');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [currentTransitSlide, setCurrentTransitSlide] = useState(0);

  // Helper function to calculate slide index for enabled cards
  const getSlideIndex = (cardName: 'metro' | 'status' | 'driving' | 'bikeshare'): number => {
    const cards = [
      { name: 'metro', enabled: displaySettings.showMetroCard },
      { name: 'status', enabled: displaySettings.showStatusCard },
      { name: 'driving', enabled: displaySettings.showDrivingCard },
      { name: 'bikeshare', enabled: displaySettings.showBikeshareCard }
    ];
    const enabledCards = cards.filter(c => c.enabled);
    return enabledCards.findIndex(c => c.name === cardName);
  };
  const [weather, setWeather] = useState({ temp: '--', desc: 'Loading...', icon: '', humidity: '--', wind: '--' });
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [driveTimes, setDriveTimes] = useState<any[]>([]);
  const [bikeStations, setBikeStations] = useState<any[]>([]);
  const [newsHeadlines, setNewsHeadlines] = useState<string[]>([]);
  const [fpconStatus, setFpconStatus] = useState({ status: 'LOADING...', color: '#666' });
  const [lanStatus, setLanStatus] = useState({ status: 'LOADING...', color: '#666' });
  const [tickerMessages, setTickerMessages] = useState<string[]>([
    'Welcome to Team Sub TV',
    'Metro Arrivals Updated Every 30s',
  ]);
  const [displaySettings, setDisplaySettings] = useState({
    showTicker: true,
    showRotatingCards: true,
    showMetroCard: true,
    showStatusCard: true,
    showDrivingCard: true,
    showBikeshareCard: true,
    showNewsHeadlines: true
  });

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
      // Count enabled cards to determine max slides
      const enabledCards = [
        displaySettings.showMetroCard,
        displaySettings.showStatusCard,
        displaySettings.showDrivingCard,
        displaySettings.showBikeshareCard
      ].filter(Boolean).length;

      if (enabledCards > 0) {
        setCurrentTransitSlide((prev) => (prev + 1) % enabledCards);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [displaySettings]);

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
        { name: 'Reagan National Airport', to: [38.852083, -77.037722] },
        { name: 'Joint Base Anacostia-Bolling', to: [38.835532, -76.995000] },
        { name: 'Andrews AFB', to: [38.810794, -76.866222] },
        { name: 'Annapolis, MD', to: [38.978580, -76.492180] },
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

  // Fetch Capital Bikeshare availability
  useEffect(() => {
    const fetchBikeshare = async () => {
      try {
        console.log('Fetching bikeshare data...');

        // Fetch both station info (names) and station status (availability)
        const [statusRes, infoRes] = await Promise.all([
          fetch('https://gbfs.capitalbikeshare.com/gbfs/en/station_status.json'),
          fetch('https://gbfs.capitalbikeshare.com/gbfs/en/station_information.json')
        ]);

        if (!statusRes.ok || !infoRes.ok) {
          throw new Error(`HTTP error! status: ${statusRes.status}`);
        }

        const statusData = await statusRes.json();
        const infoData = await infoRes.json();
        console.log('Bikeshare API response received');

        if (!statusData.data || !statusData.data.stations || !infoData.data || !infoData.data.stations) {
          console.error('Invalid bikeshare data structure');
          return;
        }

        // Navy Yard area station short_names (these are in the info API)
        const navyYardShortNames = ['31228', '31229', '31226', '31227', '31230'];

        // First, find the station_ids for our desired short_names
        const targetStationIds = infoData.data.stations
          .filter((station: any) => navyYardShortNames.includes(String(station.short_name)))
          .map((station: any) => station.station_id);

        console.log('Target station IDs:', targetStationIds);

        // Create a map of station info by station_id (UUID)
        const stationInfoMap = new Map();
        infoData.data.stations.forEach((station: any) => {
          stationInfoMap.set(station.station_id, station);
        });

        // Filter status data by our target station_ids and merge with info
        let stationsData = statusData.data.stations
          .filter((station: any) => targetStationIds.includes(station.station_id))
          .map((station: any) => {
            const info = stationInfoMap.get(station.station_id);
            return {
              id: info?.short_name || station.station_id,
              name: info?.name || 'Unknown Station',
              bikes: station.num_bikes_available || 0,
              docks: station.num_docks_available || 0,
            };
          });

        console.log('Filtered bikeshare stations:', stationsData);

        // Fallback: use first 3 stations if none found
        if (stationsData.length === 0) {
          console.warn('No Navy Yard stations found, using first 3 stations');
          stationsData = statusData.data.stations.slice(0, 3).map((station: any) => {
            const info = stationInfoMap.get(station.station_id);
            return {
              id: info?.short_name || 'Unknown',
              name: info?.name || 'Unknown Station',
              bikes: station.num_bikes_available || 0,
              docks: station.num_docks_available || 0,
            };
          });
        }

        setBikeStations(stationsData);
      } catch (err) {
        console.error('Failed to fetch bikeshare data:', err);
        // Set dummy data
        setBikeStations([
          { id: 'Error', name: 'Service Unavailable', bikes: 0, docks: 0 },
          { id: 'Error', name: 'Service Unavailable', bikes: 0, docks: 0 },
        ]);
      }
    };

    fetchBikeshare();
    const interval = setInterval(fetchBikeshare, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Navy/DoD News RSS Feed
  useEffect(() => {
    const fetchNews = async () => {
      try {
        console.log('Fetching news headlines...');
        // Try RSS2JSON service (free tier, no API key needed for basic usage)
        const rssUrl = encodeURIComponent('https://www.navy.mil/Press-Office/News-Stories/rss.xml');
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&count=5`);
        const data = await res.json();

        console.log('News API response:', data);

        if (data.status === 'ok' && data.items && data.items.length > 0) {
          const headlines = data.items.map((item: any) => item.title);
          console.log('News headlines:', headlines);
          setNewsHeadlines(headlines);
        } else {
          throw new Error('No news items found');
        }
      } catch (err) {
        console.error('Failed to fetch news:', err);
        // Set static headlines immediately
        setNewsHeadlines([
          'Welcome to Team Sub TV',
          'Navy News available at navy.mil',
          'DoD News available at defense.gov',
          'Check back for updated headlines',
        ]);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 600000); // Update every 10 minutes
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

  // Fetch display features settings
  useEffect(() => {
    const fetchDisplaySettings = async () => {
      try {
        const res = await fetch('/api/settings/display/features');
        const data = await res.json();
        console.log('Display settings loaded:', data);
        setDisplaySettings(data);
      } catch (err) {
        console.error('Failed to load display settings:', err);
        // Keep default settings on error (both enabled)
      }
    };

    fetchDisplaySettings();
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

    const handleDisplayChange = (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      console.log('Display feature changed via SSE:', data);

      // Update the specific setting that changed
      const featureMap: Record<string, keyof typeof displaySettings> = {
        'show_ticker': 'showTicker',
        'show_rotating_cards': 'showRotatingCards',
        'show_metro_card': 'showMetroCard',
        'show_status_card': 'showStatusCard',
        'show_driving_card': 'showDrivingCard',
        'show_bikeshare_card': 'showBikeshareCard',
        'show_news_headlines': 'showNewsHeadlines'
      };

      const settingKey = featureMap[data.feature];
      if (settingKey) {
        setDisplaySettings(prev => ({ ...prev, [settingKey]: data.value === 'true' }));
      }
    };

    eventSource.addEventListener('fpcon.changed', handleFpconChange);
    eventSource.addEventListener('lan.changed', handleLanChange);
    eventSource.addEventListener('settings.changed', handleSettingsChange);
    eventSource.addEventListener('settings.display.changed', handleDisplayChange);

    return () => {
      eventSource.removeEventListener('fpcon.changed', handleFpconChange);
      eventSource.removeEventListener('lan.changed', handleLanChange);
      eventSource.removeEventListener('settings.changed', handleSettingsChange);
      eventSource.removeEventListener('settings.display.changed', handleDisplayChange);
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
            bottom: displaySettings.showTicker ? '80px' : 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: displaySettings.showTicker ? '15px 15px 0 0' : '15px',
          }}>
            {children}
          </div>

          {/* Announcements Ticker - Conditionally rendered */}
          {displaySettings.showTicker && (
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
                {/* Navy/DoD News Headlines - Conditionally rendered */}
                {displaySettings.showNewsHeadlines && newsHeadlines.map((headline, index) => (
                  <span key={`news-${index}`} style={{ fontSize: '2.2em', marginRight: '50px', color: '#ffd700' }}>
                    📰 {headline}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Weather Card (Top right) - Modern Clean Design */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 15px 50px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle decorative elements */}
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '180px',
            height: '180px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%',
            filter: 'blur(50px)',
          }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Large weather icon at top */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '15px',
            }}>
              {weather.icon && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '50%',
                  padding: '15px',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                }}>
                  <img
                    src={weather.icon}
                    alt="Weather"
                    style={{
                      width: '100px',
                      height: '100px',
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Temperature - Giant and centered */}
            <div style={{
              textAlign: 'center',
              fontSize: '5em',
              fontWeight: '800',
              color: '#fff',
              lineHeight: '1',
              marginBottom: '8px',
              textShadow: '0 6px 25px rgba(0, 0, 0, 0.4)',
            }}>
              {weather.temp}
            </div>

            {/* Description */}
            <div style={{
              textAlign: 'center',
              fontSize: '1.8em',
              color: 'rgba(255, 255, 255, 0.95)',
              marginBottom: '20px',
              fontWeight: '500',
              textTransform: 'capitalize',
              letterSpacing: '0.5px',
            }}>
              {weather.desc}
            </div>

            {/* Weather details - side by side */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              gap: '20px',
            }}>
              <div style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '15px',
                padding: '18px 15px',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}>
                <div style={{ fontSize: '1.1em', color: 'rgba(255, 255, 255, 0.75)', marginBottom: '8px', fontWeight: '500' }}>
                  Humidity
                </div>
                <div style={{ fontSize: '2.2em', fontWeight: 'bold', color: '#fff' }}>
                  {weather.humidity}
                </div>
              </div>
              <div style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '15px',
                padding: '18px 15px',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}>
                <div style={{ fontSize: '1.1em', color: 'rgba(255, 255, 255, 0.75)', marginBottom: '8px', fontWeight: '500' }}>
                  Wind
                </div>
                <div style={{ fontSize: '2.2em', fontWeight: 'bold', color: '#fff' }}>
                  {weather.wind}
                </div>
              </div>
            </div>

            {/* 5-Day Forecast */}
            {forecast.length > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <div style={{ fontSize: '1.4em', color: '#fff', marginBottom: '12px', fontWeight: '600', textAlign: 'center' }}>
                  5-Day Forecast
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                  {forecast.map((day, index) => (
                    <div key={index} style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '10px 6px',
                      textAlign: 'center',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}>
                      <div style={{ fontSize: '0.9em', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '6px', fontWeight: '600' }}>
                        {day.date}
                      </div>
                      <img
                        src={day.icon}
                        alt={day.description}
                        style={{
                          width: '40px',
                          height: '40px',
                          margin: '0 auto',
                          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                        }}
                      />
                      <div style={{ fontSize: '1.1em', color: '#fff', marginTop: '6px', fontWeight: '600' }}>
                        <span style={{ color: '#ffcc80' }}>{day.high}°</span>
                        <span style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '0 3px' }}>/</span>
                        <span style={{ color: '#90caf9' }}>{day.low}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transit Times (Bottom right) - Rotating content - Conditionally rendered */}
        {displaySettings.showRotatingCards && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}>
          {/* Metro Slide */}
          {displaySettings.showMetroCard && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              right: '20px',
              bottom: '20px',
              opacity: currentTransitSlide === getSlideIndex('metro') ? 1 : 0,
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
          )}

          {/* Status Slide */}
          {displaySettings.showStatusCard && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            bottom: '20px',
            opacity: currentTransitSlide === getSlideIndex('status') ? 1 : 0,
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
          )}

          {/* Driving Times Slide */}
          {displaySettings.showDrivingCard && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            bottom: '20px',
            opacity: currentTransitSlide === getSlideIndex('driving') ? 1 : 0,
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
          )}

          {/* Bikeshare Availability Slide */}
          {displaySettings.showBikeshareCard && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            bottom: '20px',
            opacity: currentTransitSlide === getSlideIndex('bikeshare') ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            overflow: 'hidden',
          }}>
            <h2 style={{ color: '#333', fontSize: '2.8em', marginBottom: '15px', borderBottom: '3px solid #667eea', paddingBottom: '10px' }}>
              Capital Bikeshare - Navy Yard
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              {bikeStations.length > 0 ? (
                <>
                  <div style={{
                    background: 'linear-gradient(to right, #e8f5e9, #c8e6c9)',
                    padding: '20px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                  }}>
                    <img src="/cabi.svg" alt="Capital Bikeshare" style={{ width: '100px', height: '100px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#1b5e20', marginBottom: '10px' }}>
                        {bikeStations[0]?.name || 'Station 1'}
                      </div>
                      <div style={{ display: 'flex', gap: '30px' }}>
                        <div>
                          <div style={{ fontSize: '1.3em', color: '#666' }}>Bikes Available</div>
                          <div style={{ fontSize: '3em', fontWeight: 'bold', color: '#2e7d32' }}>
                            {bikeStations[0]?.bikes || 0}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '1.3em', color: '#666' }}>Docks Available</div>
                          <div style={{ fontSize: '3em', fontWeight: 'bold', color: '#1565c0' }}>
                            {bikeStations[0]?.docks || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {bikeStations.slice(1).map((station, i) => (
                    <div key={i} style={{
                      background: 'linear-gradient(to right, #f5f7fa, #c3cfe2)',
                      padding: '15px 20px',
                      borderRadius: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#333' }}>
                        {station.name}
                      </div>
                      <div style={{ display: 'flex', gap: '40px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2em', color: '#666' }}>Bikes</div>
                          <div style={{ fontSize: '2.2em', fontWeight: 'bold', color: '#2e7d32' }}>
                            {station.bikes}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2em', color: '#666' }}>Docks</div>
                          <div style={{ fontSize: '2.2em', fontWeight: 'bold', color: '#1565c0' }}>
                            {station.docks}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ padding: '12px', color: '#666', fontSize: '1.5em' }}>Loading bikeshare data...</div>
              )}
            </div>
            <div style={{ marginTop: '20px', fontSize: '1.2em', color: '#888', textAlign: 'center' }}>
              Updates every minute
            </div>
          </div>
          )}
          </div>
        )}
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
