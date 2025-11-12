import React from 'react';

const ProcessingOverlay = ({ isProcessing }) => {
  if (!isProcessing) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid #333',
        borderTop: '4px solid #98ca3f',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }} />
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <p style={{
        color: '#fff',
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '8px'
      }}>
        Procesando pago...
      </p>
      <p style={{
        color: '#9ca3af',
        fontSize: '14px'
      }}>
        Por favor espera un momento
      </p>
    </div>
  );
};

export default ProcessingOverlay;
