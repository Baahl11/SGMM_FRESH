# 🔧 Fix: Tarjetas de Crédito Rechazadas en Stripe

## ❌ Problema Detectado

Cliente intentó pagar con American Express (tarjeta de crédito) pero Stripe la rechazó con el mensaje:
> "Se rechazó tu tarjeta de crédito. Intenta pagar con una tarjeta de débito."

---

## ✅ Soluciones Implementadas

### 1. **Código Actualizado** (Listo)

#### Archivos modificados:

**a) `/app/api/create-trial-session/route.ts`**
```typescript
payment_method_types: ['card'], // Acepta TODAS las tarjetas
payment_method_options: {
  card: {
    request_three_d_secure: 'automatic', // 3D Secure automático
  },
},
billing_address_collection: 'auto', // Dirección de facturación
```

**b) `/app/api/create-checkout-session/route.ts`**
```typescript
// Mismas configuraciones aplicadas
```

---

## 🔍 Verificaciones OBLIGATORIAS en Stripe Dashboard

Necesitas revisar tu cuenta de Stripe para asegurarte de que todo esté habilitado correctamente:

### **1. Verificar Métodos de Pago Habilitados**

📍 **Ve a:** https://dashboard.stripe.com/settings/payment_methods

✅ **Debe estar activado:**
- ✓ Cards (Tarjetas)
  - ✓ Visa
  - ✓ Mastercard
  - ✓ American Express ← **¡IMPORTANTE!**
  - ✓ Discover
  - ✓ Diners Club
  - ✓ JCB

❗ **Si American Express está desactivado:**
- Clic en "Add payment method"
- Busca "American Express"
- Actívalo

---

### **2. Verificar País de Tu Cuenta**

📍 **Ve a:** https://dashboard.stripe.com/settings/account

✅ **Debe mostrar:**
- **País:** México (o el país correcto)
- **Moneda:** MXN (Pesos Mexicanos)

❌ **Problema común:**
Si la cuenta está en modo USA pero intentas cobrar en MXN, algunas tarjetas se rechazan.

---

### **3. Verificar Estado de la Cuenta**

📍 **Ve a:** https://dashboard.stripe.com/settings/account

✅ **Debe mostrar:**
- ✓ Account activated (Cuenta activada)
- ✓ Payouts enabled (Pagos habilitados)

⚠️ **Si está en modo Test:**
- Solo acepta tarjetas de prueba
- Debes activar el modo Live (Producción)

---

### **4. Verificar Configuración de Riesgo/Fraude**

📍 **Ve a:** https://dashboard.stripe.com/settings/radar/rules

⚠️ **Revisar:**
- Reglas de Radar que puedan estar bloqueando tarjetas extranjeras
- Reglas que requieran CVC/CVV
- Reglas de geolocalización

💡 **Recomendación:**
Desactiva temporalmente reglas muy restrictivas para probar.

---

### **5. Verificar Límites de Transacción**

📍 **Ve a:** https://dashboard.stripe.com/settings/billing/automatic

✅ **Asegúrate:**
- No hay límite de monto que bloquee suscripciones
- No hay restricciones por país del cliente

---

## 🧪 Cómo Probar el Fix

### **Opción A: Tarjetas de Prueba (Modo Test)**

Usa estas tarjetas en **modo test** de Stripe:

**Tarjetas de CRÉDITO que deben funcionar:**
```
Visa:               4242 4242 4242 4242
Mastercard:         5555 5555 5555 4444
American Express:   3782 822463 10005
```

**Datos adicionales:**
- Fecha expiración: Cualquier fecha futura (ej. 12/26)
- CVC: Cualquier 3 dígitos (ej. 123)
- Código postal: Cualquiera (ej. 12345)

---

### **Opción B: Tarjeta Real (Modo Live)**

1. Usa una tarjeta de crédito real tuya
2. Intenta crear una suscripción
3. Debe aceptar tarjetas de:
   - Crédito ✓
   - Débito ✓

---

## 🐛 Si El Problema Persiste

### **Causa 1: American Express no habilitado**
**Solución:**
```
Dashboard → Settings → Payment methods → Enable American Express
```

### **Causa 2: Cuenta en modo restringido**
**Solución:**
- Completa la verificación de identidad
- Activa payouts
- Sube documentación legal

### **Causa 3: Reglas de Radar muy estrictas**
**Solución:**
```
Dashboard → Radar → Rules → 
Desactiva: "Block if CVC fails" (temporalmente)
Desactiva: "Block if postal code fails" (temporalmente)
```

### **Causa 4: Problema con el banco emisor**
**Solución:**
- Pide al cliente que llame a su banco
- Autorizar transacciones internacionales
- Verificar que la tarjeta no tenga límite de compras en línea

---

## 📊 Monitorear Pagos Rechazados

📍 **Ve a:** https://dashboard.stripe.com/payments?status=failed

Aquí puedes ver:
- Razón exacta del rechazo
- Código de error del banco
- Recomendaciones de Stripe

**Códigos comunes de rechazo:**
- `card_declined` - Banco rechazó (fondos insuficientes, límite excedido)
- `insufficient_funds` - Sin fondos
- `lost_card` - Tarjeta reportada como perdida
- `restricted_card` - Tarjeta no puede hacer este tipo de transacción
- `processing_error` - Error temporal del procesador

---

## ✅ Checklist de Deployment

Antes de desplegar:

- [x] Código actualizado en `create-trial-session/route.ts`
- [x] Código actualizado en `create-checkout-session/route.ts`
- [ ] Verificar American Express habilitado en Stripe Dashboard
- [ ] Verificar cuenta en modo Live (no Test)
- [ ] Verificar país/moneda correctos
- [ ] Probar con tarjeta de prueba
- [ ] Probar con tarjeta real
- [ ] Build exitoso
- [ ] Deploy a producción

---

## 🚀 Comandos para Deploy

```powershell
# 1. Build
npm run build

# 2. Deploy a producción
npx vercel --prod
```

---

## 📞 Soporte Stripe

Si nada funciona, contacta a Stripe:

📧 Email: support@stripe.com
💬 Chat: https://dashboard.stripe.com/support
📞 Teléfono: Disponible en el dashboard

**Información a proporcionar:**
- Payment Intent ID del pago rechazado
- Mensaje de error exacto
- País de tu cuenta
- País del cliente
- Tipo de tarjeta (Visa, Mastercard, Amex)

---

## 📝 Notas Importantes

### **¿Por qué decía "usa tarjeta de débito"?**

El mensaje era engañoso. La verdadera causa pudo ser:

1. **American Express deshabilitado** (más probable)
2. **Reglas de Radar bloqueando la transacción**
3. **Cuenta en modo Test sin tarjeta de prueba válida**
4. **El banco emisor rechazó la transacción**

### **Diferencia entre mode: 'test' y 'live'**

- **Test:** Solo acepta tarjetas de prueba de Stripe
- **Live:** Acepta tarjetas reales de clientes

Verifica que tu `STRIPE_SECRET_KEY` en `.env.local` sea la clave **LIVE** (empieza con `sk_live_...`) y no la clave **TEST** (`sk_test_...`).

---

## ✨ Resultado Esperado

Después del fix:

✅ Tarjetas de crédito aceptadas (Visa, MC, Amex, etc.)
✅ Tarjetas de débito aceptadas
✅ 3D Secure automático cuando sea necesario
✅ Dirección de facturación recopilada correctamente
✅ Menos rechazos por configuración

---

**Actualizado:** 6 de noviembre, 2025
**Estado:** ✅ Código listo para deploy - Pendiente verificación en Stripe Dashboard
