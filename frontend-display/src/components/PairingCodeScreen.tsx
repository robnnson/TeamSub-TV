import { useEffect, useState } from 'react';

interface PairingCodeScreenProps {
  onPaired: (apiKey: string) => void;
}

export default function PairingCodeScreen({ onPaired }: PairingCodeScreenProps) {
  const [pairingCode, setPairingCode] = useState<string>('');
  const [displayId, setDisplayId] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Generate pairing code on mount (only if we don't have a pending pairing)
  useEffect(() => {
    const generateCode = async () => {
      try {
        // Check if there's a pending pairing in localStorage
        const savedDisplayId = localStorage.getItem('pending_display_id');
        const savedPairingCode = localStorage.getItem('pending_pairing_code');
        const savedExpiresAt = localStorage.getItem('pending_expires_at');

        if (savedDisplayId && savedPairingCode && savedExpiresAt) {
          const expiryDate = new Date(savedExpiresAt);
          const now = new Date();

          // Check if the saved pairing code is still valid
          if (expiryDate > now) {
            // Reuse existing pairing code
            setPairingCode(savedPairingCode);
            setDisplayId(savedDisplayId);
            setExpiresAt(expiryDate);
            setLoading(false);
            return;
          } else {
            // Clear expired pairing data
            localStorage.removeItem('pending_display_id');
            localStorage.removeItem('pending_pairing_code');
            localStorage.removeItem('pending_expires_at');
          }
        }

        // Generate new pairing code
        const res = await fetch('/api/displays/generate-pairing-code', {
          method: 'POST',
        });
        const data = await res.json();

        // Save to localStorage so we can reuse it if page refreshes
        localStorage.setItem('pending_display_id', data.displayId);
        localStorage.setItem('pending_pairing_code', data.pairingCode);
        localStorage.setItem('pending_expires_at', data.expiresAt);

        setPairingCode(data.pairingCode);
        setDisplayId(data.displayId);
        setExpiresAt(new Date(data.expiresAt));
        setLoading(false);
      } catch (err) {
        setError('Failed to generate pairing code');
        setLoading(false);
      }
    };

    generateCode();
  }, []);

  // Poll for pairing completion
  useEffect(() => {
    if (!displayId) return;

    const checkPairing = async () => {
      try {
        const res = await fetch(`/api/displays/${displayId}/pairing-status`);
        const data = await res.json();

        if (data.paired && data.apiKey) {
          // Display has been paired!
          localStorage.setItem('display_api_key', data.apiKey);
          // Clear pending pairing data
          localStorage.removeItem('pending_display_id');
          localStorage.removeItem('pending_pairing_code');
          localStorage.removeItem('pending_expires_at');
          onPaired(data.apiKey);
        }
      } catch (err) {
        // Ignore errors, keep polling
        console.error('Polling error:', err);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(checkPairing, 2000);
    return () => clearInterval(interval);
  }, [displayId, onPaired]);

  // Update countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#002855',
        color: 'white',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>Generating pairing code...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#002855',
        color: 'white',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', color: '#f44336', marginBottom: '1rem' }}>Error</div>
          <div style={{ fontSize: '1.5rem' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      <div style={{
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '60px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        maxWidth: '600px',
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem', fontWeight: '600' }}>
          Display Pairing
        </h1>

        <div style={{
          background: 'white',
          color: '#002855',
          borderRadius: '15px',
          padding: '40px',
          marginBottom: '2rem',
        }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0.8 }}>
            Enter this code in the admin portal:
          </div>
          <div style={{
            fontSize: '5rem',
            fontWeight: 'bold',
            letterSpacing: '0.5rem',
            fontFamily: "'Courier New', monospace",
          }}>
            {pairingCode}
          </div>
          <div style={{ fontSize: '1rem', marginTop: '1rem', opacity: 0.6 }}>
            {timeRemaining === 'Expired' ? (
              <span style={{ color: '#f44336' }}>Code expired - refresh to generate new code</span>
            ) : (
              <span>Expires in: {timeRemaining}</span>
            )}
          </div>
        </div>

        <div style={{ fontSize: '1.2rem', opacity: 0.9, lineHeight: '1.8' }}>
          <ol style={{ textAlign: 'left', paddingLeft: '2rem' }}>
            <li>Go to the admin portal</li>
            <li>Navigate to the Displays page</li>
            <li>Click "Register Display"</li>
            <li>Enter the pairing code above</li>
            <li>Provide a name and location</li>
            <li>Wait for automatic pairing...</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
