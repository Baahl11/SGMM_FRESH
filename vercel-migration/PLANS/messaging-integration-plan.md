# Messaging Integration Plan

## Objetivo
Implementar envío real y unificado de mensajes para SMS (Twilio, MessageBird, Plivo), WhatsApp Business y Email, reemplazando los stubs actuales y soportando plantillas multi-canal.

## Alcance por Fase

### Fase 1: Infraestructura de Mensajería
- [ ] Diseñar modelo de datos común
  - Tabla `messaging_templates`
  - Tabla `messaging_messages`
  - Tabla `messaging_providers` (credenciales y preferencias por clínica/usuario)
  - Tabla `messaging_jobs` o uso de Supabase queue para scheduling
- [ ] Crear migraciones SQL correspondientes
- [ ] Definir contratos de plantilla y variables compartidas

### Fase 2: Servicio Backend de Envío
- [ ] Implementar abstracción `MessagingProvider`
  - Métodos: `sendMessage`, `parseWebhook`, `canHandle`
- [ ] Crear adapters iniciales
  - TwilioProvider
  - MessageBirdProvider
  - PlivoProvider
  - WhatsAppProvider (Graph API)
  - EmailProvider (seleccionar proveedor, ej. Resend/SendGrid)
- [ ] Construir worker/cron tarea (Supabase Edge Function o Vercel cron)
  - Lee jobs pendientes
  - Crea mensajes en `messaging_messages`
  - Invoca proveedor y actualiza estado
- [ ] Implementar manejo de reintentos, errores y logging

### Fase 3: Webhooks y Callbacks
- [ ] Endpoints para delivery status y respuestas:
  - `/api/messaging/webhooks/twilio`
  - `/api/messaging/webhooks/messagebird`
  - `/api/messaging/webhooks/plivo`
  - `/api/messaging/webhooks/whatsapp`
  - `/api/messaging/webhooks/email` (si aplica)
- [ ] Validar firmas/secretos de cada proveedor
- [ ] Actualizar `messaging_messages` con estatus `delivered`, `failed`, `read`, `replied`

### Fase 4: Integración con la App
- [ ] Reemplazar `useSmsReminders` por consumo via Supabase (RPC o REST)
- [ ] Actualizar UI de `/messaging` para mostrar datos reales (historial, estados)
- [ ] Permitir selección de proveedor en UI y guardar en `messaging_providers`
- [ ] Implementar editor de plantillas multi-canal dentro de `/messaging`
  - CRUD sobre `messaging_templates`
  - Previsualización por canal
  - Validaciones de placeholders/caracteres

### Fase 5: Emails y WhatsApp en Producción
- [ ] Implementar envío de correos con plantilla
- [ ] Completar flujo de WhatsApp Business (mensajes + replies)
- [ ] Pruebas end-to-end con cuentas reales

## Consideraciones Técnicas
- Usar Supabase Row Level Security adecuada para nuevas tablas
- Almacenar credenciales cifradas (posible uso de Supabase Vault o KMS externo)
- Diseñar feature toggles para activar canales gradualmente
- Documentar configuración necesaria por proveedor (tokens, webhooks, dominios email)
- Monitorizar costos y límites (Twilio rate limits, Meta templates, etc.)

## Riesgos y Mitigaciones
- **Latencia/Rate limits**: implementar cola y backoff estratégico
- **Seguridad credenciales**: cifrar en repositorio seguro, rotación periódica
- **Compliance (HIPAA)**: auditar almacenamiento de mensajes, usar proveedores compatibles
- **Complejidad UI**: priorizar MVP del editor antes de añadir funciones avanzadas

## Próximos Pasos Inmediatos
1. Crear migraciones para `messaging_templates`, `messaging_messages`, `messaging_providers`.
2. Definir interfaz TypeScript `MessagingProvider` y contratos de entidades.
3. Implementar servicio base de agendamiento (cola + worker) con envío simulado.
4. Iterar proveedor por proveedor integrando SDK real.
