# 🎯 Online Booking System - Implementación Completa

## ✅ Lo que ya está implementado (Backend completo)

### 1. **Migración SQL** ✅
- **Archivo:** `supabase/migrations/20251102_online_booking_system.sql`
- **Contenido:**
  - ✅ Columnas `booking_slug` y `booking_enabled` en `user_profiles`
  - ✅ Tabla `booking_settings` (horarios, servicios, configuración)
  - ✅ Tabla `public_bookings` (reservas de pacientes)
  - ✅ Función `generate_booking_slug()` (auto-genera slugs únicos)
  - ✅ Función `is_slot_available()` (verifica disponibilidad)
  - ✅ Índices y RLS policies configuradas

### 2. **APIs Públicas** ✅
- ✅ **GET** `/api/public/clinic/[slug]` - Info de clínica y configuración
- ✅ **GET** `/api/public/availability/[slug]?date=2025-11-16` - Slots disponibles
- ✅ **POST** `/api/public/book/[slug]` - Crear reserva
- ✅ **DELETE** `/api/public/book/[slug]?token=xxx` - Cancelar reserva

### 3. **Middleware** ✅
- ✅ Rutas `/book/*` y `/api/public/*` son públicas (sin login)
- ✅ Resto de rutas protegidas con paywall existente

---

## 🚀 PRÓXIMOS PASOS (Implementación rápida)

### **PASO 1: Aplicar migración SQL** (10 min)

Ya que `npx supabase db push` falló, aplícala manualmente:

1. **Abrir Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/bpxppzgsgwjlqaykxgmb
   ```

2. **Ir a SQL Editor:**
   - Click en "SQL Editor" en sidebar izquierdo
   - Click en "+ New query"

3. **Copiar y pegar el contenido completo de:**
   ```
   vercel-migration/supabase/migrations/20251102_online_booking_system.sql
   ```

4. **Ejecutar:**
   - Click en "Run" (o Ctrl+Enter)
   - Verificar que dice "Success" al final

5. **Verificar tablas creadas:**
   - Ir a "Table Editor"
   - Deberías ver las tablas nuevas:
     - ✅ `booking_settings`
     - ✅ `public_bookings`
   - En `user_profiles` deberías ver columnas nuevas:
     - ✅ `booking_slug`
     - ✅ `booking_enabled`

---

### **PASO 2: Activar tu booking como admin** (2 min)

Ejecuta este SQL en SQL Editor:

```sql
-- Activar booking para tu usuario
UPDATE user_profiles 
SET 
  booking_enabled = true,
  booking_slug = 'dr-melgarejo' -- Cambia esto por tu slug deseado
WHERE email = 'guillermo.melgarejo.m@gmail.com';

-- Verificar
SELECT booking_slug, booking_enabled, email 
FROM user_profiles 
WHERE email = 'guillermo.melgarejo.m@gmail.com';
```

---

### **PASO 3: Crear configuración inicial de booking** (5 min)

Ejecuta este SQL para crear tu configuración de ejemplo:

```sql
-- Insertar configuración de booking para tu usuario
INSERT INTO booking_settings (
  user_id,
  available_days,
  time_ranges,
  slot_duration_minutes,
  buffer_time_minutes,
  services,
  page_title,
  welcome_message,
  show_prices,
  auto_confirm
)
SELECT 
  user_id,
  '["monday", "tuesday", "wednesday", "thursday", "friday"]'::jsonb,
  '{"monday": [{"start": "09:00", "end": "13:00"}, {"start": "15:00", "end": "19:00"}], "tuesday": [{"start": "09:00", "end": "13:00"}, {"start": "15:00", "end": "19:00"}], "wednesday": [{"start": "09:00", "end": "13:00"}, {"start": "15:00", "end": "19:00"}], "thursday": [{"start": "09:00", "end": "13:00"}, {"start": "15:00", "end": "19:00"}], "friday": [{"start": "09:00", "end": "13:00"}, {"start": "15:00", "end": "19:00"}]}'::jsonb,
  30, -- 30 minutos por slot
  5,  -- 5 minutos de buffer
  '[{"id": "1", "name": "Consulta general", "duration": 30, "price": 500}, {"id": "2", "name": "Tratamiento facial", "duration": 60, "price": 800}]'::jsonb,
  'Agendar cita',
  'Bienvenido. Selecciona el servicio y horario que prefieras.',
  true,
  false -- Requiere confirmación manual
