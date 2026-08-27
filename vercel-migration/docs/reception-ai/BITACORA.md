# Bitácora operativa — Recepción IA WhatsApp

Registro cronológico de confirmaciones, cierres de puntos `[HUMANO]` y notas operativas. Para decisiones de producto/arquitectura ya cerradas, ver `DECISIONES.md`.

---

## 2026-08-26 — Cierre del punto 3.1 de la adenda V2.1 (credenciales Twilio ficticias)

`HANDOFF_V2.1_ADENDA_CORRECTIVA_RECEPCION_IA.md`, Bloque 3.1 y Bloque 7 punto 1, pedían confirmar en la consola de Twilio que los valores con forma de credencial real en `.env.whatsapp.example` (`AC`+32 hex, `MG`+32 hex) eran ficticios, antes de cerrar el hallazgo sin rotar.

**Confirmado.** Evidencia reunida:

1. `git log --all -- .env.whatsapp.example` muestra que el archivo con esos valores nunca estuvo en ningún commit anterior al que ya los reemplazó por placeholders explícitos (Fase 0, commit `0f7a7c34`) — el valor real nunca salió de disco local vía git.
2. Se revisaron los `.zip` de respaldo pre-Fase-0 sueltos en la raíz del repositorio (fechados 11-14 de junio de 2026); ninguno contiene una copia del archivo con el valor real.
3. El operador del proyecto confirmó directamente en la consola de Twilio, captura de pantalla de la sección "API keys & tokens": la cuenta no tiene ninguna API key creada.

**Nota de precisión:** el punto 3 cubre la página de "API keys" (credenciales adicionales, revocables), no la vista principal de "Account SID / Auth Token" que toda cuenta de Twilio trae por defecto desde su creación. No se verificó esa página específica. Dado que no existe ninguna integración activa de Twilio en el código en producción (cero variables `TWILIO_*` configuradas en Vercel ni en `.env.production`, confirmado en la misma sesión), el riesgo residual de esa distinción se considera bajo. Si en el futuro se decide integrar Twilio como canal real, ese es un onboarding nuevo con sus propias credenciales, no una reutilización de este archivo de ejemplo.

**Resultado:** no se purga historial de Git (nunca hubo nada que purgar) ni se rota nada (no hay cuenta activa que rotar). Placeholders explícitos ya en `.env.whatsapp.example` desde Fase 0. Secret scanning activo en CI (`scripts/secret-scan.mjs`, Fase 0).

Detalle completo: `docs/reception-ai/secret-rotation-plan.md`, sección 1.
