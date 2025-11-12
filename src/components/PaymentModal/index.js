import React, { useState, useCallback, useMemo } from 'react';
import api from '../../utils/apiWrapper';
import IFrameWithMessageListener from '../IFrameWithMessageListener';
import SuccessModal from './SuccessModal';
import CardPaymentForm from './CardPaymentForm';
import PaymentMethodSelector from './PaymentMethodSelector';
import ProcessingOverlay from './ProcessingOverlay';

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
        locationCode: import.meta.env.VITE_LOCATION_CODE
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
        locationCode: import.meta.env.VITE_LOCATION_CODE
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
    return <SuccessModal subscriptionDetails={subscriptionDetails} onClose={handleClose} />;
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
          <CardPaymentForm
            cardData={cardData}
            onInputChange={handleCardInputChange}
            onBack={() => setShowCardForm(false)}
            onSubmit={handleCardPayment}
            isProcessing={processingPayment}
            inputStyle={inputStyle}
          />
        ) : (
          <PaymentMethodSelector
            onSelectMethod={handlePaymentOptionSelect}
            selectedPlan={selectedPlan}
          />
        )}
      </div>

      {/* Overlay de procesamiento de pago */}
      <ProcessingOverlay isProcessing={processingPayment && !showSuccessModal} />
    </div>
  );
};

export default PaymentModal;
