# SGMM_FRESH - Estado Real Consolidado (Merged)

Fecha: 2026-04-26
Estado: documento consolidado de referencia para evitar dispersion y contradicciones.

## 1) Fuente de verdad actual
El sistema activo en produccion es `vercel-migration/`.

- Frontend y backend webapp: Next.js App Router
- Auth y DB: Supabase (PostgreSQL + RLS)
- Pagos: Stripe (principal) + MercadoPago (soporte)
- Facturacion Mexico: Facturama / CFDI
- Mensajeria: Email + WhatsApp BYOK + SMS credenciales

## 2) Que NO es fuente de verdad
El historial previo de sistema local (.exe/MSI/FastAPI+SQLite) ya no es la arquitectura activa.

Durante esta limpieza se movio legado de alta confianza a:
- `archive/legacy-20260426/`

Incluye:
- logs de instalacion/build MSI
- carpetas de experimentos desktop/cloud y snapshots

## 3) Capacidad funcional actual (resumen)
Detalle tecnico ampliado: `vercel-migration/docs/CAPABILITY_MATRIX_2026.md`

- Agenda y citas: implementado
- Pacientes e historial clinico: implementado
- Tratamientos e inventario: implementado
- Suscripciones/paywall: implementado
- Facturacion/CFDI: implementado
- Mensajeria (email/WhatsApp): implementado
- Roles/equipo: implementado
- Reportes avanzados de negocio: parcial
- IA clinica avanzada: parcial
- Portal paciente: pendiente

## 4) Documentacion que debe mantenerse viva
Documentos base recomendados desde ahora:

- `README.md` (raiz): orientacion de workspace y enlace al sistema activo
- `vercel-migration/README.md`: setup y operacion del sistema activo
- `DOCS_ESTADO_REAL_MERGED.md`: estado funcional consolidado
- `ROADMAP_GAPS_MERGED.md`: brechas y prioridades
- `vercel-migration/docs/CAPABILITY_MATRIX_2026.md`: matriz de capacidades con evidencia

## 5) Regla de mantenimiento documental
- Si una funcionalidad cambia, primero se actualiza codigo y luego estos docs.
- Evitar crear reportes "status snapshot" aislados; consolidar en documentos vivos.
- Cualquier doc obsoleto se mueve a `archive/legacy-20260426/docs-obsolete/` en vez de borrado directo.

## 6) Estado de consolidacion (actualizado)
Checklist de limpieza documental completado en esta fase:

1. Documentacion merged creada y consolidada (`DOCS_ESTADO_REAL_MERGED.md` + `ROADMAP_GAPS_MERGED.md`).
2. Archivo de docs obsoletos ejecutado por lotes con trazabilidad en `archive/legacy-20260426/DOCS_MIGRATION_INDEX.md`.
3. README raiz alineado a arquitectura activa (Next.js + Supabase en `vercel-migration/`).

Docs activos en raiz tras depuracion:
- `README.md`
- `DOCS_ESTADO_REAL_MERGED.md`
- `ROADMAP_GAPS_MERGED.md`
- `ANALISIS_COMPETITIVO_COMPLETO_AGENDAS_MEDICAS.md`
- `ARQUITECTURA_CONFIGURACION.md`
- `SMS_CREDENTIALS_SYSTEM.md`
- `TRIAL_TESTING_GUIDE.md`
- `WHATSAPP_AI_SYSTEM.md`
- `WHATSAPP-BYOK-READY.md`

## 7) Siguiente bloque de trabajo
1. Mantener `vercel-migration/docs/CAPABILITY_MATRIX_2026.md` como evidencia funcional viva por modulo.
2. Ejecutar revisiones mensuales de docs activos para evitar nueva dispersion.
3. Priorizar roadmap P0: portal paciente MVP + KPI dashboard + hardening E2E onboarding/paywall.
