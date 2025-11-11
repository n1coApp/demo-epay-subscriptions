/**
 * Servidor Proxy para Autenticación Segura con N1co API
 * 
 * Este servidor maneja las credenciales de N1co de forma segura en el backend,
 * evitando exponerlas en el código JavaScript del navegador.
 * 
 * CAPAS DE SEGURIDAD:
 * 1. CORS diferenciado por entorno (localhost solo en dev)
 * 2. API Key obligatoria
 * 3. Rate Limiting (30 req/min en dev, 20 en prod)
 * 4. Validación de NODE_ENV
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ====================================
// CONFIGURACIÓN DE SEGURIDAD
// ====================================

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const API_KEY = process.env.PROXY_API_KEY;

// Validar configuración crítica al inicio
if (!API_KEY || API_KEY === 'default-insecure-key-change-this' || API_KEY === 'tu-clave-super-secreta-cambiar-esto-123456') {
  console.error('╔════════════════════════════════════════════════════╗');
  console.error('║   ⚠️  CRITICAL ERROR: Invalid API Key            ║');
  console.error('╚════════════════════════════════════════════════════╝');
  console.error('Please set PROXY_API_KEY in your .env file');
  console.error('Generate a secure key: openssl rand -base64 32');
  process.exit(1);
}

if (IS_PRODUCTION && !process.env.FRONTEND_URL) {
  console.error('╔════════════════════════════════════════════════════╗');
  console.error('║   ⚠️  CRITICAL ERROR: Missing FRONTEND_URL       ║');
  console.error('╚════════════════════════════════════════════════════╝');
  console.error('In production, you must set FRONTEND_URL in .env');
  console.error('Example: FRONTEND_URL=https://tu-app.vercel.app');
  process.exit(1);
}

// 1. CORS - Configuración diferenciada por entorno
const corsOptions = {
  origin: function (origin, callback) {
    let allowedOrigins = [];
    
    if (IS_PRODUCTION) {
      // PRODUCCIÓN: Solo tu dominio desplegado
      allowedOrigins = [
        process.env.FRONTEND_URL,
      ].filter(Boolean);
      
      console.log('🔒 Production mode - CORS restricted to:', allowedOrigins);
      
      // En producción, SIEMPRE verificar origin
      if (!origin) {
        console.warn('⚠️  Blocked request without origin header in production');
        return callback(new Error('Origin required in production'));
      }
    } else {
      // DESARROLLO: localhost permitido
      allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001', // Para el health check
      ];
      
      console.log('🔓 Development mode - CORS allows localhost');
      
      // En desarrollo, permitir requests sin origin (Postman, curl)
      if (!origin) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('╔════════════════════════════════════════════════════╗');
      console.warn('║   🚫 CORS BLOCKED                                 ║');
      console.warn('╚════════════════════════════════════════════════════╝');
      console.warn(`Origin: ${origin}`);
      console.warn(`Allowed: ${allowedOrigins.join(', ')}`);
      console.warn(`Environment: ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// 2. API Key - Validación de clave secreta

// Middleware de validación de API Key
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    console.warn('⚠️  Request without API key from:', req.ip);
    return res.status(401).json({ 
      success: false,
      error: 'API key required',
      hint: 'Include x-api-key header'
    });
  }
  
  if (apiKey !== API_KEY) {
    console.warn(`⚠️  Invalid API key from ${req.ip}: ${apiKey.substring(0, 10)}...`);
    return res.status(403).json({ 
      success: false,
      error: 'Invalid API key'
    });
  }
  
  console.log(`✅ Valid API key from ${req.ip}`);
  next();
};

// 3. Rate Limiting - Prevenir abuso
const rateLimit = {};
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_REQUESTS = IS_PRODUCTION ? 20 : 30; // Más estricto en producción

const rateLimiter = (req, res, next) => {
  const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  
  if (!rateLimit[clientId]) {
    rateLimit[clientId] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
  } else if (now > rateLimit[clientId].resetTime) {
    rateLimit[clientId] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
  } else {
    rateLimit[clientId].count++;
    
    if (rateLimit[clientId].count > MAX_REQUESTS) {
      console.warn(`⚠️  Rate limit exceeded for ${clientId} (${rateLimit[clientId].count}/${MAX_REQUESTS})`);
      return res.status(429).json({ 
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimit[clientId].resetTime - now) / 1000)
      });
    }
  }
  
  next();
};

// Aplicar middleware en orden
app.use(cors(corsOptions));
app.use(express.json());
app.use(rateLimiter);

// Cache del token en memoria
let tokenCache = {
  token: null,
  expiresAt: 0
};

/**
 * Endpoint: POST /api/auth/token
 * Obtiene un token de autenticación de N1co API
 */
