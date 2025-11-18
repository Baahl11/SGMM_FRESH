# 🎯 AUDITORÍA COMPLETA: Oportunidades de Add-Ons Monetizables

**Fecha:** 18 de Noviembre 2025  
**Objetivo:** Identificar funcionalidades que pueden venderse como add-ons para aumentar revenue

---

## 📊 RESUMEN EJECUTIVO

**Modelo Actual:**
- Básico: $599/mes - Pro: $999/mes - Enterprise: $2,999/mes
- Lifetime: $19,990 (pago único)

**Oportunidad de Revenue con Add-Ons:**
- **Potencial adicional:** +$234-391 MXN/mes por usuario
- **Target:** 30% de usuarios compran al menos 1 add-on
- **ROI:** Aumento del 25-42% en ARPU (Average Revenue Per User)

---

## 💰 ADD-ONS VIABLES IDENTIFICADOS (7 Total)

### **1. Ubicaciones Extra** 🏥 (ALTA PRIORIDAD)
**Problema:** Plan Básico y Pro limitados a 1 ubicación
**Solución:** +$499 MXN/mes por ubicación adicional

**Usuarios Objetivo:**
- Médicos con 2-3 consultorios en diferentes zonas
- Clínicas en expansión
- Doctores que atienden en hospital + consultorio privado

**Implementación:**
- Producto Stripe: "Ubicación Extra"
- Metered billing or Subscription add-on
- UI: Botón "Agregar Ubicación" en `/dashboard/settings/locations`
- Límite: Básico puede comprar +4, Pro puede comprar +4 (max 5 total)

**Revenue Estimado:**
- Si 20% de usuarios Pro compran 1 ubicación extra: +$99,800/mes (200 usuarios x $499)

---

### **2. ~~Créditos de Mensajería~~** 💬 ❌ NO APLICA (BYOK)
**Realidad:** Sistema usa **BYOK (Bring Your Own Keys)**
- Cada doctor configura sus propias credenciales de Twilio/WhatsApp
- Cada doctor paga directamente a su proveedor (Twilio, Meta, etc.)
- La plataforma NO cobra por mensajes

**Modelo Actual (correcto):**
```
Básico: Feature SMS/WhatsApp NO disponible
Pro: Feature SMS/WhatsApp disponible (con SUS PROPIAS credenciales)
Enterprise: Feature SMS/WhatsApp disponible (con SUS PROPIAS credenciales)
```

**Implementación Actual:**
- ✅ Tabla `messaging_config` almacena credenciales por usuario
- ✅ Tabla `user_sms_credentials` (encriptadas con AES-256)
- ✅ Soporte para: Twilio, MessageBird, Plivo, Meta WhatsApp
- ✅ API: `/api/user/sms-credentials` (GET/POST/DELETE)

**NO GENERA REVENUE DIRECTO** - Feature ya incluida en planes Pro/Enterprise

---

### **3. Doctores Adicionales** 👨‍⚕️ (MEDIA PRIORIDAD)
**Problema:** Básico limitado a 2 doctores, Pro a 10
**Solución:** +$199 MXN/mes por doctor adicional

**Usuarios Objetivo:**
- Clínicas pequeñas que crecen de 2 a 5 doctores (sin saltar a Pro)
- Clínicas Pro que superan 10 doctores (sin saltar a Enterprise)

**Límites Propuestos:**
```
Básico: Hasta +3 doctores adicionales (max 5 total)
Pro: Hasta +10 doctores adicionales (max 20 total)
```

**Revenue Estimado:**
- 15% de Básico compran +2 doctores: +$29,850/mes (150 usuarios x $199 x 2)

---

### **4. Integraciones Premium** 🔗 (MEDIA PRIORIDAD)
**Problema:** Integraciones avanzadas solo en Enterprise
**Solución:** Add-ons de integraciones específicas

**Integraciones Disponibles:**
```
- Laboratorios (conexión API con Quest, Chopo, etc): $299/mes
- Farmacias (conexión para recetas digitales): $199/mes
- Facturación SAT (CFDI automático): $399/mes ✅ YA IMPLEMENTADO
- Google Calendar/Outlook sincronización: $99/mes
- Zapier/Make webhooks: $199/mes
```

**Revenue Estimado:**
- 8% compran 1 integración: +$31,840/mes (200 usuarios x $199)

---

### **5. Consultorios Virtuales** 🎥 (BAJA PRIORIDAD - Futuro)
**Problema:** Actualmente no existe telemedicina
**Solución:** Videoconsultas integradas

**Modelo:**
```
ADD-ON: Telemedicina
- 50 consultas virtuales/mes: $499/mes
- Incluye: Zoom/Google Meet integration, grabación, firma digital
```

