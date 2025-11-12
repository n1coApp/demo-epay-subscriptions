import React, { useState, useEffect } from 'react';
import api from '../utils/apiWrapper';
import PaymentModal from './PaymentModal/index';

// Obtener la lista de IDs de planes desde variables de entorno
const getPlanIds = () => {
  const planIdsString = import.meta.env.VITE_PLAN_IDS;
  return planIdsString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
};

const PricingSection = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    let isMounted = true; // Para evitar actualizaciones si el componente se desmonta

    const loadPlans = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('📋 Loading plans...');

        // Cargar los 3 planes en paralelo (1 sola vez)
        const planIds = getPlanIds();
        console.log('📋 Loading plans with IDs:', planIds);

        const loadedPlans = await api.getPlansByIds(planIds);

        if (isMounted) {
          setPlans(loadedPlans);
          console.log('✅ All plans loaded successfully:', loadedPlans.length);
        }
      } catch (err) {
        console.error('❌ Error loading plans:', err);
        if (isMounted) {
          setError('Error al cargar los planes. Por favor, recarga la página.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPlans();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Solo se ejecuta una vez al montar

  const getBillingLabel = (billingCycleType) => 
    billingCycleType === 'Month' ? 'Mensual' : 'Anual';

  const FeatureIcon = ({ isIncluded }) => (
    <span style={{ 
      color: isIncluded ? '#98ca3f' : '#6b7280', 
      marginRight: '10px', 
      fontSize: '20px' 
    }}>
      {isIncluded ? '✓' : '✗'}
    </span>
  );

  const handleSubscribeClick = (plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPlan(null);
  };

  const PlanCard = ({ plan, index, totalPlans }) => {
    const customFields = plan.paymentLink?.customFields || [];
    
    // Buscar label de ahorro en los custom fields
    const savingsField = customFields.find(field => field.name === 'savings_label');
    const savingsLabel = savingsField?.defaultValue || savingsField?.label || '';
    
    const amount = plan.paymentLink?.amount || 0;
    const features = customFields.filter(field => field.name?.startsWith('feature_'));

    return (
      <div style={{
        backgroundColor: '#0a0a0a',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '30px',
        flex: '0 0 calc(33.333% - 20px)',
        maxWidth: '380px',
        minWidth: '280px',
        color: 'white',
        position: 'relative',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.backgroundColor = '#1a1a1a';
        e.currentTarget.style.border = '2px solid #98ca3f';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(152, 202, 63, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.backgroundColor = '#0a0a0a';
        e.currentTarget.style.border = '1px solid #333';
        e.currentTarget.style.boxShadow = 'none';
      }}
      >
        {savingsLabel && (
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#98ca3f',
            color: 'black',
            padding: '5px 15px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            {savingsLabel}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
            {plan.name || 'Plan sin nombre'}
          </h2>
          <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '5px' }}>
            {getBillingLabel(plan.billingCycleType)}
          </div>
          {plan.description && (
            <div style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.4' }}>
              {plan.description}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '5px' }}>
            <span style={{ fontSize: '14px', marginRight: '5px' }}>{plan.currencyCode}</span>
            <span style={{ fontSize: '36px', fontWeight: 'bold' }}>
              ${Math.floor(amount)}
            </span>
            <span style={{ fontSize: '18px', marginLeft: '5px', color: '#9ca3af' }}>
              /{plan.billingCycleType === 'Month' ? 'mes' : 'año'}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          {features.map((feature, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'flex-start',
              marginBottom: '12px',
              color: feature.defaultValue === 'included' ? 'white' : '#6b7280'
            }}>
              <FeatureIcon isIncluded={feature.defaultValue === 'included'} />
              <span style={{ fontSize: '14px', lineHeight: '1.4' }}>
                {feature.label}
              </span>
            </div>
          ))}
        </div>

        <button style={{
          width: '100%',
          padding: '14px',
          backgroundColor: 'transparent',
          color: '#98ca3f',
          border: '2px solid #98ca3f',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#98ca3f';
          e.currentTarget.style.color = 'black';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#98ca3f';
        }}
        onClick={() => handleSubscribeClick(plan)}
        >
          Suscríbete
        </button>
      </div>
    );
  };

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#000', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ 
          color: 'white', 
          textAlign: 'center', 
          fontSize: '32px', 
          marginBottom: '40px',
          fontWeight: 'bold'
        }}>
          Planes de Suscripción
        </h2>

        {error && (
          <div style={{
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'white', fontSize: '18px' }}>
            Cargando planes...
          </div>
        ) : plans.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '18px' }}>
            No se encontraron planes.
          </div>
        ) : (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '80px',
              flexWrap: 'wrap',
              maxWidth: '1300px',
              margin: '0 auto',
              marginBottom: '40px'
            }}>
              {plans.map((plan, index) => (
                <PlanCard 
                  key={plan.planId || index} 
                  plan={plan} 
                  index={index}
                  totalPlans={plans.length}
                />
              ))}
            </div>

            <div style={{
              textAlign: 'center',
              color: '#9ca3af',
              marginTop: '40px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span>Usa el medio de pago que prefieras:</span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '24px' }}>💳</span>
                  <span>n1co · VISA · Mastercard</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <PaymentModal 
        showModal={showModal}
        selectedPlan={selectedPlan}
        onClose={closeModal}
      />
    </div>
  );
};

export default PricingSection;
