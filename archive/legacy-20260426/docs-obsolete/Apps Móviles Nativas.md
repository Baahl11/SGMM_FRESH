# Apps Móviles Nativas AgendaMedPro (iOS/Android)

**Fecha de creación:** 15 de noviembre, 2025  
**Estado:** Planificación - Pospuesto hasta SaaS al 100%  
**Objetivo:** Desarrollar apps nativas iOS y Android usando React Native + Expo, alcanzando paridad de features con el PWA y agregando capacidades nativas críticas.

---

## **Contexto Ejecutivo**

**Por qué apps nativas:**
- 60%+ del mercado médico es móvil-first
- Competidores (Vagaro 3,450 reviews, Jane 4.8★) tienen apps nativas como feature principal
- PWA actual **NO está implementado** (sin manifest.json, service worker)
- Push notifications iOS requieren app nativa (PWA no soporta Web Push API)
- Presencia en App Store/Google Play = marketing + confianza
- Offline-first robusto (PWA limitado a ~50MB cache)
- Biometric auth (Touch ID/Face ID)
- Mejor performance (60fps nativo vs JavaScript bridge)

**Diferenciación vs Competidores:**
1. **BYOK WhatsApp** (ningún competidor ofrece)
2. **NOM-004 compliance** (requerido en México)
3. **Inventory auto-consumption** (feature único)
4. **Offline-first móvil** (mayoría son web-only)

---

## **Arquitectura Técnica**

### **Sistema Actual en Producción**

**Stack Web:**
- Next.js 15.3.3 + React 19.1.0 en Vercel (agendamedpro.com)
- Supabase PostgreSQL con RLS (39 migraciones aplicadas)
- Supabase Auth (JWT tokens, OAuth Google/GitHub)
- Stripe Live Mode ($599/$999 MXN mensual, trial 7 días)
- Twilio WhatsApp Business API (BYOK model)
- Supabase Storage (fotos pacientes, PDFs)

**Módulos Funcionales (21):**
- Agenda (4 vistas: día/semana/mes/lista)
- Pacientes (CRUD + fotos + historia médica)
- Tratamientos (catálogo + pricing)
- Inventario (stock + consumo automático)
- Expedientes NOM-004 compliant
- Reportes Financieros (ingresos, gastos, comisiones)
- WhatsApp messaging (templates, envío automático)
- Formularios Intake (públicos + privados)
- Multi-doctor (hasta 10 doctores)
- Team Members (permisos granulares)
- Bundles & Promociones

### **Base de Datos (39+ tablas principales)**

```sql
-- Core
patients (id, user_id, nombre, apellido, telefono, email, fecha_nacimiento)
appointments (id, user_id, patient_id, doctor_id, consultorio_id, fecha_hora, duracion_minutos, estado)
treatments (id, user_id, nombre, precio_base, costo_unitario, category, tags)
subscriptions (id, user_id, plan_tier, status, stripe_subscription_id, max_doctors, max_locations)

-- Clinical
medical_records (diagnosis, treatment_plan, notes) -- NOM-004 compliant
medical_history (antecedentes, alergias, medicamentos)
patient_notes (5 tipos: pendiente/idea/importante/general/completada)

-- Financial
records (patient_id, treatment_id, monto_pagado, monto_neto, ganancia, comision)
gastos_fijos, gastos_variables, bundles, promotions, invoices

-- Inventory
inventory_items (stock_actual, stock_minimo, precio_unitario)
inventory_movements (tipo: entrada/salida/ajuste)
treatment_inventory_items (consumo automático por tratamiento)

-- Multi-doctor
doctors (user_id, nombre, especialidad, color)
consultorios (user_id, nombre, ubicacion, capacidad)
doctor_schedules, doctor_exceptions

-- Messaging
messaging_config (whatsapp_credentials JSONB, templates)
whatsapp_messages (appointment_id, status, sent_at)

-- Forms
intake_forms (fields JSONB, is_active)
form_submissions (responses JSONB, status)
```

### **APIs Disponibles (161+ endpoints)**

Todos usan `Authorization: Bearer {jwt}` + RLS automático:

```
/api/patients           GET/POST/PUT/DELETE
/api/appointments       GET/POST/PUT/DELETE
/api/treatments         GET/POST/PUT/DELETE + /inventory
/api/inventory          GET/POST/PUT + /movements + /low-stock
/api/medical-records    GET/POST/PUT
/api/medical-history    GET/POST
/api/messaging/config   GET/PUT
/api/messaging/send     POST (WhatsApp/SMS)
/api/forms              GET/POST/PUT + /send + /submissions
/api/team/members       GET/POST/PUT/DELETE
/api/analytics          GET (dashboard metrics)
/api/records/with-names GET (billing reports)
/api/public/clinic/[slug] GET (booking público)
```

### **Subscription Tiers & Features**

```typescript
basico: {
  price: $599/mes,
  max_doctors: 2,
  max_locations: 1,
  features: ['agenda_4_views', 'patients_basic', 'treatments', 
             'appointments', 'basic_reports', 'email_notifications']
}

pro: {
  price: $999/mes,
  max_doctors: 10,
  max_locations: 5,
  features: ['all_basico', 'inventory', 'expenses', 'bundles',
             'commissions', 'whatsapp', 'advanced_reports', 'tags']
}

enterprise: {
  price: $19,990 lifetime,
  max_doctors: 999,
  max_locations: 999,
  features: ['all', 'multi_location', 'api_access', 'white_label']
}
```

**Trial:** 7 días automático en signup (OAuth callback), status `trialing`, auto-cobra Stripe al día 8.

---

## **Estrategia de Desarrollo**

### **Monorepo Structure**

```
agendamedpro/
  apps/
    web/                # Next.js 15 (EXISTENTE - producción)
    mobile-cliente/     # React Native + Expo (NUEVA - clientes)
    mobile-doctor/      # Expo app doctores (NUEVA - opcional Fase 4)
  
  packages/
    shared/
      types/            # Patient, Appointment, Treatment interfaces
      utils/            # Date formatting, validation functions
      api/              # Supabase client + React Query hooks
      ui/               # Componentes cross-platform (Button, Input, Card)
      config/           # Constants (colors, plan limits, API URLs)
```