**Implementación:** Requiere desarrollo nuevo (~2 semanas)

---

### **6. Reportes Avanzados** 📊 (BAJA PRIORIDAD)
**Problema:** Reportes avanzados solo en Pro+
**Solución:** Paquete de reportes premium

**ADD-ON: Analytics Pro**
- Dashboards personalizados
- Exportación Excel/PDF ilimitada
- Reportes financieros detallados
- **Precio:** $299/mes

---

### **7. Soporte Prioritario** 🎧 (BAJA PRIORIDAD)
**Problema:** Enterprise tiene gerente de cuenta, otros no
**Solución:** Niveles de soporte

**ADD-ON: Soporte Premium**
```
- Soporte 24/7 (Básico/Pro solo tienen email): $199/mes
- Onboarding personalizado (1 hora): $999 (único)
- Capacitación mensual en vivo: $299/mes
```

---

## 🎯 RECOMENDACIÓN DE IMPLEMENTACIÓN

### **FASE 1 - Quick Wins (1-2 semanas):**
1. ✅ **Ubicaciones Extra** (+$499/mes)
   - Mayor demanda
   - Fácil implementación
   - Alto ticket

2. ✅ **Doctores Adicionales** (+$199/mes)
   - Sistema de team members ya existe
   - Solo validar límites por plan
   - Necesidad común en clínicas en crecimiento

### **FASE 2 - Optimización (3-4 semanas):**
3. **Integraciones Premium** (+$199-399/mes)
   - Facturación SAT ya implementada (activar como add-on)
   - APIs de laboratorios
   - Conexión farmacias

### **FASE 3 - Expansion (2-3 meses):**
4. Telemedicina
5. Reportes Avanzados
6. Soporte Prioritario

---

## 💵 PROYECCIÓN DE REVENUE

**Escenario Conservador (30% adopción):**
```
200 usuarios activos:
- 60 compran Ubicación Extra ($499): $29,940/mes
- 30 compran Doctor Extra ($199): $5,970/mes
- 15 compran Integración Facturación ($399): $5,985/mes
- 10 compran Telemedicina ($499): $4,990/mes

TOTAL ADD-ONS: +$46,885/mes
AUMENTO EN REVENUE: +25% sobre base de $187,800/mes
```

**Escenario Optimista (50% adopción):**
```
TOTAL ADD-ONS: +$78,142/mes  
AUMENTO EN REVENUE: +42%
```

---

## 🔧 ARQUITECTURA TÉCNICA NECESARIA

### **Database Schema:**
```sql
CREATE TABLE subscription_addons (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  addon_type TEXT NOT NULL, -- 'location', 'doctor', 'integration', 'telemedicine'
  stripe_subscription_item_id TEXT UNIQUE,
  quantity INTEGER DEFAULT 1,
  price_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX idx_subscription_addons_user_id ON subscription_addons(user_id);
CREATE INDEX idx_subscription_addons_type ON subscription_addons(addon_type);
```

### **Stripe Products a Crear:**
1. "Ubicación Extra" - $499 MXN recurring
2. "Doctor Adicional" - $199 MXN recurring
3. "Integración Facturación SAT" - $399 MXN recurring
4. "Integración Laboratorios" - $299 MXN recurring
5. "Telemedicina Pack" - $499 MXN recurring

### **API Endpoints Nuevos:**
```
POST /api/addons/purchase
GET /api/addons/available
DELETE /api/addons/{id}/cancel
GET /api/quota/messaging
GET /api/quota/storage
```

---

## 📈 MÉTRICAS A TRACKEAR

1. **Adoption Rate:** % usuarios que compran add-ons
2. **ARPU con Add-ons:** Revenue promedio incluyendo add-ons
3. **Churn de Add-ons:** Cancelaciones de add-ons específicos
4. **Most Popular Add-on:** Cuál se vende más
5. **Upgrade Trigger:** ¿Add-ons llevan a upgrades de plan?

---

## ✅ SIGUIENTE PASO INMEDIATO

**Implementar ADD-ON #1: Ubicaciones Extra**

Incluye:
- ✅ Producto Stripe creado
- ✅ Schema DB extendido
- ✅ API endpoints (purchase, cancel)
- ✅ Webhook handler actualizado
- ✅ UI en `/dashboard/settings/locations`
- ✅ Límite dinámico según add-ons

**Tiempo estimado:** 4-6 horas
**Revenue potencial:** +$29,940/mes (60 usuarios x $499)

---

**¿Procedemos con la implementación de Ubicaciones Extra?**
