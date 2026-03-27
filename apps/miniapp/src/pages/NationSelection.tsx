import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NationType, NATIONS } from '../types/global';

export default function NationSelection() {
  const navigate = useNavigate();
  const [selectedNation, setSelectedNation] = useState<NationType | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if already selected
    const existingNation = localStorage.getItem('selectedNation');
    if (existingNation) {
      navigate('/');
    }
  }, [navigate]);

  const handleSelectNation = (nation: NationType) => {
    setSelectedNation(nation);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selectedNation) return;

    setIsConfirming(true);
    setError(null);

    try {
      // Save to localStorage for persistence
      localStorage.setItem('selectedNation', JSON.stringify(selectedNation));

      // Could also send to backend API here
      // await fetch('/api/user/select-nation', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ nationId: selectedNation.id })
      // });

      // Redirect to dashboard
      navigate('/');
    } catch (err) {
      setError('Failed to save selection. Please try again.');
      setIsConfirming(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #050810 0%, #0d1117 100%)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '32px',
        width: '100%',
        maxWidth: '600px'
      }}>
        <div style={{
          fontSize: '10px',
          color: '#8B0000',
          letterSpacing: '4px',
          marginBottom: '12px',
          textTransform: 'uppercase'
        }}>
          Choose Your Destiny
        </div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#e8e8e8',
          letterSpacing: '2px',
          marginBottom: '12px'
        }}>
          SELECT YOUR NATION
        </h1>
        <p style={{
          fontSize: '12px',
          color: '#8892a4',
          letterSpacing: '1px',
          lineHeight: '1.6'
        }}>
          Your choice determines your path to global domination. Each faction offers unique advantages and playstyles.
        </p>
      </div>

      {/* Nation Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '16px',
        width: '100%',
        maxWidth: '500px',
        marginBottom: '32px'
      }}>
        {NATIONS.map((nation) => (
          <div
            key={nation.id}
            onClick={() => handleSelectNation(nation)}
            style={{
              background: selectedNation?.id === nation.id
                ? `linear-gradient(135deg, rgba(${hexToRgb(nation.color)}15) 0%, #0d1117 100%)`
                : 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
              border: selectedNation?.id === nation.id
                ? `2px solid ${nation.color}`
                : '1px solid #30363d',
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: selectedNation?.id === nation.id
                ? `0 0 20px ${hexToRgb(nation.color)}40`
                : 'none'
            }}
          >
            {/* Accent bar */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              background: nation.color
            }} />

            <div style={{ paddingLeft: '12px' }}>
              {/* Emoji and Name */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
                gap: '12px'
              }}>
                <div style={{
                  fontSize: '36px',
                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.1))'
                }}>
                  {nation.emoji}
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: nation.color,
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}>
                  {nation.name}
                </div>
              </div>

              {/* Description */}
              <p style={{
                fontSize: '13px',
                color: '#8b949e',
                lineHeight: '1.6',
                margin: 0
              }}>
                {nation.description}
              </p>
            </div>

            {/* Selection indicator */}
            {selectedNation?.id === nation.id && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: nation.color,
                border: '2px solid #fff',
                boxShadow: `0 0 10px ${nation.color}`
              }}>
                <svg
                  viewBox="0 0 20 20"
                  fill="white"
                  style={{ width: '100%', height: '100%', padding: '2px' }}
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L8 12.586l6.293-6.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          padding: '12px 20px',
          background: 'rgba(255, 68, 68, 0.1)',
          border: '1px solid #ff4444',
          borderRadius: '8px',
          color: '#ff4444',
          fontSize: '12px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        disabled={!selectedNation || isConfirming}
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '16px 32px',
          background: selectedNation
            ? `linear-gradient(135deg, ${selectedNation.color}dd 0%, ${selectedNation.color}aa 100%)`
            : 'linear-gradient(135deg, #30363d 0%, #21262d 100%)',
          border: selectedNation
            ? `1px solid ${selectedNation.color}`
            : '1px solid #30363d',
          borderRadius: '8px',
          color: selectedNation ? '#ffffff' : '#6e7681',
          fontSize: '16px',
          fontWeight: 'bold',
          letterSpacing: '2px',
          cursor: selectedNation && !isConfirming ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
          textTransform: 'uppercase',
          outline: 'none'
        }}
      >
        {isConfirming ? 'CONFIRMING...' : 'CONFIRM SELECTION'}
      </button>

      {/* Selection summary */}
      {selectedNation && !isConfirming && (
        <p style={{
          marginTop: '12px',
          fontSize: '11px',
          color: '#8892a4',
          letterSpacing: '1px',
          textAlign: 'center'
        }}>
          You have selected {selectedNation.name}. Confirm to begin your conquest.
        </p>
      )}

      {/* Inline styles for hexToRgb helper */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 10px currentColor; }
          50% { box-shadow: 0 0 20px currentColor; }
        }
      `}</style>
    </div>
  );
}

// Helper function to convert hex to rgb for rgba usage
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
}