FROM user_profiles
WHERE email = 'guillermo.melgarejo.m@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verificar
SELECT * FROM booking_settings 
WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'guillermo.melgarejo.m@gmail.com');
```

---

### **PASO 4: Deploy a Vercel** (5 min)

```powershell
cd C:\Users\gm_me\SGMM_FRESH\vercel-migration

git add .
git commit -m "feat: online booking system backend complete"
git push origin main

# Deploy
npx vercel --prod
```

---

### **PASO 5: Probar APIs** (5 min)

Una vez deployado, prueba las APIs con curl o Postman:

**1. Obtener info de clínica:**
```bash
curl https://agendamedpro.com/api/public/clinic/dr-melgarejo
```

**2. Ver disponibilidad:**
```bash
curl "https://agendamedpro.com/api/public/availability/dr-melgarejo?date=2025-11-18"
```

**3. Crear booking:**
```bash
curl -X POST https://agendamedpro.com/api/public/book/dr-melgarejo \
  -H "Content-Type: application/json" \
  -d '{
    "patient_name": "María García",
    "patient_email": "maria@example.com",
    "patient_phone": "+52 555-1234",
    "service_name": "Consulta general",
    "service_price": 500,
    "service_duration_minutes": 30,
    "booking_date": "2025-11-18",
    "booking_time": "10:00",
    "patient_notes": "Primera consulta"
  }'
```

**4. Ver bookings en tu dashboard:**
```sql
SELECT * FROM public_bookings 
WHERE clinic_user_id = (SELECT user_id FROM user_profiles WHERE email = 'guillermo.melgarejo.m@gmail.com')
ORDER BY created_at DESC;
```

---

## 📊 ESTRUCTURA ACTUAL

### Tablas nuevas:

```
booking_settings (configuración por clínica)
├── user_id (FK a auth.users)
├── available_days (JSON: ["monday", "tuesday", ...])
├── time_ranges (JSON: {"monday": [{"start": "09:00", "end": "13:00"}]})
├── slot_duration_minutes (30)
├── buffer_time_minutes (5)
├── services (JSON array de servicios)
├── page_title, welcome_message
├── auto_confirm (true/false)
└── notification settings

public_bookings (reservas de pacientes)
├── id
├── clinic_user_id (FK al médico)
├── patient_name, patient_email, patient_phone
├── service_name, service_price, service_duration_minutes
├── booking_date, booking_time
├── status (pending/confirmed/cancelled/completed/no_show)
├── confirmation_token, cancellation_token
├── locked_until (anti double-booking)
└── appointment_id (si se confirma, link a appointments table)
```

### APIs disponibles:

```
GET  /api/public/clinic/[slug]          → Info de clínica
GET  /api/public/availability/[slug]    → Slots disponibles por fecha
POST /api/public/book/[slug]            → Crear reserva
DELETE /api/public/book/[slug]?token=xxx → Cancelar reserva
```

---

## 🎨 QUÉ FALTA (Frontend)

### **TODO #6: Página pública de booking**
- `/book/[slug]/page.tsx`
- Calendario interactivo
- Selector de servicios
- Formulario de contacto
- Responsive, mobile-first
- Branding de la clínica (logo, colores)

### **TODO #8: Panel de configuración**
- `/settings/booking` en dashboard del médico
- Editar slug personalizado
- Configurar horarios disponibles
- Agregar/editar servicios
- Toggle on/off de booking público
- Preview de página pública

### **TODO #9: Vista de bookings en dashboard**
- Lista de reservas pendientes
- Botones de confirmar/rechazar
- Auto-crear appointment cuando se confirma
- Notificaciones automáticas (email/WhatsApp)

---

## 🔗 URLs de ejemplo

Una vez todo implementado:

```
TU DASHBOARD (privado):
https://agendamedpro.com/dashboard

TU PÁGINA PÚBLICA DE BOOKING:
https://agendamedpro.com/book/dr-melgarejo

COMPARTIR CON PACIENTES:
- Instagram bio link
- QR code en clínica
- Firma de email
- Tarjetas de presentación
- WhatsApp status
```

---

## ✨ Próxima sesión de código:

1. ✅ **PASO 1-5 de este documento** (aplicar migración, testear APIs)
2. 🎨 **Crear página pública de booking** con Shadcn/UI
3. ⚙️ **Panel de configuración** en `/settings/booking`
4. 📊 **Vista de bookings** en dashboard con botones de confirmar/rechazar

**¿Empezamos con PASO 1 (aplicar migración SQL)?**
