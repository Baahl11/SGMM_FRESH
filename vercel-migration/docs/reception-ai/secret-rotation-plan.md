# Plan de rotación de secretos — Recepción IA Fase 0

Fecha: 2026-08-24. Este documento **no contiene ningún valor de credencial**, solo qué rotar, dónde y en qué orden. Ejecución: operador humano con acceso a las consolas de Twilio/Vercel — no automatizable desde este repo.

## 1. Credenciales Twilio expuestas en `.env.whatsapp.example` (working tree, antes de este plan) — RESUELTO 2026-08-25

Variables afectadas: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID` (cuenta maestra de AgendaMedPro, no BYOK de un doctor).

**No hay nada que rotar — nunca existió una credencial de Twilio real y viva para este proyecto.** Evidencia reunida el 2026-08-25:

1. `git log --all -- .env.whatsapp.example` muestra un único commit en todo el historial: `0f7a7c34`, el mismo que ya reemplazó el contenido por placeholders (Task 4 de este plan). El valor con forma real que detectó `secret-scan` **nunca se subió a git** — vivía solo en el working tree local, sin trackear.
2. Se revisaron los `.zip` de respaldo pre-Fase-0 sueltos en la raíz del repo (fechados 11-14 de junio de 2026, antes del fix del 24 de agosto) por si alguno empaquetó una copia con el valor real. Ninguno lo tiene; el único `.env.example` encontrado en esos backups trae `TWILIO_AUTH_TOKEN` vacío.
3. Cero variables `TWILIO_*` configuradas hoy en Vercel (`vercel env ls`) ni en `.env.production`/`.env.local` — Twilio no es ni ha sido el canal activo de WhatsApp en producción (eso corre por Meta Cloud API vía `messaging_config`/`messaging_providers`).
4. Confirmado directamente por el operador (captura de la consola de Twilio, "API keys & tokens"): la cuenta no tiene ninguna API key creada.

Los pasos originales (regenerar Auth Token, actualizar Vercel, redeploy, verificar) **no aplican** — no hay token que regenerar. Si en el futuro se decide integrar Twilio como canal real, ese es un onboarding nuevo, no una rotación.

## 2. Historial de Git

El valor viejo de `.env.whatsapp.example` puede seguir en commits anteriores aunque el working tree ya esté limpio (Task 4 de este plan). Purgar historial (`git filter-repo`, BFG Repo-Cleaner) reescribe hashes y requiere force-push coordinado con todo el equipo — **no se ejecuta en este plan**. Antes de purgar:
- Confirmar con el usuario que autoriza una reescritura de historial en este repositorio.
- Completar primero el paso 1 (rotar en Twilio) — el historial de Git deja de ser explotable en cuanto el token viejo es inválido, aunque el string siga visible.
- Si se decide purgar, coordinar el force-push con cualquier clon/fork existente.

## 3. Relacionado — ya trackeado en auditoría previa (no duplicar aquí)

`NEXTAUTH_SECRET` (hallazgo C5, `docs/fable-audit/03_BUG_REGISTER.md`): código ya corregido, **rotación del secreto sigue pendiente** por el operador. Este plan no la ejecuta; solo se referencia para que quede en la misma checklist operativa antes de conectar Harmonizarte.

## 4. Gate

**Cerrado 2026-08-25.** El paso 1 queda resuelto como no-aplicable (sección 1) — no bloquea conectar el número de WhatsApp de Harmonizarte por este concepto. `NEXTAUTH_SECRET` (sección 3) sigue como rotación pendiente aparte, no relacionada con Twilio/WhatsApp.

## 5. Nota — incidente no planeado de esta sesión (Postgres, no Twilio)

Durante la investigación de deriva de esquema (`docs/reception-ai/schema-reconciliation.md`), `supabase db dump --dry-run` expuso en la consola la contraseña real de conexión a Postgres de `SGMM-PRO`, y un comando de redacción con un bug propio expuso una segunda credencial del mismo tipo. Ambas fueron rotadas por el operador el mismo día, propagadas a los 8 archivos locales que la usaban y a Vercel (`DATABASE_URL`, `POSTGRES_PASSWORD`), y verificadas con una conexión real. No relacionado con las credenciales de Twilio de este documento — se anota aquí solo porque también fue una rotación de credenciales de esta sesión, fuera del alcance original de este plan.