**Compartir código entre web y mobile:**

```typescript
// packages/shared/types/patient.ts
export interface Patient {
  id: string
  user_id: string
  nombre: string
  apellido: string
  telefono: string | null
  email: string | null
  fecha_nacimiento: string | null
  created_at: string
}

// packages/shared/api/usePatients.ts
export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data } = await supabase.from('patients').select('*')
      return data as Patient[]
    }
  })
}

// Uso en web (Next.js)
import { usePatients } from '@agendamedpro/api'

// Uso en mobile (React Native)
import { usePatients } from '@agendamedpro/api' // ← MISMO CÓDIGO
```

### **Stack Tecnológico Mobile**

```json
{
  "core": {
    "expo": "^52.0.0",
    "react": "19.1.0",
    "react-native": "0.76.0",
    "typescript": "5.3.2"
  },
  "navigation": {
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/stack": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0"
  },
  "data": {
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-query-persist-client": "^5.0.0",
    "zustand": "^4.4.0"
  },
  "forms": {
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.0"
  },
  "ui": {
    "react-native-paper": "^5.11.0",
    "react-native-toast-message": "^2.2.0",
    "@react-native-community/datetimepicker": "^7.6.0",
    "react-native-calendars": "^1.1304.0"
  },
  "native": {
    "expo-notifications": "~0.28.0",
    "expo-local-authentication": "~14.0.0",
    "expo-secure-store": "~13.0.0",
    "expo-image-picker": "~15.0.0",
    "@react-native-google-signin/google-signin": "^11.0.0"
  },
  "offline": {
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-native-community/netinfo": "^11.2.0"
  },
  "monitoring": {
    "@sentry/react-native": "^5.15.0"
  }
}
```

---

## **ROADMAP DETALLADO**

### **FASE 1: FUNDACIÓN (4 semanas) - App Cliente**

**Objetivo:** Estructura base + autenticación + navegación + offline básico

#### **Semana 1: Setup Proyecto**

1. **Crear monorepo**
   ```bash
   npx create-turbo@latest agendamedpro
   cd agendamedpro
   npx create-expo-app apps/mobile-cliente -t expo-template-blank-typescript
   ```

2. **Configurar EAS (Expo Application Services)**
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

3. **Instalar dependencias core**
   ```bash
   cd apps/mobile-cliente
   npx expo install @supabase/supabase-js
   npx expo install @tanstack/react-query
   npx expo install @react-navigation/native @react-navigation/stack
   npx expo install react-hook-form @hookform/resolvers zod
   npx expo install date-fns
   ```

4. **Configurar Supabase SDK**
   ```typescript
   // lib/supabase/client.ts
   import { createClient } from '@supabase/supabase-js'
   import * as SecureStore from 'expo-secure-store'
   
   const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
   const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
   
   export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
     auth: {
       storage: {
         getItem: (key) => SecureStore.getItemAsync(key),
         setItem: (key, value) => SecureStore.setItemAsync(key, value),
         removeItem: (key) => SecureStore.deleteItemAsync(key),
       },
     },
   })
   ```

5. **Setup navegación**
   - Auth Stack: Login, Signup, ForgotPassword
   - Main Tab Navigator: Agenda, Pacientes, Más
   - Settings Stack: Profile, Team, WhatsApp, Subscription

#### **Semana 2: Autenticación**

1. **Login Screen**
   ```tsx
   // screens/auth/LoginScreen.tsx
   - Email/password form (react-hook-form + zod)
   - Botón "Continuar con Google"
   - Botón "Continuar con GitHub"
   - Link "¿Olvidaste tu contraseña?"
   - Link "Crear cuenta"
   ```

2. **OAuth Integration**
   - Google Sign In: `@react-native-google-signin/google-signin`
   - GitHub OAuth: Web browser flow con deep linking
   - Deep link config: `agendamedpro://auth/callback`

3. **Biometric Auth**
   ```typescript
   import * as LocalAuthentication from 'expo-local-authentication'
   
   const authenticateWithBiometrics = async () => {
     const result = await LocalAuthentication.authenticateAsync({
       promptMessage: 'Inicia sesión con biometría',
       fallbackLabel: 'Usar contraseña',
     })
     return result.success
   }
   ```

4. **Token Management**
   - `expo-secure-store` para JWT storage
   - Auto-refresh tokens (Supabase SDK automático)
   - Logout: Clear tokens + navigate to Login

#### **Semana 3: Data Layer + Offline**

1. **React Query Setup**
   ```typescript
   // lib/api/queryClient.ts
   import { QueryClient } from '@tanstack/react-query'
   import { createAsyncStoragePersister } from '@tanstack/react-query-persist-client'
   import AsyncStorage from '@react-native-async-storage/async-storage'
   
   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 minutos
         cacheTime: 30 * 60 * 1000, // 30 minutos
         retry: 3,
       },
     },
   })
   
   export const persister = createAsyncStoragePersister({
     storage: AsyncStorage,
   })
   ```

2. **API Hooks**
   ```typescript
   // hooks/usePatients.ts
   export function usePatients() {
     return useQuery({
       queryKey: ['patients'],
       queryFn: async () => {
         const { data, error } = await supabase
           .from('patients')
           .select('*')
           .order('apellido')
         
         if (error) throw error
         return data
       },
     })
   }
   
   export function useCreatePatient() {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: async (patient: Omit<Patient, 'id' | 'created_at'>) => {
         const { data, error } = await supabase
           .from('patients')
           .insert([patient])
           .select()
           .single()
         
         if (error) throw error
         return data
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['patients'] })
       },
     })
   }
   ```

3. **Offline Detection**
   ```typescript
   import NetInfo from '@react-native-community/netinfo'
   
   export function useNetworkStatus() {
     const [isOnline, setIsOnline] = useState(true)
     
     useEffect(() => {
       const unsubscribe = NetInfo.addEventListener(state => {
         setIsOnline(state.isConnected ?? false)
       })
       return unsubscribe
     }, [])
     
     return isOnline
   }
   ```

