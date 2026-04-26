# Capability Matrix 2026 - vercel-migration

Fecha: 2026-04-26
Objetivo: inventario de capacidades por evidencia de codigo para comparativos y roadmap.

## Leyenda
- Implemented: funcional en codigo
- Partial: funcionalidad base existe, falta profundidad
- Planned: documentado pero no implementado completamente

| Dominio | Estado | Evidencia principal |
|---|---|---|
| Scheduling / Calendar | Implemented | `app/api/appointments/route.ts`, `app/api/doctor-schedules/route.ts`, `app/api/doctor-exceptions/route.ts`, `supabase/migrations/20250120_google_calendar.sql` |
| Patient management / records | Implemented | `app/api/patients/route.ts`, `app/api/patient-notes/route.ts`, `supabase/migrations/20251104_add_medical_history_nom004.sql` |
| Treatments & inventory | Implemented | `app/api/treatments/route.ts`, `app/api/treatments/[id]/inventory/route.ts`, `app/api/bundles/route.ts` |
| Subscriptions / paywall | Implemented | `supabase/migrations/20251015210000_create_subscriptions_table.sql`, `middleware.ts`, `app/api/create-trial-session/route.ts`, `app/api/stripe/webhook/route.ts` |
| Billing / invoicing (CFDI) | Implemented | `supabase/migrations/20251019_invoices_and_fiscal.sql`, `app/api/facturama/config/route.ts`, `supabase/migrations/20251116_certificates_storage.sql` |
| Messaging (email/WhatsApp) | Implemented | `lib/email-service.ts`, `app/api/email/welcome/route.ts`, `app/api/whatsapp/send/route.ts`, `supabase/migrations/20251027_messaging_config.sql` |
| Team / roles | Implemented | `supabase/migrations/20251111_team_members.sql`, `app/api/team/members/route.ts`, `app/api/admin/invitations/route.ts` |
| Reporting / analytics | Partial | `app/api/reports/billing-stats/route.ts`, `app/api/ai/recommendations/route.ts`, `lib/analytics/funnel-events.ts` |
| Integrations | Partial | Stripe, MercadoPago, Google Calendar, Facturama; faltan webhooks salientes unificados |
| Security / compliance | Implemented | RLS en migraciones (`20250122_add_user_isolation.sql`), cifrado credenciales (`20251116_facturama_encryption_aes256.sql`) |
| AI features | Partial | `app/api/chat/route.ts`, `app/api/ai/recommendations/route.ts` |

## Top gaps para comparativo competitivo

1. Portal paciente autoservicio (reschedule/cancel/documentos)
2. Reporteria ejecutiva avanzada (LTV, margen, productividad por doctor)
3. Webhooks salientes estandar para ecosistema externo
4. Waitlist inteligente y optimizacion de ocupacion
5. IA clinica avanzada (notas por voz y cartas clinicas)
6. Seguimiento de outcomes clinicos longitudinales
7. Flujos avanzados de retencion/fidelizacion

## Competidores de referencia para benchmark

- MX/LATAM: Doctoralia Pro, Nimbo X, AgendaPro
- Global: Pabau, SimplePractice

## Uso recomendado
- Este documento alimenta `ROADMAP_GAPS_MERGED.md`.
- Actualizar cada vez que se entregue una capacidad nueva en produccion.
