# URLs de Marketing para Equipos de Ventas

## 🎯 URLs Principales

### Tu Equipo Interno
```
https://agedamedpro.com/pricing?ref=internal
https://tuapp.com/pricing?ref=int
```

### Distribuidora Principal
```
https://tuapp.com/pricing?ref=distributor
https://tuapp.com/pricing?ref=dist
```

---

## 📍 URLs Personalizadas por Campaña (Ejemplos)

### Por Canal de Marketing

```bash
# Redes Sociales
https://tuapp.com/pricing?ref=facebook
https://tuapp.com/pricing?ref=instagram
https://tuapp.com/pricing?ref=linkedin
https://tuapp.com/pricing?ref=tiktok

# Ads Pagados
https://tuapp.com/pricing?ref=google-ads
https://tuapp.com/pricing?ref=facebook-ads
https://tuapp.com/pricing?ref=linkedin-ads

# Email Marketing
https://tuapp.com/pricing?ref=newsletter
https://tuapp.com/pricing?ref=email-promo
https://tuapp.com/pricing?ref=welcome-email

# Eventos
https://tuapp.com/pricing?ref=webinar-2025
https://tuapp.com/pricing?ref=feria-medica
https://tuapp.com/pricing?ref=congreso-medico
```

### Por Vendedor Individual

```bash
# Equipo Interno
https://tuapp.com/pricing?ref=vendedor-juan
https://tuapp.com/pricing?ref=vendedor-maria
https://tuapp.com/pricing?ref=vendedor-carlos

# Distribuidora
https://tuapp.com/pricing?ref=dist-norte
https://tuapp.com/pricing?ref=dist-sur
https://tuapp.com/pricing?ref=dist-cdmx
```

### Por Región Geográfica

```bash
https://tuapp.com/pricing?ref=cdmx
https://tuapp.com/pricing?ref=guadalajara
https://tuapp.com/pricing?ref=monterrey
https://tuapp.com/pricing?ref=puebla
```

### Por Promoción

```bash
https://tuapp.com/pricing?ref=black-friday
https://tuapp.com/pricing?ref=cyber-monday
https://tuapp.com/pricing?ref=promo-navidad
https://tuapp.com/pricing?ref=descuento-enero
```

---

## 🔗 URLs Cortas (Recomendado)

### Usando un Acortador de URLs

**Opción 1: Bitly**
```
https://tuapp.com/pricing?ref=distributor
→ https://bit.ly/sgmm-dist

https://tuapp.com/pricing?ref=internal
→ https://bit.ly/sgmm-interno
```

**Opción 2: Tu Propio Dominio Corto**
```
# Si tienes un dominio corto como "sgmm.mx"
https://sgmm.mx/dist → Redirige a https://tuapp.com/pricing?ref=distributor
https://sgmm.mx/int → Redirige a https://tuapp.com/pricing?ref=internal
```

---

## 📊 Tracking Avanzado

### Combinar Referidos con UTM Parameters

```bash
# Campaña completa con tracking
https://tuapp.com/pricing?ref=distributor&utm_source=facebook&utm_medium=cpc&utm_campaign=promo-enero

# Análisis:
# - ref=distributor → Sistema de comisiones
# - utm_source=facebook → Google Analytics (de dónde vino)
# - utm_medium=cpc → Tipo de tráfico (costo por click)
# - utm_campaign=promo-enero → Campaña específica
```

### Implementación en Código

Para capturar UTM params también, modifica `app/pricing/page.tsx`:

```typescript
useEffect(() => {
  const ref = searchParams.get('ref')
  const utmSource = searchParams.get('utm_source')
  const utmMedium = searchParams.get('utm_medium')
  const utmCampaign = searchParams.get('utm_campaign')
  
  const trackingData = {
    referralSource: ref || 'direct',
    utmSource,
    utmMedium,
    utmCampaign,
  }
  
  localStorage.setItem('tracking_data', JSON.stringify(trackingData))
  
  // Luego enviar al checkout
}, [searchParams])
```

---

## 🎨 Materiales de Marketing

### Códigos QR

**Genera códigos QR para cada equipo:**

```bash
# Para distribuidora
https://tuapp.com/pricing?ref=distributor

# Para eventos
https://tuapp.com/pricing?ref=evento-medico-2025
```

**Herramientas:**
- https://www.qr-code-generator.com/
- https://www.qrcode-monkey.com/

**Uso:**
- Imprimir en tarjetas de presentación
- Incluir en folletos
- Mostrar en presentaciones

### Emails de Referencia

**Template para distribuidora:**

```html
<!DOCTYPE html>
<html>
<body>
  <h2>¡Conoce SGMM Pro!</h2>
  <p>La plataforma #1 para consultorios médicos en México</p>
  
  <a href="https://tuapp.com/pricing?ref=distributor&utm_source=email&utm_medium=referral&utm_campaign=bienvenida">
    <button style="background: purple; color: white; padding: 15px 30px; border-radius: 8px;">
      Ver Planes y Precios
    </button>
  </a>
  
  <p><small>Enlace de referencia: DIST2025</small></p>
</body>
</html>
```

### Posts de Redes Sociales

**Facebook/Instagram:**
```
🏥 ¿Tienes un consultorio médico?

SGMM Pro te ayuda a:
✅ Gestionar citas
✅ Expedientes digitales
✅ Control de inventario
✅ Reportes automáticos

🎁 7 días de prueba GRATIS

👉 Link en bio: sgmm.mx/dist

#ConsultorioMédico #SoftwareMédico #México
```