4. **Error Handling**
   - Global error boundary: `components/ErrorBoundary.tsx`
   - Toast notifications: `react-native-toast-message`
   - Retry buttons en pantallas de error

#### **Semana 4: UI Components Base**

1. **Design System**
   ```typescript
   // theme.ts
   export const theme = {
     colors: {
       primary: '#0066CC',
       secondary: '#00CC66',
       error: '#FF3B30',
       warning: '#FF9500',
       background: '#F5F5F5',
       surface: '#FFFFFF',
       text: '#000000',
       textSecondary: '#8E8E93',
     },
     spacing: {
       xs: 4,
       sm: 8,
       md: 16,
       lg: 24,
       xl: 32,
     },
     typography: {
       h1: { fontSize: 32, fontWeight: 'bold' },
       h2: { fontSize: 24, fontWeight: '600' },
       h3: { fontSize: 18, fontWeight: '600' },
       body: { fontSize: 16, fontWeight: '400' },
       caption: { fontSize: 14, fontWeight: '400' },
     },
   }
   ```

2. **Componentes Reutilizables**
   - `components/ui/Button.tsx`: Variants (primary, secondary, ghost)
   - `components/ui/Input.tsx`: Form inputs con validation
   - `components/ui/Card.tsx`: Patient/appointment cards
   - `components/ui/Avatar.tsx`: Initials + optional photo
   - `components/ui/Badge.tsx`: Status badges (programada, confirmada, etc.)
   - `components/ui/Skeleton.tsx`: Content placeholders
   - `components/ui/LoadingSpinner.tsx`: Full-screen loading

**Entregables Semana 4:**
- ✅ App installable en iOS/Android (Expo Go)
- ✅ Login funcional (email + Google OAuth + biometría)
- ✅ Navegación completa (Auth Stack ↔ Main Tabs)
- ✅ Offline caching básico (React Query persistence)
- ✅ 10+ componentes UI reutilizables

---

### **FASE 2: FEATURES CORE (6 semanas)**

**Objetivo:** Agenda, Pacientes, Citas - funcionalidad completa

#### **Semana 5-6: Calendario & Citas**

1. **Calendar Component**
   - `react-native-calendars` para vista mensual
   - Custom day cell: Badge con # de citas
   - **4 vistas:** Día, Semana, Mes, Lista

2. **Vista Día**
   - Timeline vertical (8 AM - 8 PM, configurable)
   - Citas como bloques de tiempo (altura = duración)
   - Color-coded por doctor (`doctors.color` de DB)
   - Tap → ver detalles, Long-press → editar

3. **Vista Semana**
   - Horizontal scroll (7 días)
   - Mini timeline por día
   - Optimizado con `@shopify/flash-list`

4. **Vista Mes**
   - Calendario completo
   - Dots para días con citas (color = doctor)
   - Tap día → muestra lista de citas

5. **Vista Lista**
   - Infinite scroll con paginación
   - Agrupado por día (headers sticky)
   - Filtros: Doctor, Estado, Rango fechas

6. **Appointment Details Screen**
   ```tsx
   <Screen>
     <PatientCard 
       name={patient.nombre}
       phone={patient.telefono}
       onWhatsApp={() => sendWhatsApp(patient.telefono)}
     />
     
     <TreatmentCard
       name={treatment.nombre}
       price={treatment.precio_base}
       duration={appointment.duracion_minutos}
     />
     
     <DoctorCard
       name={doctor.nombre}
       specialty={doctor.especialidad}
     />
     
     <StatusBadge status={appointment.estado} />
     
     <ActionButtons>
       <Button onPress={handleEdit}>Editar</Button>
       <Button onPress={handleCancel}>Cancelar</Button>
       <Button onPress={handleComplete}>Completar</Button>
     </ActionButtons>
   </Screen>
   ```

7. **Create/Edit Appointment**
   - Patient picker (autocomplete con búsqueda)
   - Treatment picker (category tabs)
   - Doctor picker (si multi-doctor activo)
   - Date/Time picker: `@react-native-community/datetimepicker`
   - **Validación:** Conflictos de horario (check backend API)

#### **Semana 7-8: Pacientes**

1. **Patient List Screen**
   - FlashList con virtualization
   - Search bar: Nombre/apellido/teléfono
   - Alfabético sections (A, B, C... headers)
   - Pull-to-refresh
   - FloatingActionButton: "Agregar Paciente"

2. **Patient Details Screen**
   ```tsx
   <Header>
     <Avatar photo={patient.photo_url} />
     <Name>{patient.nombre} {patient.apellido}</Name>
     <Age>{calculateAge(patient.fecha_nacimiento)} años</Age>
   </Header>
   
   <Tabs>
     <Tab name="Info">
       <ContactInfo
         phone={patient.telefono}
         email={patient.email}
         address={patient.direccion}
       />
     </Tab>
     
     <Tab name="Historia">
       <MedicalHistory
         allergies={history.alergias}
         medications={history.medicamentos}
         conditions={history.antecedentes}
       />
     </Tab>
     
     <Tab name="Citas">
       <AppointmentHistory
         past={pastAppointments}
         upcoming={upcomingAppointments}
       />
     </Tab>
     
     <Tab name="Notas">
       <PatientNotes notes={notes} />
     </Tab>
   </Tabs>
   ```

3. **Create/Edit Patient**
   - Form: Nombre, apellido, teléfono, email, fecha_nacimiento, dirección
   - Photo picker: `expo-image-picker` (camera o galería)
   - Upload a Supabase Storage: `patient-photos/{user_id}/{patient_id}/profile.jpg`
   - Validaciones:
     - Teléfono formato MX (+52 10 dígitos)
     - Email RFC 5322
     - Fecha nacimiento (no futuro)

4. **Medical History**
   - Secciones expandibles (Accordion)
   - Antecedentes personales/familiares
   - Alergias (lista editable, agregar/eliminar)
   - Medicamentos actuales
   - Problemas médicos crónicos
   - **NOM-004 compliance:** Timestamp automático en cambios

