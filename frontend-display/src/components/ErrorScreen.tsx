import logoImage from '../assets/logo.png';

interface ErrorScreenProps {
  displayName?: string;
  displayLocation?: string;
  error: string;
}

export default function ErrorScreen({ displayName, displayLocation, error }: ErrorScreenProps) {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #002855 0%, #004080 100%)',
        padding: '40px',
      }}
    >
      {/* Team Sub TV Logo */}
      <div
        style={{
          marginBottom: '40px',
          textAlign: 'center',
        }}
      >
        <img
          src={logoImage}
          alt="Team Sub TV"
          style={{
            maxWidth: '400px',
            maxHeight: '150px',
            marginBottom: '20px',
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
          }}
        />
        <div
          style={{
            fontSize: '1.6em',
            color: 'rgba(255, 255, 255, 0.7)',
            letterSpacing: '0.1em',
            fontWeight: '300',
          }}
        >
          Digital Signage System
        </div>
      </div>

      {/* Display Information */}
      {displayName && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '30px 50px',
            borderRadius: '15px',
            marginBottom: '40px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: '2.5em',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '10px',
            }}
          >
            {displayName}
          </div>
          {displayLocation && (
            <div
              style={{
                fontSize: '1.8em',
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              {displayLocation}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      <div
        style={{
          background: 'rgba(244, 67, 54, 0.15)',
          border: '2px solid rgba(244, 67, 54, 0.5)',
          borderRadius: '15px',
          padding: '30px 50px',
          marginBottom: '30px',
          maxWidth: '800px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '2em',
            color: '#ff6b6b',
            marginBottom: '15px',
            fontWeight: 'bold',
          }}
        >
          Connection Error
        </div>
        <div
          style={{
            fontSize: '1.6em',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.5',
          }}
        >
          {error}
        </div>
      </div>

      {/* Status Message */}
      <div
        style={{
          marginTop: '40px',
          fontSize: '1.6em',
          color: 'rgba(255, 255, 255, 0.7)',
          textAlign: 'center',
          maxWidth: '800px',
        }}
      >
        <div style={{ marginBottom: '15px', fontWeight: '500' }}>
          Attempting to reconnect automatically...
        </div>
        <div style={{ fontSize: '0.85em', color: 'rgba(255, 255, 255, 0.5)' }}>
          Please contact IT support if this issue persists
        </div>
      </div>
    </div>
  );
}
