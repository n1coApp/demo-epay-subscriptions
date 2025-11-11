import React, { useState, useEffect } from "react";
import PricingSection from "./components/PricingSection";
import { authManager } from "./utils/authManager";

function App() {
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsAuthenticating(true);
        await authManager.getValidToken();
        setAuthError(null);
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        setAuthError(error.message);
        alert(`❌ Error de autenticación\n\n${error.message}\n\nPor favor, verifica tus credenciales en el archivo .env y recarga la página.`);
      } finally {
        setIsAuthenticating(false);
      }
    };

    initAuth();
  }, []);

  if (isAuthenticating) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid #333',
          borderTop: '4px solid #98ca3f',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#1a1a2e',
          border: '2px solid #dc2626',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: '#dc2626', marginBottom: '20px' }}>Error de Autenticación</h2>
          <p style={{ color: '#fff', marginBottom: '30px', lineHeight: '1.6' }}>{authError}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#98ca3f',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#7ab32e'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#98ca3f'}
          >
            🔄 Recargar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000' }}>
      <PricingSection />
    </div>
  );
}

export default App;