5. **Patient Notes**
   - 5 tipos con iconos:
     - Pendiente 🔴
     - Idea 💡
     - Importante ⭐
     - General 📝
     - Completada ✅
   - Lista cronológica (más reciente primero)
   - Swipe-to-delete
   - Rich text básico: `@10play/tentap-editor`

#### **Semana 9-10: Tratamientos & Inventario**

1. **Treatment List Screen**
   - Category tabs horizontales (scrollable)
   - Grid view (2 columnas)
   - Card: Nombre, precio, duración
   - Tag chips (ej: "Facial", "Botox")
   - Search + filter por categoría

2. **Treatment Details**
   - Precio base, costo unitario, ganancia estimada
   - Descripción completa
   - **Consumables vinculados:** Lista inventory items
   - Botón: "Usar en cita" → Abre appointment form pre-filled

3. **Inventory Screen**
   - List view: Item, stock actual, stock mínimo
   - **Color indicators:**
     - Verde (stock > mínimo)
     - Amarillo (stock = mínimo)
     - Rojo (stock < mínimo)
   - Badge "Bajo" si stock actual < stock mínimo
   - Tap item → Ver movimientos

4. **Inventory Movements**
   - History timeline
   - Tipos con iconos:
     - Entrada 🔵
     - Salida 🔴
     - Ajuste 🟡
   - Mostrar: Cantidad, motivo, fecha, usuario

5. **Low Stock Alerts**
   - Screen dedicada (acceso desde Inventory)
   - Lista items con `stock_actual < stock_minimo`
   - Badge con cantidad faltante
   - Botón rápido: "Registrar entrada"

6. **Create Movement**
   - Selector tipo: Entrada/Salida/Ajuste
   - Quantity input (numeric keyboard)
   - Motivo (text input)
   - Submit → actualiza `inventory_items.stock_actual` vía API

**Entregables Semana 10:**
- ✅ Agenda funcional (4 vistas) con multi-doctor color coding
- ✅ Gestión completa de pacientes (CRUD + fotos + historia)
- ✅ Tratamientos + inventario con alertas de stock bajo
- ✅ Citas completas (crear, editar, cambiar estado)
- ✅ **Offline-first:** Todas las pantallas funcionan sin internet (datos cacheados)

#### **Semana 11-12: Mensajería & Reportes**

1. **WhatsApp Config Screen**
   - Form: Twilio Account SID, Auth Token, Phone Number
   - Test button: Envía mensaje de prueba
   - Status indicator: ✅ Conectado / ❌ Error
   - Templates: Lista editable (4 default)

2. **Send Message Screen**
   - Patient picker (autocomplete)
   - Template picker (dropdown)
   - Preview con variables reemplazadas:
     ```
     Hola {{nombre}}, tu cita es el {{fecha}} a las {{hora}}.
     →
     Hola Juan, tu cita es el 20 Nov a las 10:00 AM.
     ```
   - Botón: "Enviar por WhatsApp"
   - Confirmation: "Mensaje enviado ✓"

3. **Message History**
   - Lista mensajes recientes (últimos 30 días)
   - Agrupado por paciente
   - Status: Sent, Delivered, Read, Failed
   - Retry button si Failed

4. **Dashboard Screen**
   - Widgets con `react-native-chart-kit`:
     - Ingresos del mes (line chart)
     - Citas por doctor (bar chart)
     - Top 5 tratamientos (pie chart)
   - Pull-to-refresh
   - Filtro por rango de fechas

5. **Financial Reports**
   - Filtros: Rango de fechas, doctor
   - Métricas:
     - Ingresos brutos
     - Costos
     - Ganancia neta
     - Comisiones
   - **Export CSV:** `expo-sharing` para compartir archivo

6. **Notification Logs**
   - Lista mensajes/emails enviados
   - Filtros: Canal (WhatsApp/Email), Estado
   - Tap para ver detalles (recipient, body, timestamp)

---

### **FASE 3: CARACTERÍSTICAS NATIVAS (4 semanas)**

**Objetivo:** Push notifications, deep linking, advanced native features

#### **Semana 13-14: Push Notifications**

1. **Firebase Setup**
   ```bash
   # Crear proyecto Firebase en console.firebase.google.com
   # Agregar apps iOS + Android
   # Descargar google-services.json (Android)
   # Descargar GoogleService-Info.plist (iOS)
   ```

   ```json
   // app.json
   {
     "expo": {
       "android": {
         "googleServicesFile": "./google-services.json"
       },
       "ios": {
         "googleServicesFile": "./GoogleService-Info.plist"
       },
       "plugins": [
         ["expo-notifications", {
           "icon": "./assets/notification-icon.png",
           "color": "#0066CC"
         }]
       ]
     }
   }
   ```

2. **Expo Notifications Setup**
   ```typescript
   import * as Notifications from 'expo-notifications'
   
   // Request permissions
   const { status } = await Notifications.requestPermissionsAsync()
   
   // Get device token
   const token = await Notifications.getExpoPushTokenAsync({
     projectId: 'your-expo-project-id'
   })
   
   // Store token en DB
   await supabase.from('device_tokens').insert({
     user_id: userId,
     token: token.data,
     platform: Platform.OS,
     is_active: true
   })
   ```

3. **Backend Integration**
   - Nueva tabla: `device_tokens (id, user_id, token, platform, is_active, created_at)`
   - API endpoint: `POST /api/device-tokens` (register/update)
   - **Webhook triggers:**
     - Nueva cita → Push a doctor asignado
     - Recordatorio 24h antes de cita
     - Recordatorio 2h antes de cita
     - Recordatorio 1h antes de cita
     - Cita cancelada
     - Stock bajo (inventory alert)

