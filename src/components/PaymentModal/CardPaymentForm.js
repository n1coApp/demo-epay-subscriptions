import React from 'react';
import FormInput from './FormInput';

const CardPaymentForm = ({ 
  cardData, 
  onInputChange, 
  onBack, 
  onSubmit, 
  isProcessing, 
  inputStyle 
}) => {
  return (
    <div>
      <h3 style={{ color: 'white', marginBottom: '20px' }}>
        Información de Pago
      </h3>
      
      <FormInput
        type="email"
        name="customerEmail"
        value={cardData.customerEmail}
        onChange={onInputChange}
        placeholder="ejemplo@email.com"
        label="Email del Cliente *"
        style={inputStyle}
      />

      <FormInput
        type="text"
        name="customerName"
        value={cardData.customerName}
        onChange={onInputChange}
        placeholder="Juan Pérez"
        label="Nombre del Cliente *"
        style={inputStyle}
      />

      <FormInput
        type="tel"
        name="phoneNumber"
        value={cardData.phoneNumber}
        onChange={onInputChange}
        placeholder="+50364331900"
        label="Teléfono *"
        style={inputStyle}
      />

      <FormInput
        type="text"
        name="cardNumber"
        value={cardData.cardNumber}
        onChange={onInputChange}
        placeholder="4000000000002701"
        maxLength="16"
        label="Número de Tarjeta *"
        style={inputStyle}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <FormInput
          type="text"
          name="expirationMonth"
          value={cardData.expirationMonth}
          onChange={onInputChange}
          placeholder="12"
          maxLength="2"
          label="Mes *"
          style={inputStyle}
          noMargin
        />
        <FormInput
          type="text"
          name="expirationYear"
          value={cardData.expirationYear}
          onChange={onInputChange}
          placeholder="2025"
          maxLength="4"
          label="Año *"
          style={inputStyle}
          noMargin
        />
        <FormInput
          type="text"
          name="cvv"
          value={cardData.cvv}
          onChange={onInputChange}
          placeholder="123"
          maxLength="4"
          label="CVV *"
          style={inputStyle}
          noMargin
        />
      </div>

      <FormInput
        type="text"
        name="cardHolderName"
        value={cardData.cardHolderName}
        onChange={onInputChange}
        placeholder="JUAN PEREZ"
        label="Nombre en la Tarjeta *"
        style={inputStyle}
      />

      <div style={{ display: 'flex', gap: '15px' }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: 'transparent',
            color: '#9ca3af',
            border: '2px solid #333',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Volver
        </button>
        <button
          onClick={onSubmit}
          disabled={isProcessing}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: isProcessing ? '#666' : '#98ca3f',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isProcessing ? 'not-allowed' : 'pointer'
          }}
        >
          {isProcessing ? 'Procesando...' : 'Pagar Ahora'}
        </button>
      </div>
    </div>
  );
};

export default CardPaymentForm;
