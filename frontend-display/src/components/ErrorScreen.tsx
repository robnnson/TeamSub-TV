interface ErrorScreenProps {
  displayName?: string;
  displayLocation?: string;
  error: string;
  onRetry: () => void;
}

export default function ErrorScreen({ displayName, displayLocation, error, onRetry }: ErrorScreenProps) {
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
      {/* TeamSub Logo */}
      <div
        style={{
          marginBottom: '40px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '5em',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '10px',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          }}
        >
          TeamSub
        </div>
        <div
          style={{
            fontSize: '2.5em',
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: '0.2em',
            fontWeight: '300',
          }}
        >
          NAVIGATOR
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

      {/* Retry Button */}
      <button
        onClick={onRetry}
        style={{
          fontSize: '1.8em',
          padding: '20px 60px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
        }}
      >
        Retry Connection
      </button>

      {/* Status Message */}
      <div
        style={{
          marginTop: '40px',
          fontSize: '1.4em',
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
        }}
      >
        Please contact IT support if this issue persists
      </div>
    </div>
  );
}