4. **Handle Notifications**
   ```typescript
   // Foreground
   Notifications.setNotificationHandler({
     handleNotification: async () => ({
       shouldShowAlert: true,
       shouldPlaySound: true,
       shouldSetBadge: true,
     }),
   })
   
   // Background/Tap
   Notifications.addNotificationResponseReceivedListener(response => {
     const data = response.notification.request.content.data
     
     if (data.type === 'appointment') {
       navigation.navigate('AppointmentDetails', { id: data.id })
     } else if (data.type === 'low_stock') {
       navigation.navigate('Inventory')
     }
   })
   ```

5. **Notification Preferences**
   - Settings screen: Toggles por tipo
     - ✅ Recordatorios de citas
     - ✅ Nuevas citas asignadas
     - ✅ Alertas de inventario
     - ✅ Mensajes de pacientes
   - DB: `notification_preferences (user_id, type, enabled)`
   - Backend respeta preferencias antes de enviar

#### **Semana 15-16: Deep Linking & Advanced Features**

1. **Deep Linking Setup**
   ```json
   // app.json
   {
     "expo": {
       "scheme": "agendamedpro",
       "ios": {
         "associatedDomains": ["applinks:agendamedpro.com"]
       },
       "android": {
         "intentFilters": [
           {
             "action": "VIEW",
             "data": [
               { "scheme": "https", "host": "agendamedpro.com", "pathPrefix": "/app" }
             ],
             "category": ["BROWSABLE", "DEFAULT"]
           }
         ]
       }
     }
   }
   ```

2. **Link Handlers**
   ```typescript
   const linking = {
     prefixes: ['agendamedpro://', 'https://agendamedpro.com/app'],
     config: {
       screens: {
         PatientDetails: 'patient/:id',
         AppointmentDetails: 'appointment/:id',
         PublicForm: 'form/:token',
         Checkout: 'checkout',
       },
     },
   }
   
   // Uso:
   // agendamedpro://patient/123 → PatientDetailsScreen(id: 123)
   // https://agendamedpro.com/app/appointment/456 → AppointmentDetailsScreen(id: 456)
   ```

3. **Camera Enhancements**
   ```typescript
   import { Camera } from 'expo-camera'
   
   // Custom camera UI
   <Camera
     ref={cameraRef}
     type={cameraType}
     zoom={zoom}
     flashMode={flashMode}
   >
     <ZoomSlider value={zoom} onChange={setZoom} />
     <FlashToggle value={flashMode} onChange={setFlashMode} />
     <FlipCameraButton onPress={() => toggleCameraType()} />
   </Camera>
   
   // Before/After photos
   <BeforeAfterView
     before={beforePhoto}
     after={afterPhoto}
     onSwipe={(position) => setSliderPosition(position)}
   />
   ```

4. **Biometric for Sensitive Actions**
   ```typescript
   const requireBiometric = async (action: () => void) => {
     const result = await LocalAuthentication.authenticateAsync({
       promptMessage: 'Confirma esta acción',
       fallbackLabel: 'Usar contraseña',
     })
     
     if (result.success) {
       action()
     }
   }
   
   // Uso:
   <Button onPress={() => requireBiometric(() => deletePatient(id))}>
     Eliminar Paciente
   </Button>
   ```

5. **Performance Optimization**
   ```json
   // app.json
   {
     "expo": {
       "jsEngine": "hermes", // ← Mejora performance 50%
       "plugins": [
         ["expo-image", { "cacheControl": "immutable" }]
       ]
     }
   }
   ```

   ```tsx
   // Usar FlashList en vez de FlatList
   import { FlashList } from '@shopify/flash-list'
   
   <FlashList
     data={patients}
     renderItem={({ item }) => <PatientCard patient={item} />}
     estimatedItemSize={80}
   />
   
   // Memoize components
   const PatientCard = React.memo(({ patient }) => {
     return <Card>...</Card>
   })
   ```

---

### **FASE 4: APP PROFESIONAL (4 semanas)**

**Objetivo:** App separada para doctores (más simple, enfocada en agenda + citas)

#### **Semana 17-18: Setup App Profesional**

1. **Nuevo Proyecto Expo**
   ```bash
   cd apps/
   npx create-expo-app mobile-doctor -t expo-template-blank-typescript
   ```

2. **Compartir Código (Monorepo)**
   ```
   packages/shared/
     types/            # Interfaces compartidas
     api/              # Hooks usePatients, useAppointments
     ui/               # Button, Card, Avatar
     utils/            # formatDate, validatePhone
   ```

3. **Features Exclusivas Doctor App**
   - ✅ Login: Solo email/password (no OAuth)
   - ✅ Vista simplificada: Solo agenda + pacientes asignados
   - ❌ No acceso a: Inventario, reportes financieros, settings avanzados
   - ✅ Quick actions: "Marcar completada", "Reagendar", "Cancelar"

4. **Notificaciones Específicas**
   - Nueva cita asignada
   - Paciente llegó (check-in manual por recepción)
   - Cambio en horario
   - Recordatorio inicio jornada (ej: "Tienes 3 citas hoy")

5. **Offline Robusto**
   - Descargar agenda completa del día al abrir app
   - Marcar citas completadas offline → sync on reconnect
   - **Conflict resolution:** Last-write-wins (timestamp)

#### **Semana 19-20: Polish & Testing**

1. **Accessibility Audit**
   - Screen reader support (labels en todos los botones)
   - Font scaling (iOS Dynamic Type / Android font size)
   - Color contrast (WCAG AA compliance)
   - Keyboard navigation (tab order lógico)

2. **Performance Testing**
   - Lighthouse Mobile: Target 90+ score
   - Metro bundler: Analyze bundle size (<10MB)
   - Startup time: <3s en dispositivos mid-range
   - Frame rate: 60fps en scrolls

3. **Beta Testing**
   - **TestFlight (iOS):** 10 usuarios internos
   - **Google Play Internal Testing:** 10 usuarios
   - Crash reporting: Sentry React Native
   - Feedback form: In-app con screenshots (`expo-sharing`)

4. **Bug Fixes**
   - Fix critical bugs (crashes, data loss)
   - Fix high-priority UX issues
   - Polish animations (`react-native-reanimated`)
   - Update dependencies (security patches)

---

### **FASE 5: LANZAMIENTO (2-4 semanas)**

