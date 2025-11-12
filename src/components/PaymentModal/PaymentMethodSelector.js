import React from 'react';

const PaymentMethodSelector = ({ onSelectMethod, selectedPlan }) => {
  return (
    <div>
      <h3 style={{ color: 'white', marginBottom: '20px' }}>
        Selecciona tu método de pago
      </h3>
      
      <button
        onClick={() => onSelectMethod('n1co')}
        style={{
          width: '100%',
          padding: '20px',
          backgroundColor: '#0a0a0a',
          border: '2px solid #333',
          borderRadius: '12px',
          marginBottom: '15px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#98ca3f';
          e.currentTarget.style.backgroundColor = '#1a1a1a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#333';
          e.currentTarget.style.backgroundColor = '#0a0a0a';
        }}
      >
        <div style={{
          width: '50px',
          height: '50px',
          backgroundColor: '#98ca3f',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}>
          🔗
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
            Pagar con n1co
          </div>
          <div style={{ color: '#9ca3af', fontSize: '14px' }}>
            Serás redirigido a la página segura de pago
          </div>
        </div>
      </button>

      <button
        onClick={() => onSelectMethod('card')}
        style={{
          width: '100%',
          padding: '20px',
          backgroundColor: '#0a0a0a',
          border: '2px solid #333',
          borderRadius: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#98ca3f';
          e.currentTarget.style.backgroundColor = '#1a1a1a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#333';
          e.currentTarget.style.backgroundColor = '#0a0a0a';
        }}
      >
        <div style={{
          width: '50px',
          height: '50px',
          backgroundColor: '#98ca3f',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}>
          💳
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
            Pagar con Tarjeta
          </div>
          <div style={{ color: '#9ca3af', fontSize: '14px' }}>
            Ingresa los datos de tu tarjeta directamente
          </div>
        </div>
      </button>
    </div>
  );
};

export default PaymentMethodSelector;
