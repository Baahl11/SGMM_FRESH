# Plan de rotación de secretos — Recepción IA Fase 0

Fecha: 2026-08-24. Este documento **no contiene ningún valor de credencial**, solo qué rotar, dónde y en qué orden. Ejecución: operador humano con acceso a las consolas de Twilio/Vercel — no automatizable desde este repo.

## 1. Credenciales Twilio expuestas en `.env.whatsapp.example` (working tree, antes de este plan)

Variables afectadas: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID` (cuenta maestra de AgendaMedPro, no BYOK de un doctor).

1. En la consola de Twilio: regenerar (`Auth Token` → "Create new primary Auth Token") — esto invalida el token viejo de inmediato. Confirmar con el equipo antes de rotar si algún flujo en producción depende del token actual (recordatorios activos, etc.), para coordinar la ventana de corte.
2. Actualizar `TWILIO_AUTH_TOKEN` (y `TWILIO_ACCOUNT_SID`/`TWILIO_MESSAGING_SERVICE_SID` si también se regeneran) en Vercel → Settings → Environment Variables, en los tres entornos (Production/Preview/Development).
3. Redeploy.
4. Verificar: `npm run secret-scan` en verde (ya lo está tras el Task 4 de este plan — esto confirma que no queden restos en el working tree) y una prueba real de envío WhatsApp con el token nuevo.

## 2. Historial de Git

El valor viejo de `.env.whatsapp.example` puede seguir en commits anteriores aunque el working tree ya esté limpio (Task 4 de este plan). Purgar historial (`git filter-repo`, BFG Repo-Cleaner) reescribe hashes y requiere force-push coordinado con todo el equipo — **no se ejecuta en este plan**. Antes de purgar:
- Confirmar con el usuario que autoriza una reescritura de historial en este repositorio.
- Completar primero el paso 1 (rotar en Twilio) — el historial de Git deja de ser explotable en cuanto el token viejo es inválido, aunque el string siga visible.
- Si se decide purgar, coordinar el force-push con cualquier clon/fork existente.

## 3. Relacionado — ya trackeado en auditoría previa (no duplicar aquí)

`NEXTAUTH_SECRET` (hallazgo C5, `docs/fable-audit/03_BUG_REGISTER.md`): código ya corregido, **rotación del secreto sigue pendiente** por el operador. Este plan no la ejecuta; solo se referencia para que quede en la misma checklist operativa antes de conectar Harmonizarte.

## 4. Gate

No conectar el número de WhatsApp de Harmonizarte hasta que el paso 1 esté confirmado como completado por el operador (rotación real en Twilio + Vercel + redeploy + verificación).