**Objetivo:** Publicar en App Store + Google Play

#### **Semana 21-22: App Store Preparation**

1. **Assets Creation**
   - **App icon:** 1024x1024 (iOS), 512x512 (Android)
   - **Splash screen:** 1242x2688 (iPhone), 1080x1920 (Android)
   - **Screenshots (6-8 por plataforma):**
     - iPhone 15 Pro Max: 1290x2796
     - iPad Pro 12.9": 2048x2732
     - Android Pixel 7: 1080x2400
   - **Feature graphic (Google Play):** 1024x500

2. **App Store Metadata**
   - **App name:** "AgendaMedPro - Gestión Médica"
   - **Subtitle (iOS):** "Agenda, pacientes e inventario"
   - **Description (4000 chars):** Destacar BYOK WhatsApp, NOM-004, multi-doctor
   - **Keywords (iOS):** "agenda médica", "gestión clínica", "expediente electrónico", "NOM-004"
   - **Category:** Medical, Productivity
   - **Age rating:** 12+ (medical content)

3. **Privacy Policy**
   - Actualizar en `agendamedpro.com/privacy`
   - **Declarar permisos:**
     - Location (opcional para consultorios)
     - Camera (fotos pacientes)
     - Contacts (importar pacientes - opcional)
     - HealthKit (no usado actualmente)
   - GDPR compliance: Data export, deletion request

4. **Terms of Service**
   - Actualizar en `agendamedpro.com/terms`
   - **Mencionar:**
     - Subscripciones (IAP o web)
     - Reembolsos (7 días trial)
     - BYOK responsabilidad (usuario provee credenciales Twilio)

#### **Semana 23-24: Submission & Launch**

1. **iOS Submission**
   ```bash
   # Apple Developer account: $99/año
   eas build --platform ios --profile production
   
   # Submit via Transporter o EAS
   eas submit --platform ios
   ```
   
   - **Review notes:** "Cuenta demo: demo@agendamedpro.com / Demo1234!"
   - Esperar review (2-5 días típico)

2. **Android Submission**
   ```bash
   # Google Play Console: $25 one-time
   eas build --platform android --profile production
   eas submit --platform android
   ```
   
   - Create release: Production → Countries (México, LATAM, USA)
   - Esperar review (1-3 días típico)

3. **Soft Launch**
   - Launch en **México primero** (país natal)
   - Monitor crashes: Sentry dashboard
   - Monitor reviews: App Store Connect + Google Play Console
   - **Hotfix critical bugs:** EAS Update (OTA - sin rebuild)

4. **Marketing Materials**
   - Landing page: `agendamedpro.com/apps`
   - Demo video: 60s mostrando features clave
   - Social media posts (LinkedIn, Instagram)
   - Email a usuarios existentes PWA: "¡Ya disponible en App Store!"

5. **Full Launch**
   - Press release: "AgendaMedPro lanza apps nativas"
   - Webinar: "Novedades de la app móvil"
   - Promo: 20% descuento primer mes si registran desde app
   - Influencer outreach: Médicos con audiencia en Instagram

**Entregables Finales:**
- ✅ App Cliente iOS/Android en App Store/Google Play
- ✅ App Profesional iOS/Android (opcional, separada)
- ✅ Push notifications funcionales (24h/2h/1h reminders)
- ✅ Offline-first robusto (sync automático)
- ✅ Biometric auth (Touch ID / Face ID)
- ✅ Deep linking (universal links)
- ✅ Performance 60fps, <3s startup
- ✅ Accesibilidad WCAG AA

---

## **CONSIDERACIONES IMPORTANTES**

### **1. Sincronización Backend ↔ Mobile**

**¿Cómo afectan cambios en web a mobile?**

| Cambio | Deploy Vercel | Rebuild Mobile | Update App Stores |
|--------|---------------|----------------|-------------------|
| Nueva columna DB | ✅ | ❌ | ❌ |
| Nuevo endpoint API | ✅ | ❌ | ❌ |
| RLS policy update | ✅ | ❌ | ❌ |
| Fix bug en API logic | ✅ | ❌ | ❌ |
| Cambio precio Stripe | ✅ | ❌ | ❌ |
| **Nueva pantalla mobile** | ❌ | ✅ | ✅ |
| **Nuevo componente mobile** | ❌ | ✅ | ✅ |
| **Cambio en navegación** | ❌ | ✅ | ✅ |
| **Nueva dependencia nativa** | ❌ | ✅ | ✅ |
| Fix texto/estilos JS | ❌ | ⚡ OTA | ❌ |

**Estrategia recomendada:**
```
Backend changes → Deploy Vercel → Mobile consume automáticamente
UI/UX changes → EAS Update (OTA) para hotfixes
New features → Rebuild + submit stores (cada 2-4 semanas)
```

**Ejemplo: Nueva feature "Seguros Médicos"**

```sql
-- 1. Backend (deploy Vercel - 1 día)
ALTER TABLE patients ADD COLUMN seguro_medico TEXT;
ALTER TABLE patients ADD COLUMN numero_poliza TEXT;

-- API ya devuelve nuevos campos automáticamente
```

```tsx
// 2. Web UI (deploy Vercel - 1 día)
<Input label="Seguro médico" {...register('seguro_medico')} />
```

```tsx
// 3. Mobile UI (rebuild app - 1 semana)
<TextInput
  label="Seguro médico"
  value={seguroMedico}
  onChangeText={setSeguroMedico}
/>

// Build → Submit → Review (2-5 días) → Users update
```

**Resultado:** Backend disponible en 1 día, mobile en 1-2 semanas.

---

### **2. Expo Updates (OTA) - Hotfixes Sin Rebuild**

**Para cambios menores de JavaScript:**

```bash
# Deploy código JS sin rebuild ni submit a stores
eas update --branch production --message "Fix validación teléfono"
```

**Qué se puede actualizar OTA:**
- ✅ Fixes de bugs en lógica JS
- ✅ Cambios de texto/traducciones
- ✅ Ajustes de estilos (colores, tamaños)
- ✅ Nuevas validaciones de formularios
- ✅ Cambios en API endpoints consumidos

