# Messaging Data Model (Draft)

## Context
- Existing tables: `messaging_config` (WhatsApp BYOK credentials) y `whatsapp_messages` (historial). Ambos están ligados a `auth.users` vía `user_id`.
- Objetivo: evolucionar a un modelo multi-canal que soporte SMS (Twilio, MessageBird, Plivo), WhatsApp Business y Email usando una capa común.

## Ownership & Tenancy
- **Unidad de control**: `user_id` (doctor/clinic owner) como mínimo viable para integración con tablas actuales.
- Futuro: permitir `clinic_id`/`organization_id` si se introduce multi-sede. Diseñar columnas `account_id UUID NULL` como extensibilidad opcional.

## Entidades Principales

```text
┌────────────────────┐      ┌────────────────────┐
│ messaging_providers│──────│ messaging_templates│
└─────────┬──────────┘      └─────────┬──────────┘
          │                             │
          │                             │
          ▼                             ▼
┌────────────────────┐      ┌────────────────────┐      ┌────────────────────┐
│ messaging_jobs     │──────│ messaging_messages │──────│ providers_webhooks │ (opcional)
└────────────────────┘      └────────────────────┘      └────────────────────┘
```

### Table: `messaging_providers`
| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | `uuid_generate_v4()` |
| user_id | UUID FK | `REFERENCES auth.users(id) ON DELETE CASCADE` |
| account_id | UUID FK nullable | Reserva para multi-clinic |
| channel | TEXT | Enum `'sms'|'whatsapp'|'email'` |
| provider | TEXT | Enum `'twilio'|'messagebird'|'plivo'|'meta_whatsapp'|'sendgrid'|'resend'` |
| credentials_encrypted | TEXT | JSON cifrado (usar Vault posteriormente) |
| config | JSONB | Opciones (horarios, firmas, números de origen) |
| status | TEXT | `'pending'|'active'|'error'|'disabled'` |
| last_synced_at | TIMESTAMPTZ | Última verificación con proveedor |
| created_at / updated_at | TIMESTAMPTZ | Triggers automáticos |
| UNIQUE (user_id, channel) | Garantiza un proveedor por canal (se permiten overrides manuales con extra flag) |

### Table: `messaging_templates`
| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK |
| user_id | UUID FK |
| channel | TEXT | `'sms'|'whatsapp'|'email'` |
| trigger | TEXT | `'confirmation'|'reminder_24h'|'reminder_2h'|'follow_up'|...` |
| name | TEXT | Nombre editable |
| locale | TEXT | ISO `es-MX`, `en-US`, etc. |
| body | TEXT | Plantilla, placeholders `{patient_name}` |
| rich_content | JSONB | Para canales con payload estructurado (WhatsApp interactive, Email HTML) |
| variables | TEXT[] | Placeholders requeridos |
| is_default | BOOLEAN | Determina plantilla base |
| is_active | BOOLEAN |
| version | INTEGER | Para historial |
| created_at / updated_at | TIMESTAMPTZ |
| UNIQUE(user_id, channel, trigger, locale, version) |

### Table: `messaging_messages`
| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK |
| user_id | UUID FK |
| provider_id | UUID FK -> `messaging_providers(id)` |
| template_id | UUID FK nullable |
| channel | TEXT |
| provider | TEXT | Copia denormalizada para reportes |
| to_contact | JSONB | `{ phone: '+521...', email: '...' }` |
| patient_id | UUID FK nullable |
| appointment_id | UUID FK nullable |
| subject | TEXT | Emails |
| body | TEXT | Render final |
| payload | JSONB | Meta específica (media, botones) |
| status | TEXT | `'queued'|'sending'|'sent'|'delivered'|'read'|'failed'|'cancelled'` |
| error_code | TEXT |
| error_message | TEXT |
| provider_message_id | TEXT |
| scheduled_at | TIMESTAMPTZ | Hora objetivo |
| sent_at / delivered_at / read_at / failed_at | TIMESTAMPTZ |
| created_at | TIMESTAMPTZ DEFAULT now() |
| INDEX ON (user_id, channel, status) |

### Table: `messaging_jobs`
| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK |
| message_id | UUID FK -> `messaging_messages(id)` |
| run_at | TIMESTAMPTZ | Fecha de ejecución |
| status | TEXT | `'pending'|'processing'|'done'|'failed'` |
| attempts | INTEGER | Reintentos |
| last_error | TEXT |
| created_at / updated_at | TIMESTAMPTZ |
| INDEX on (status, run_at) |

> _Alternativa_: usar `supabase.queue` o un cron; la tabla sirve como fallback si se requiere portabilidad.

### Table: `providers_webhooks` (opcional)
- Guarda registros entrantes de proveedores para auditoría.
- Columns: `id`, `provider`, `payload`, `received_at`, `signature_valid`, `message_id` (FK).

## Relaciones y RLS
- Todas las tablas habilitan RLS con políticas `auth.uid() = user_id`.
- `messaging_providers` sustituirá progresivamente `messaging_config`; se migran columnas específicas de WhatsApp a `config JSONB`.
- `whatsapp_messages` se migrará/renombrará a `messaging_messages` vía script de transición.

## Placeholders Soportados
| Placeholder | Descripción |
| --- | --- |
| `{patient_name}` | Nombre completo del paciente |
| `{doctor_name}` | De `messaging_providers.config` o `clinic_settings` |
| `{appointment_date}` | Fecha amigable |
| `{appointment_time}` | Hora |
| `{clinic_name}` | Personalización |
| `{clinic_address}` | |
| `{confirmation_link}` | URL para confirmar |
| `{cancellation_link}` | URL para cancelar |

> Documentar validación para asegurar que cada plantilla incluye las variables requeridas según el trigger.

## Próximos Pasos
1. Redactar migraciones SQL basadas en esta propuesta.
2. Alinear `messaging_config` → `messaging_providers` (columna `channel='whatsapp'`).
3. Reemplazar `whatsapp_messages` por vista/tabla nueva o migración de datos.
4. Actualizar `TODO/phase-1-messaging.md` conforme se avanza.
