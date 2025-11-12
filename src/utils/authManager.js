/**
 * AuthManager - Sistema de gestión automática de tokens de autenticación
 * 
 * Características:
 * - Obtiene tokens desde el servidor proxy (credenciales seguras)
 * - Envía API Key para autenticación con el proxy
 * - Renovación automática cuando el token está próximo a expirar (60s antes)
 * - Caché del token en memoria para evitar llamadas innecesarias
 * - Prevención de múltiples llamadas simultáneas de renovación
 * 
 * Uso:
 *   import { authManager } from './authManager';
 *   const token = await authManager.getValidToken();
 * 
 * Variables de entorno requeridas:
 * - VITE_API_PROXY_URL (URL del servidor proxy)
 * - VITE_PROXY_API_KEY (API Key para autenticación con el proxy)
 */

const PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001';
const PROXY_API_KEY = import.meta.env.VITE_PROXY_API_KEY;

class AuthManager {
  constructor() {
    this.token = null;
    this.tokenExpiresAt = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  // Obtener token válido (genera uno nuevo si no existe o está expirado)
  async getValidToken() {
    // Si ya hay un refresh en proceso, esperar a que termine
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // Si el token existe y no ha expirado, devolverlo
    if (this.token && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    // Generar nuevo token
    return this.refreshToken();
  }

  // Generar o renovar el token desde el servidor proxy
  async refreshToken() {
    this.isRefreshing = true;

    try {
      console.log('🔐 Requesting token from proxy server...');
      
      // Validar que el API Key esté configurado
      if (!PROXY_API_KEY) {
        throw new Error('REACT_APP_PROXY_API_KEY no está configurado en las variables de entorno');
      }
      
      this.refreshPromise = fetch(`${PROXY_URL}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': PROXY_API_KEY  // Enviar API Key para autenticación
        }
      });

      const response = await this.refreshPromise;

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        this.token = data.token;
        // Restar 60 segundos al tiempo de expiración para renovar antes de que expire
        const expiresIn = data.expiresIn || 3600; // Default 1 hora
        this.tokenExpiresAt = Date.now() + (expiresIn * 1000) - 60000;
        
        console.log(`✅ Token obtained ${data.fromCache ? '(from cache)' : '(fresh)'}`);
        console.log(`🕐 Expires in: ${expiresIn} seconds`);
        
        this.isRefreshing = false;
        this.refreshPromise = null;
        return this.token;
      } else {
        this.isRefreshing = false;
        this.refreshPromise = null;
        throw new Error(data.error || 'Error al obtener el token de autenticación');
      }
    } catch (error) {
      this.isRefreshing = false;
      this.refreshPromise = null;
      console.error('❌ Error obtaining token from proxy:', error);
      throw new Error(`No se pudo autenticar con el servidor proxy: ${error.message}`);
    }
  }

  // Limpiar el token (útil para logout o errores)
  clearToken() {
    this.token = null;
    this.tokenExpiresAt = null;
  }

  // Verificar si hay un token válido
  hasValidToken() {
    return this.token && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt;
  }
}

// Exportar una instancia única (Singleton)
export const authManager = new AuthManager();