**Qué NO se puede (requiere rebuild):**
- ❌ Nuevas dependencias nativas (`expo-camera`, etc.)
- ❌ Cambios en `app.json` (permisos, deep links)
- ❌ Actualizar Expo SDK (ej: 51 → 52)

**Setup:**
```json
// app.json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/[project-id]",
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

**Ventaja:** Usuarios reciben updates en **segundos** al abrir app (sin App Store).

---

### **3. Subscripciones In-App Purchase (IAP)**

**Opciones de monetización:**

#### **Opción A: Redirect a Web (RECOMENDADO)**
```tsx
// Mobile app
<Button onPress={() => Linking.openURL('https://agendamedpro.com/upgrade')}>
  Actualizar Plan
</Button>
```

**Ventajas:**
- ✅ Evita comisión 30% App Store/Google Play
- ✅ No requiere implementar IAP complejo
- ✅ Stripe maneja todo (webhooks, reembolsos)

**Desventajas:**
- ❌ Experiencia menos fluida (sale de app)
- ❌ App Store puede rechazar si solo hay este método

#### **Opción B: Implementar IAP Nativo**
```typescript
import * as InAppPurchases from 'expo-in-app-purchases'

// Setup products
const products = [
  { id: 'basico_monthly', price: '$599 MXN' },
  { id: 'pro_monthly', price: '$999 MXN' },
]

// Purchase flow
const purchase = await InAppPurchases.purchaseItemAsync('pro_monthly')

// Webhook IAP → Backend valida recibo → Sincroniza con Stripe
```

**Ventajas:**
- ✅ Experiencia nativa fluida
- ✅ App Store no rechaza

**Desventajas:**
- ❌ Comisión 30% (15% después año 1)
- ❌ Complejidad: Validar recibos iOS/Android
- ❌ Manejar reembolsos manualmente

**Recomendación:** Empezar con **Opción A**, evaluar IAP si rechazan en review.

---

### **4. Analytics & Monitoring**

**Stack recomendado:**

```bash
# Expo Analytics (básico, gratis)
npx expo install expo-analytics

# Firebase Analytics (user behavior)
npx expo install @react-native-firebase/analytics

# Sentry (crash reporting)
npx expo install @sentry/react-native

# Mixpanel (opcional, advanced)
npm install mixpanel-react-native
```

**Eventos clave a trackear:**
```typescript
// App lifecycle
Analytics.track('app_opened')
Analytics.track('app_backgrounded')

// User actions
Analytics.track('appointment_created', { doctor_id, treatment_id })
Analytics.track('patient_added', { has_photo: true })
Analytics.track('message_sent', { channel: 'whatsapp' })

// Business metrics
Analytics.track('subscription_upgraded', { from: 'basico', to: 'pro' })
Analytics.track('trial_started')
Analytics.track('trial_converted')

// Errors
Sentry.captureException(error)
```

**Dashboard en Firebase:**
- User retention (Day 1, 7, 30)
- Most used features
- Crash-free sessions
- Average session duration

---

### **5. Multi-Language Support (Futuro)**

**Preparar i18n desde inicio:**

```typescript
import * as Localization from 'expo-localization'
import { I18n } from 'i18n-js'

const translations = {
  es: {
    welcome: 'Bienvenido a AgendaMedPro',
    patients: 'Pacientes',
    appointments: 'Citas',
  },
  en: {
    welcome: 'Welcome to AgendaMedPro',
    patients: 'Patients',
    appointments: 'Appointments',
  },
}

const i18n = new I18n(translations)
i18n.locale = Localization.locale
i18n.enableFallback = true

// Uso
<Text>{i18n.t('welcome')}</Text>
```

**Prioridad idiomas:**
1. Español (México) - lanzamiento
2. Inglés (USA) - mes 3
3. Portugués (Brasil) - mes 6

---

### **6. Telemedicine (Fase 6 - Futuro)**

**Integración video calls:**

**Opciones de SDK:**
1. **Twilio Video** (ya tienen cuenta Twilio)
   - $0.0015/min participante
   - Mejor integración con WhatsApp existente
   
2. **Agora.io**
   - $0.99/1000 mins (más barato)
   - Mejor performance LATAM
   
3. **100ms**
   - Setup más fácil
   - Free tier generoso

**Features telemedicine:**
```tsx
<VideoCallScreen>
  <RemoteVideo participantId={patientId} />
  <LocalVideo mirror={true} />
  
  <Controls>
    <MuteButton />
    <VideoToggleButton />
    <ScreenShareButton /> {/* Mostrar expediente */}
    <EndCallButton />
  </Controls>
  
  <Chat messages={chatMessages} />
