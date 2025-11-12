/**
 * API Wrapper para N1co
 * 
 * Este módulo envuelve todas las llamadas a la API de N1co con:
 * - Inyección automática de tokens de autenticación
 * - Renovación automática de tokens en caso de error 401
 * - Manejo centralizado de errores
 * - Carga optimizada de múltiples recursos
 * 
 * Uso:
 *   import api from './apiWrapper';
 *   const plan = await api.getPlanById(123);
 *   const plans = await api.getPlansByIds([123, 456, 789]);
 */

import { authManager } from './authManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Wrapper para llamadas a la API de N1co con inyección automática de tokens
 */
class ApiWrapper {
  /**
   * Realiza una petición con manejo automático de autenticación
   */
  async request(endpoint, options = {}) {
    try {
      // Obtener token válido
      const token = await authManager.getValidToken();

      // Preparar headers con token
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token,
        ...options.headers
      };

      // Realizar petición
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      // Si es 401, intentar renovar token y reintentar
      if (response.status === 401) {
        console.warn('⚠️ Token expirado, renovando...');
        authManager.clearToken();
        const newToken = await authManager.getValidToken();
        
        // Reintentar con nuevo token
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            ...headers,
            'Authorization': newToken
          }
        });

        if (!retryResponse.ok) {
          throw new Error(`API error: ${retryResponse.status}`);
        }

        return await retryResponse.json();
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ API Request failed:', error);
      throw error;
    }
  }

  /**
   * Obtiene un plan por ID
   */
  async getPlanById(planId) {
    console.log(`📋 Fetching plan ${planId}...`);
    return this.request(`/Plans/${planId}`, { method: 'GET' });
  }

  /**
   * Obtiene múltiples planes en paralelo (optimizado)
   */
  async getPlansByIds(planIds) {
    console.log(`📋 Fetching ${planIds.length} plans in parallel...`);
    const startTime = performance.now();
    
    try {
      const promises = planIds.map(id => this.getPlanById(id));
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`✅ ${results.length} plans loaded in ${duration}s`);
      return results;
    } catch (error) {
      console.error('❌ Error loading plans:', error);
      throw error;
    }
  }

  /**
   * Crea un método de pago
   */
  async createPaymentMethod(paymentMethodData) {
    console.log('💳 Creating payment method...');
    return this.request('/PaymentMethods', {
      method: 'POST',
      body: JSON.stringify(paymentMethodData)
    });
  }

  /**
   * Crea una suscripción
   */
  async createSubscription(subscriptionData) {
    console.log('📝 Creating subscription...');
    return this.request('/Subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData)
    });
  }
}

// Exportar instancia única (singleton)
const api = new ApiWrapper();
export default api;
