import React, { useState, useCallback, useMemo } from 'react';
import api from '../utils/apiWrapper';
import IFrameWithMessageListener from './IFrameWithMessageListener';

const MemoizedInput = React.memo(({ type, name, value, onChange, placeholder, maxLength, style, label }) => (
  <div style={{ marginBottom: '15px' }}>
    {label && (
      <label style={{ color: '#9ca3af', display: 'block', marginBottom: '5px', fontSize: '14px' }}>
        {label}
      </label>
    )}
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      style={style}
    />
  </div>
));

const PaymentModal = ({ showModal, selectedPlan, onClose }) => {
  const [showCardForm, setShowCardForm] = useState(false);
  const [show3DSIframe, setShow3DSIframe] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [iframeUrl, setIframeUrl] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para 3DS
  const [savedPaymentMethodId, setSavedPaymentMethodId] = useState(null);
  const [savedCustomerId, setSavedCustomerId] = useState(null);
  const [savedPlanId, setSavedPlanId] = useState(null);
  const [savedCustomerData, setSavedCustomerData] = useState(null);

  const [cardData, setCardData] = useState({
    customerEmail: '',
    customerName: '',
    phoneNumber: '',
    cardNumber: '',
    expirationMonth: '',
    expirationYear: '',
    cvv: '',
    cardHolderName: ''
  });

  // Estilo de input memoizado
  const inputStyle = useMemo(() => ({
    width: '100%',
    padding: '12px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px'
  }), []);

  const handleCardInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCardData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleClose = useCallback(() => {
    setShowCardForm(false);
    setShow3DSIframe(false);
    setShowSuccessModal(false);
    setSubscriptionDetails(null);
    setIframeUrl('');
    setError('');
    setSavedPaymentMethodId(null);
    setSavedCustomerId(null);
    setSavedPlanId(null);
    setSavedCustomerData(null);
    setCardData({
      customerEmail: '',
      customerName: '',
      phoneNumber: '',
      cardNumber: '',
      expirationMonth: '',
      expirationYear: '',
      cvv: '',
      cardHolderName: ''
    });
    onClose();
  }, [onClose]);

  const handleCreateSubscriptionWithAuth = useCallback(async (authId) => {
    setProcessingPayment(true);
    setShow3DSIframe(false);
    setError('');

    try {
      const subscriptionPayload = {
        planId: savedPlanId,
        customer: {
          id: savedCustomerId,
          name: savedCustomerData.name,
          email: savedCustomerData.email,
          phoneNumber: savedCustomerData.phoneNumber
        },
        paymentMethod: {
          id: savedPaymentMethodId
        },
        authenticationId: authId,
        locationCode: process.env.REACT_APP_LOCATION_CODE
      };

      console.log('Creating subscription with authentication:', subscriptionPayload);
      const subscriptionResponse = await api.createSubscription(subscriptionPayload);
      console.log('Subscription Response with auth:', subscriptionResponse);

      if (subscriptionResponse.status === "SUCCEEDED") {
        setSubscriptionDetails(subscriptionResponse);
        setShowSuccessModal(true);
      } else {
        throw new Error(subscriptionResponse.error.code + ' - ' + subscriptionResponse.error.message || 'Error al crear la suscripción después de 3DS');
      }
    } catch (err) {
      console.error('Error processing payment with 3DS:', err);
      setError(err.message || 'Error al procesar el pago');
      setShowCardForm(true);
    } finally {
      setProcessingPayment(false);
    }
  }, [savedPlanId, savedCustomerId, savedCustomerData, savedPaymentMethodId]);

  const handlePaymentOptionSelect = useCallback((option) => {
    if (option === 'n1co') {
      // Redirigir a la URL de pago de N1co en una nueva pestaña
      const paymentUrl = selectedPlan?.paymentLink?.linkUrl;
      if (paymentUrl) {
        console.log('Redirigiendo a:', paymentUrl);
        window.open(paymentUrl, '_blank');
        // Cerrar el modal después de abrir la nueva pestaña
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        alert('❌ Error: No se encontró el enlace de pago para este plan');
        console.error('PaymentLink.linkUrl no encontrado en el plan:', selectedPlan);
      }
    } else if (option === 'card') {
      setShowCardForm(true);
    }
  }, [selectedPlan, onClose]);

  const handleCardPayment = useCallback(async () => {
    setError('');
    setProcessingPayment(true);

    try {
      // Validaciones
      if (!cardData.customerEmail || !cardData.customerName || !cardData.phoneNumber || 
          !cardData.cardNumber || !cardData.cardHolderName || !cardData.cvv || 
          !cardData.expirationMonth || !cardData.expirationYear) {
        throw new Error('Por favor completa todos los campos requeridos');
      }

      // Generar customer ID aleatorio
      const customerId = `customer${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

      // 1. Crear método de pago
      const paymentMethodPayload = {
        customer: {
          id: customerId,
          name: cardData.customerName,
          email: cardData.customerEmail,
          phoneNumber: cardData.phoneNumber
        },
        card: {
          number: cardData.cardNumber,
          cardHolder: cardData.cardHolderName,
          expirationMonth: cardData.expirationMonth,
          expirationYear: cardData.expirationYear,
          cvv: cardData.cvv,
          singleUse: false
        }
      };

      console.log('Creating payment method with payload:', paymentMethodPayload);
      const paymentMethodResponse = await api.createPaymentMethod(paymentMethodPayload);
      console.log('Payment Method Response:', paymentMethodResponse);

      if (!paymentMethodResponse.id) {
        throw new Error(paymentMethodResponse.message || 'No se pudo crear el método de pago');
      }

      const paymentMethodId = paymentMethodResponse.id;
      
      // Guardar para usar en caso de 3DS
      setSavedPaymentMethodId(paymentMethodId);
      setSavedCustomerId(customerId);
      setSavedPlanId(selectedPlan.planId);
      setSavedCustomerData({
        name: cardData.customerName,
        email: cardData.customerEmail,
        phoneNumber: cardData.phoneNumber || null
      });

      // 2. Crear suscripción
      const subscriptionPayload = {
        planId: selectedPlan.planId,
        customer: {
          id: customerId,
          name: cardData.customerName,
          email: cardData.customerEmail,
          phoneNumber: cardData.phoneNumber
        },
        paymentMethod: {
          id: paymentMethodId
        },
        authenticationId: null,
        locationCode: process.env.REACT_APP_LOCATION_CODE
      };

      console.log('Creating subscription with payload:', subscriptionPayload);
      const subscriptionResponse = await api.createSubscription(subscriptionPayload);
      console.log('Subscription Response:', subscriptionResponse);

      // 3. Verificar si requiere autenticación 3DS
      if (subscriptionResponse.status === "AUTHENTICATION_REQUIRED") {
        console.log('3DS Authentication required');
        console.log('3DS URL:', subscriptionResponse.authentication.url);
        setIframeUrl(subscriptionResponse.authentication.url);
        setShow3DSIframe(true);
        setShowCardForm(false);
      } else if (subscriptionResponse.status === "SUCCEEDED") {
        // Pago exitoso sin 3DS
        setSubscriptionDetails(subscriptionResponse);
        setShowSuccessModal(true);
      } else {
        throw new Error(subscriptionResponse.error.code + ' - ' + subscriptionResponse.error.message || 'Error al crear la suscripción');
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setProcessingPayment(false);
    }
  }, [cardData, selectedPlan]);

  const handle3DSMessage = useCallback((dataMessage) => {
    console.log('Mensaje recibido del iframe 3DS:', dataMessage);
    
    if (dataMessage.MessageType === "authentication.complete" && 
        dataMessage.Status === "SUCCESS" && 
        dataMessage.AuthenticationId) {
      // Reenviar la suscripción con el authenticationId
      handleCreateSubscriptionWithAuth(dataMessage.AuthenticationId);
    } else {
      console.error('3DS authentication failed or was cancelled.');
      setError('Autenticación 3DS fallida o cancelada');
      setShow3DSIframe(false);
      setShowCardForm(true);
    }
  }, [handleCreateSubscriptionWithAuth]);

  if (!showModal || !selectedPlan) return null;

  // Modal de éxito con detalles de la suscripción
  if (showSuccessModal && subscriptionDetails) {
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
              onClick={handleClose}
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
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid #333'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <h2 style={{ color: 'white', margin: 0, flex: 1 }}>
            {selectedPlan.name}
          </h2>
          {!show3DSIframe && (
            <button
              onClick={handleClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#9ca3af',
                fontSize: '32px',
                cursor: 'pointer',
                padding: 0,
                margin: 0,
                lineHeight: 1,
                minWidth: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
            >
              ×
            </button>
          )}
        </div>

        <p style={{
          color: '#98ca3f',
          fontSize: '32px',
          fontWeight: 'bold',
          margin: '0 0 20px 0'
        }}>         
         <span style={{ fontSize: '16px', color: '#9ca3af' }}>{selectedPlan.currencyCode} </span>
         ${selectedPlan.paymentLink.amount} 
         <span style={{ fontSize: '16px', color: '#9ca3af' }}>/ {selectedPlan.billingCycleType === 'Month' ? 'mes' : 'año'}</span>
        </p>

        {error && (
          <div style={{
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* Mostrar iframe 3DS */}
        {show3DSIframe ? (
          <div>
            <IFrameWithMessageListener
              url={iframeUrl}
              handleMessage={handle3DSMessage}
            />
          </div>
        ) : showCardForm ? (
          /* Formulario de tarjeta */
          <div>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>
              Información de Pago
            </h3>
            
            <MemoizedInput
              type="email"
              name="customerEmail"
              value={cardData.customerEmail}
              onChange={handleCardInputChange}
              placeholder="ejemplo@email.com"
              label="Email del Cliente *"
              style={inputStyle}
            />

            <MemoizedInput
              type="text"
              name="customerName"
              value={cardData.customerName}
              onChange={handleCardInputChange}
              placeholder="Juan Pérez"
              label="Nombre del Cliente *"
              style={inputStyle}
            />

            <MemoizedInput
              type="tel"
              name="phoneNumber"
              value={cardData.phoneNumber}
              onChange={handleCardInputChange}
              placeholder="+50364331900"
              label="Teléfono *"
              style={inputStyle}
            />

            <MemoizedInput
              type="text"
              name="cardNumber"
              value={cardData.cardNumber}
              onChange={handleCardInputChange}
              placeholder="4000000000002701"
              maxLength="16"
              label="Número de Tarjeta *"
              style={inputStyle}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <MemoizedInput
                type="text"
                name="expirationMonth"
                value={cardData.expirationMonth}
                onChange={handleCardInputChange}
                placeholder="12"
                maxLength="2"
                label="Mes *"
                style={inputStyle}
              />
              <MemoizedInput
                type="text"
                name="expirationYear"
                value={cardData.expirationYear}
                onChange={handleCardInputChange}
                placeholder="2025"
                maxLength="4"
                label="Año *"
                style={inputStyle}
              />
              <MemoizedInput
                type="text"
                name="cvv"
                value={cardData.cvv}
                onChange={handleCardInputChange}
                placeholder="123"
                maxLength="4"
                label="CVV *"
                style={inputStyle}
              />
            </div>

            <MemoizedInput
              type="text"
              name="cardHolderName"
              value={cardData.cardHolderName}
              onChange={handleCardInputChange}
              placeholder="JUAN PEREZ"
              label="Nombre en la Tarjeta *"
              style={inputStyle}
            />

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => setShowCardForm(false)}
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
                onClick={handleCardPayment}
                disabled={processingPayment}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: processingPayment ? '#666' : '#98ca3f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: processingPayment ? 'not-allowed' : 'pointer'
                }}
              >
                {processingPayment ? 'Procesando...' : 'Pagar Ahora'}
              </button>
            </div>
          </div>
        ) : (
          /* Opciones de pago */
          <div>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>
              Selecciona tu método de pago
            </h3>
            
            <button
              onClick={() => handlePaymentOptionSelect('n1co')}
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
              onClick={() => handlePaymentOptionSelect('card')}
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
        )}
      </div>

      {/* Overlay de procesamiento de pago */}
      {processingPayment && !showSuccessModal && (
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
      )}
    </div>
  );
};

export default PaymentModal;
