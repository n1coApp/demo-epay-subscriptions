import React from 'react';

const SuccessModal = ({ subscriptionDetails, onClose }) => {
  if (!subscriptionDetails) return null;

  const { subscription } = subscriptionDetails;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '16px',
        padding: '0',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid #333'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#0a0a0a',
          padding: '30px',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          textAlign: 'center',
          borderBottom: '1px solid #333'
        }}>
          <div style={{
            fontSize: '30px',
            fontWeight: 'bold',
            color: '#98ca3f'
          }}>
             Confirmación de suscripción
          </div>
          <div style={{ color: '#9ca3af', fontSize: '14px' }}>
            ¡Gracias por suscribirte!
          </div>
        </div>

        {/* Contenido */}
        <div style={{ padding: '30px' }}>           
          {/* Detalle de la suscripción */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ 
              color: '#fff', 
              fontSize: '16px', 
              marginBottom: '15px',
              fontWeight: 'bold'
            }}>
              Detalle de la suscripción
            </h3>
            <div style={{
              padding: '15px',
              backgroundColor: '#0a0a0a',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '5px' }}>
                {subscription.name}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                {subscription.description}
              </div>
            </div>
          </div>

          {/* Detalle de facturación */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ 
              color: '#fff', 
              fontSize: '16px', 
              marginBottom: '15px',
              fontWeight: 'bold'
            }}>
              Detalle de facturación
            </h3>
            <div style={{
              padding: '15px',
              backgroundColor: '#0a0a0a',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px',
                paddingBottom: '10px',
                borderBottom: '1px solid #333'
              }}>
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>Método de pago</span>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                  {subscription.customer.paymentMethodCardBrand?.toUpperCase()} •••• {subscription.customer.paymentMethodLastDigits}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px',
                paddingBottom: '10px',
                borderBottom: '1px solid #333'
              }}>
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>Próxima renovación</span>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-SV', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>TOTAL</span>
                <span style={{ color: '#98ca3f', fontSize: '16px', fontWeight: 'bold' }}>
                  {subscription.amountFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #333'
          }}>
            <div style={{ color: '#98ca3f', fontSize: '14px', lineHeight: '1.5' }}>
              📧 Recibirás un correo de confirmación con todos los detalles de tu suscripción en <strong>{subscription.customer.email}</strong>
            </div>
          </div>

          {/* Botón de cerrar */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#98ca3f',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#85b535'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#98ca3f'}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
