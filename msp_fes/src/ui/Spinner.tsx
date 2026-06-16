import React from 'react';

type SpinnerProps = {
  text: string;
  hint?: string;
};

const shellStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background: 'radial-gradient(circle at 20% 20%, #e9f3ff 0%, #f6f7fb 48%, #eef2f7 100%)',
};

const cardStyle = {
  width: 'min(480px, 100%)',
  background: 'rgba(255, 255, 255, 0.92)',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  borderRadius: '18px',
  boxShadow: '0 18px 50px rgba(15, 23, 42, 0.14)',
  padding: '28px 26px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  backdropFilter: 'blur(6px)',
};

const titleStyle = {
  margin: 0,
  color: '#0f172a',
  fontSize: '1rem',
  fontWeight: 700,
  letterSpacing: '0.01em',
};

const hintStyle = {
  margin: '6px 0 0',
  color: '#475569',
  fontSize: '0.9rem',
};

const Spinner: React.FC<SpinnerProps> = ({ text, hint }) => {
  return (
    <div style={shellStyle}>
      <style>{`
        .msp-init-spinner {
          width: 46px;
          height: 46px;
          border-radius: 999px;
          border: 4px solid rgba(20, 90, 170, 0.16);
          border-top-color: #0f5dd7;
          animation: msp-init-spin 0.9s linear infinite;
          flex: 0 0 auto;
        }

        @keyframes msp-init-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div style={cardStyle} role='status' aria-live='polite'>
        <div className='msp-init-spinner' aria-hidden='true' />
        <div>
          <p style={titleStyle}>{text}</p>
          {hint ? <p style={hintStyle}>{hint}</p> : null}
        </div>
      </div>
    </div>
  );
};

export default Spinner;