app.post('/api/auth/token', validateApiKey, async (req, res) => {
  try {
    // Verificar si hay token válido en caché
    if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
      const ttl = Math.floor((tokenCache.expiresAt - Date.now()) / 1000);
      console.log(`✅ Returning cached token (TTL: ${ttl}s)`);
      
      return res.json({
        success: true,
        token: tokenCache.token,
        fromCache: true,
        ttl
      });
    }

    console.log('🔄 Fetching new token from N1co API...');

    // Validar que las credenciales estén configuradas
    if (!process.env.N1CO_CLIENT_ID || !process.env.N1CO_CLIENT_SECRET) {
      console.error('❌ Missing credentials in environment variables');
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error: Missing N1co credentials'
      });
    }

    // Obtener nuevo token desde N1co API
    const response = await axios.post(
      `${process.env.REACT_APP_API_BASE_URL}/Token`,
      {
        clientId: process.env.N1CO_CLIENT_ID,
        clientSecret: process.env.N1CO_CLIENT_SECRET,
        grantType: 'client_credentials'
      }
    );

    const { tokenType, accessToken, expiresIn } = response.data;

    // Actualizar caché (expira 60 segundos antes para seguridad)
    const fullToken = `${tokenType} ${accessToken}`;
    tokenCache = {
      token: fullToken,
      expiresAt: Date.now() + ((expiresIn - 60) * 1000)
    };

    console.log(`✅ New token cached (expires in ${expiresIn}s)`);

    res.json({
      success: true,
      token: fullToken,
      expiresIn,
      fromCache: false
    });
  } catch (error) {
    console.error('❌ Error getting token:', error.response?.data || error.message);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to authenticate with N1co API',
      details: IS_PRODUCTION ? undefined : error.response?.data?.message
    });
  }
});

/**
 * Health check endpoint (no requiere API key)
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    environment: IS_PRODUCTION ? 'production' : 'development',
    timestamp: new Date().toISOString(),
    hasToken: !!tokenCache.token,
    tokenValid: tokenCache.token && Date.now() < tokenCache.expiresAt,
    rateLimitMax: MAX_REQUESTS
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'POST /api/auth/token',
      'GET /health'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   🚀 N1co Auth Proxy Server                       ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${IS_PRODUCTION ? '� PRODUCTION' : '🔓 DEVELOPMENT'}`);
  console.log(`�📡 N1co API: ${process.env.REACT_APP_API_BASE_URL}`);
  console.log(`🔐 Client ID: ${process.env.N1CO_CLIENT_ID ? '✓' : '✗'}`);
  console.log(`🔑 Client Secret: ${process.env.N1CO_CLIENT_SECRET ? '✓' : '✗'}`);
  console.log(`🛡️  API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);
  console.log(`⚡ Rate Limit: ${MAX_REQUESTS} req/min`);
  
  if (IS_PRODUCTION) {
    console.log(`🌐 Allowed Origin: ${process.env.FRONTEND_URL}`);
  } else {
    console.log(`🌐 Allowed Origins: localhost:3000, 127.0.0.1:3000`);
  }
  
  console.log('════════════════════════════════════════════════════');
  console.log('Ready to accept requests! 🎯\n');
});