**WhatsApp:**
```
Hola 👋

Te comparto esta plataforma increíble para consultorios médicos.

🔗 Regístrate aquí: 
https://tuapp.com/pricing?ref=whatsapp-juanperez

💰 Plan Pro: $999/mes
🎁 7 días gratis para probar

¿Te interesa? Responde este mensaje con "SÍ"
```

---

## 📱 Links para WhatsApp Business

### Link Directo con Mensaje Pre-llenado

```
https://wa.me/5215512345678?text=Hola%2C%20quiero%20información%20sobre%20SGMM%20Pro.%20Vi%20su%20enlace%3A%20sgmm.mx%2Fdist
```

**Desglose:**
- `5215512345678` → Tu número de WhatsApp
- `text=` → Mensaje prellenado (URL encoded)

### Landing Page → WhatsApp → Pricing

```typescript
// app/landing-distributor/page.tsx

export default function DistributorLandingPage() {
  return (
    <div>
      <h1>SGMM Pro - Solución para Consultorios</h1>
      
      {/* Botón directo a pricing */}
      <a href="/pricing?ref=distributor">
        <button>Ver Planes</button>
      </a>
      
      {/* Botón para contactar por WhatsApp */}
      <a href="https://wa.me/5215512345678?text=Quiero%20información">
        <button>Contactar por WhatsApp</button>
      </a>
    </div>
  )
}
```

---

## 🎯 Estrategias de Distribución

### Para Tu Equipo Interno

**1. Website Principal**
```html
<!-- Botón en homepage -->
<a href="/pricing?ref=internal">Comenzar Ahora</a>

<!-- Botón en navbar -->
<a href="/pricing?ref=internal">Precios</a>
```

**2. Blog Posts**
```markdown
[Conoce nuestros planes](/pricing?ref=blog)
```

**3. Email Signatures**
```
---
Juan Pérez
Sales Manager
SGMM Pro
📧 juan@sgmm.com
🔗 Ver planes: sgmm.mx/int
```

### Para Distribuidora

**1. Landing Page Dedicada**
```
https://distribuidor.com → Redirige a tuapp.com/pricing?ref=dist
```

**2. Material Impreso**
```
Tarjetas de presentación:
┌─────────────────────┐
│ SGMM Pro            │
│ Distribuidor Oficial│
│                     │
│ [QR CODE]           │
│ sgmm.mx/dist        │
└─────────────────────┘
```

**3. Presentaciones de Venta**
```
Última diapositiva:
"¿Listo para empezar?"
[QR CODE]
https://tuapp.com/pricing?ref=distributor
```

---

## 📊 Reportes por Campaña

### Query SQL para Analizar Campañas

```sql
-- Ver rendimiento por referral source
SELECT 
  referral_source,
  COUNT(*) as total_conversions,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
  AVG(CASE 
    WHEN plan_tier = 'basico' THEN 599
    WHEN plan_tier = 'pro' THEN 999
    WHEN plan_tier = 'enterprise' THEN 2999
    ELSE 0
  END) as avg_revenue
FROM subscriptions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY referral_source
ORDER BY total_conversions DESC;
```

### Dashboard de Campañas

```typescript
// app/admin/campaigns/page.tsx

export default async function CampaignsPage() {
  const { data: campaigns } = await supabase
    .from('subscriptions')
    .select('referral_source, COUNT(*) as conversions')
    .gte('created_at', thirtyDaysAgo)
    .groupBy('referral_source')
  
  return (
    <div>
      <h1>Rendimiento de Campañas</h1>
      {campaigns.map(c => (
        <div key={c.referral_source}>
          <h3>{c.referral_source}</h3>
          <p>{c.conversions} conversiones</p>
        </div>
      ))}
    </div>
  )
}
```

---

## 🔒 Seguridad y Validación

### URLs Válidas vs Inválidas

**✅ Válidas:**
```
/pricing?ref=distributor
/pricing?ref=internal
/pricing?ref=cualquier-codigo-personalizado
/pricing  (sin ref, asume 'internal')
```

**❌ El sistema ignora intentos de manipulación:**
```
/pricing?ref=javascript:alert(1)  → Se sanitiza
/pricing?ref=<script>  → Se sanitiza
/pricing?ref=../../etc/passwd  → Se sanitiza
```

**Validación en el código:**
```typescript
// app/pricing/page.tsx
const ref = searchParams.get('ref')
const sanitized = ref?.replace(/[^a-zA-Z0-9-_]/g, '') || 'internal'
```

---

## 💡 Best Practices

1. **Usa códigos cortos y memorables:**
   - ✅ `ref=dist`
   - ❌ `ref=distribuidor-zona-norte-mexico-2025`

2. **Documenta tus códigos:**
   - Mantén una lista de códigos activos
   - Registra para qué sirve cada uno

3. **Monitorea regularmente:**
   - Revisa qué códigos convierten más
   - Elimina códigos que no funcionan

4. **Combina con analytics:**
   - Google Analytics
   - Facebook Pixel
   - LinkedIn Insight Tag

5. **Testea antes de distribuir:**
   - Verifica que el código se capture correctamente
   - Confirma que se guarde en la base de datos

---

## 📞 Soporte

Para agregar nuevos códigos de referencia o modificar existentes, contacta al equipo de desarrollo.

**No requiere cambios en código** - Solo agrega nuevos valores al parámetro `ref` en tus URLs.
