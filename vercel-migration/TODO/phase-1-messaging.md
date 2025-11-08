# Phase 1 Messaging TODOs

## Schema & Data Model
- [x] Draft ERD for messaging tables (`templates`, `messages`, `providers`, `jobs`).
- [x] Confirm ownership model (por clínica vs. usuario) y las relaciones necesarias.
- [x] Definir columnas mínimas para cada tabla (incluyendo estados, timestamps, metadata JSON).

## SQL Migrations
- [x] Crear migración para `messaging_providers` con RLS básica.
- [x] Crear migración para `messaging_templates` con soporte multi-canal y placeholders.
- [x] Crear migración para `messaging_messages` (historial de envíos) con índices por estado/canal.
- [x] Evaluar necesidad de `messaging_jobs` o decidir integración con supabase.queue; documentar elección.

## Contracts & Types
- [x] Especificar interfaces TypeScript para entidades (`MessagingProviderConfig`, `MessagingTemplate`, `MessagingMessage`).
- [x] Definir enum/union de canales (`sms`, `whatsapp`, `email`) y proveedores (`twilio`, `messagebird`, `plivo`, `meta`, `sendgrid`, etc.).
- [x] Documentar los placeholders soportados y las validaciones necesarias.

## Security & Storage
- [x] Decidir estrategia de cifrado para credenciales (Supabase Vault, KMS externo, etc.).
- [x] Redactar políticas RLS para limitar acceso a datos de mensajería por clínica.
- [x] Enumerar datos sensibles que requieren masking o hashing (p.ej., números de teléfono).

## Deliverables
- [x] Resumen técnico de la fase con decisiones tomadas (archivo MD en `PLANS/`).
- [x] Checklist de pruebas para validar integridad de las nuevas tablas.
- [ ] PR inicial con migraciones y tipos compartidos.