</VideoCallScreen>
```

**Post-call workflow:**
- Auto-crear medical record con notas de la llamada
- Opción de generar prescripción digital
- Enviar resumen por WhatsApp al paciente
- Recording opcional (compliance)

---

## **MÉTRICAS DE ÉXITO**

### **Mes 1 Post-Launch**
- 500+ downloads (cliente + doctor combined)
- 4.0+ rating (App Store + Google Play)
- <1% crash rate
- 30%+ DAU/MAU ratio (engagement)

### **Mes 3**
- 2,000+ downloads
- 4.5+ rating
- 50+ reviews positivos
- 20% de usuarios PWA migraron a app nativa

### **Mes 6**
- 5,000+ downloads
- Top 50 en categoría Medical (México)
- 15% de nuevos signups vienen desde app (vs web)
- 60%+ retention rate (usuarios activos después de 30 días)

### **Año 1**
- 15,000+ downloads
- 4.7+ rating
- 500+ reviews
- 30% de revenue total viene de usuarios mobile-first
- Lanzamiento en 3 países (México, USA, Colombia)

---

## **RIESGOS & MITIGACIÓN**

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Rechazo App Store (policy violation) | Media | Alto | Seguir guidelines estrictamente, cuenta demo clara, no mencionar competidores en screenshots |
| Performance issues (lag, crashes) | Media | Alto | Profile early con Flashpoint, optimize images, usar Hermes, testing en dispositivos low-end (iPhone 8, Android 8) |
| Offline sync conflicts | Alta | Medio | Implementar conflict resolution UI (mostrar ambas versiones), last-write-wins con timestamp, logs de sync |
| Push notifications no llegan | Media | Alto | Implementar fallback a SMS/Email, monitorear delivery rates con Firebase Analytics, retry logic |
| Budget overrun | Media | Medio | Priorizar MVP features (agenda + pacientes primero), usar Expo (vs React Native CLI) para reducir tiempo dev |
| User confusion (2 apps: cliente vs doctor) | Baja | Medio | Clear naming, onboarding educativo, FAQ en stores, deep linking desde web |
| Review delays (Apple/Google) | Alta | Bajo | Planear 2-5 días extra, tener cuenta demo lista, preparar appeal response si rechazan |
| Deprecation de Expo SDK | Baja | Alto | Mantener dependencies actualizadas, subscribir a changelog Expo, testing antes de upgrade |

---

## **PRESUPUESTO & ROI**

### **Costos Estimados**

**One-time:**
- Apple Developer: $99/año
- Google Play: $25 one-time
- Assets creation (icon, screenshots): $200-500 si outsource

**Recurrentes:**
- EAS Build (Expo): $29/mes (optional, puede usar free tier con límites)
- Firebase: $0-25/mes (Spark plan → Blaze si escala)
- Sentry: $26/mes (Team plan, 100k events)
- Push notifications: $0 (Firebase gratis hasta 10M/mes)

**Dev Time:**
- 16-24 semanas × $X/hr (depende de equipo)
- Si in-house: ~$15,000-30,000 USD total
- Si outsource: ~$40,000-60,000 USD

### **ROI Esperado**

**Conversión:**
- +20% aumento trial→paid (app store presence = credibilidad)
- +15% reducción cart abandonment (flujo nativo más smooth)

**Retention:**
- +30% reducción en churn (mejor UX que PWA)
- +25% aumento en sesiones/semana (push notifications traen de vuelta)

**Lifetime Value:**
- +15% aumento en LTV (users más engaged)
- +40% probabilidad de recomendar app (Net Promoter Score)

**Revenue Projections:**
- Mes 1-3: Neutro (inversión inicial)
- Mes 4-6: +$2,000-5,000 MXN/mes (nuevos signups mobile)
- Mes 7-12: +$10,000-20,000 MXN/mes (escala)
- Año 2: 30% de revenue total viene de mobile-first users

**Payback Period:** 8-12 meses (asumiendo crecimiento constante)

---

## **PRÓXIMOS PASOS INMEDIATOS**

### **Pre-Development (1-2 semanas)**

1. **Validar PWA actual**
   - Verificar si manifest.json y service worker existen
   - Research confirmó: **No implementado** en `/vercel-migration`
   - Decisión: Saltar directo a React Native (no implementar PWA como stopgap)

2. **Crear Firebase Project**
   - Console: [console.firebase.google.com](https://console.firebase.google.com)
   - Agregar apps: iOS (`com.agendamedpro.app`) + Android (`com.agendamedpro.app`)
   - Descargar `google-services.json` y `GoogleService-Info.plist`

3. **Setup Apple Developer Account**
   - Registrar en [developer.apple.com](https://developer.apple.com)
   - $99/año
   - Agregar domain: `agendamedpro.com` para Universal Links

4. **Setup Google Play Console**
   - Registrar en [play.google.com/console](https://play.google.com/console)
   - $25 one-time
   - Crear app: Bundle ID `com.agendamedpro.app`

5. **Crear Monorepo Structure**
   ```bash
   npx create-turbo@latest agendamedpro
   cd agendamedpro
   # Mover web existente a apps/web
   # Crear apps/mobile-cliente
   ```

### **Week 1 Sprint (Kickoff)**

**Día 1-2:**
- Setup Expo project
- Configure TypeScript + ESLint
- Install core dependencies (Supabase, React Query, Navigation)

**Día 3-4:**
- Configure Supabase client con SecureStore
- Setup React Query con AsyncStorage persister
- Create navigation structure (Auth Stack + Main Tabs)

**Día 5:**
- Create login screen (UI only, no logic)
- Create patient list screen (skeleton)
- Review + demo interna

**Entregable Semana 1:**
- ✅ App corre en Expo Go (iOS + Android)
- ✅ Navegación funcional (mock screens)
- ✅ Supabase client configurado
- ✅ Auth flow skeleton (login screen visible)

---

## **RECURSOS ÚTILES**

### **Documentación Oficial**
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Supabase React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [React Query](https://tanstack.com/query/latest/docs/react/overview)
- [EAS Build](https://docs.expo.dev/build/introduction/)

### **Templates & Starters**
- [Expo Router Template](https://github.com/expo/examples/tree/master/with-router)
- [Supabase + Expo Starter](https://github.com/supabase-community/expo-starter)
- [React Native Paper Template](https://github.com/callstack/react-native-paper/tree/main/example)

### **Communities**
- [Expo Discord](https://chat.expo.dev/)
- [Supabase Discord](https://discord.supabase.com/)
- [React Native Community](https://www.reactnative.dev/community/overview)

---

## **VERSIÓN & CHANGELOG**

**v1.0 - 15 Nov 2025**
- Documento inicial
- Research completo de codebase actual
- Roadmap 24 semanas (5 fases)
- Stack decisions (Expo + Supabase + React Query)

**Próximas actualizaciones:**
- [ ] Refinamiento después de setup Firebase
- [ ] Ajustes post Week 1 Sprint
- [ ] Updates después de beta testing
- [ ] Post-mortem launch

---

## **CONTACTO & OWNERSHIP**

**Product Owner:** [Tu nombre]  
**Tech Lead:** TBD  
**Timeline:** Nov 2025 - Mayo 2026 (24 semanas)  
**Status:** ⏸️ En pausa hasta SaaS web al 100%  
**Priority:** P2 (después de features críticas web)

---

**Última actualización:** 15 de noviembre, 2025
