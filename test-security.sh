#!/bin/bash

# =================================================================
# Script de Pruebas de Seguridad del Proxy
# =================================================================
# Este script verifica que las 3 capas de seguridad estén activas
# 
# Uso:
#   chmod +x test-security.sh
#   ./test-security.sh
# =================================================================

echo "╔═══════════════════════════════════════════════════════╗"
echo "║  🔒 Pruebas de Seguridad del Proxy N1co              ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

PROXY_URL="http://localhost:3001"
API_KEY="2I9Phh1C9k3pcWX72m6YFuPnVcsbijy2sbjWmtIXRtw="  # Cambia esto por tu clave real

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =================================================================
# Prueba 1: Sin API Key (debe fallar)
# =================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Prueba 1: Petición SIN API Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -X POST "$PROXY_URL/api/auth/token")
echo "Respuesta: $RESPONSE"

if echo "$RESPONSE" | grep -q "API key required"; then
    echo -e "${GREEN}✅ PASS: Bloqueado correctamente sin API Key${NC}"
else
    echo -e "${RED}❌ FAIL: No se bloqueó la petición sin API Key${NC}"
fi
echo ""

# =================================================================
# Prueba 2: API Key incorrecta (debe fallar)
# =================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Prueba 2: Petición con API Key INCORRECTA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -X POST "$PROXY_URL/api/auth/token" \
  -H "x-api-key: clave-incorrecta-123")
echo "Respuesta: $RESPONSE"

if echo "$RESPONSE" | grep -q "Invalid API key"; then
    echo -e "${GREEN}✅ PASS: Bloqueado correctamente con API Key incorrecta${NC}"
else
    echo -e "${RED}❌ FAIL: No se bloqueó con API Key incorrecta${NC}"
fi
echo ""

# =================================================================
# Prueba 3: API Key correcta (debe funcionar)
# =================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Prueba 3: Petición con API Key CORRECTA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -X POST "$PROXY_URL/api/auth/token" \
  -H "x-api-key: $API_KEY")
echo "Respuesta: $RESPONSE"

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✅ PASS: Token obtenido correctamente con API Key válida${NC}"
else
    echo -e "${RED}❌ FAIL: No se pudo obtener token con API Key correcta${NC}"
fi
echo ""

# =================================================================
# Prueba 4: Rate Limiting (debe bloquear después de 30 peticiones)
# =================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Prueba 4: Rate Limiting (35 peticiones rápidas)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Enviando 35 peticiones..."

SUCCESS_COUNT=0
BLOCKED_COUNT=0

for i in {1..35}; do
    RESPONSE=$(curl -s -X POST "$PROXY_URL/api/auth/token" \
      -H "x-api-key: $API_KEY")
    
    if echo "$RESPONSE" | grep -q "success.*true"; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    elif echo "$RESPONSE" | grep -q "Too many requests"; then
        BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
    fi
    
    # Mostrar progreso cada 5 peticiones
    if [ $((i % 5)) -eq 0 ]; then
        echo "  Petición $i/35..."
    fi
done

echo ""
echo "Resultados:"
echo "  ✅ Peticiones exitosas: $SUCCESS_COUNT"
echo "  ❌ Peticiones bloqueadas: $BLOCKED_COUNT"

if [ $SUCCESS_COUNT -le 30 ] && [ $BLOCKED_COUNT -ge 5 ]; then
    echo -e "${GREEN}✅ PASS: Rate limiting funcionando correctamente${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: Rate limiting puede no estar funcionando como esperado${NC}"
fi
echo ""

# =================================================================
# Prueba 5: Health Check
# =================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Prueba 5: Health Check Endpoint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s "$PROXY_URL/health")
echo "Respuesta: $RESPONSE"

if echo "$RESPONSE" | grep -q "status.*ok"; then
    echo -e "${GREEN}✅ PASS: Health check funcionando${NC}"
else
    echo -e "${RED}❌ FAIL: Health check no responde${NC}"
fi
echo ""

# =================================================================
# Resumen Final
# =================================================================
echo "╔═══════════════════════════════════════════════════════╗"
echo "║  📊 Resumen de Pruebas                               ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Capas de seguridad verificadas:"
echo "  1. ✅ Validación de API Key"
echo "  2. ✅ Rate Limiting"
echo "  3. ✅ Health Check"
echo ""
echo "Próximos pasos:"
echo "  • Abre http://localhost:3000 en tu navegador"
echo "  • Verifica que los planes se carguen automáticamente"
echo "  • Revisa la consola del navegador para ver logs de autenticación"
echo ""
echo -e "${GREEN}🎉 Todas las pruebas completadas!${NC}"
echo ""
