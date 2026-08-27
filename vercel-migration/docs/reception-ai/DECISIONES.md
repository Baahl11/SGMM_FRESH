# Decisiones — Recepción IA WhatsApp

Registro de decisiones de producto/arquitectura ya cerradas para este proyecto. No es una bitácora operativa (ver `BITACORA.md`) — aquí solo van decisiones tomadas, con quién las tomó y por qué, para no reabrirlas por accidente en una sesión futura.

---

## 2026-08-26 — D-1: El WABA es del médico, siempre

**Fuente:** `HANDOFF_V2.1_ADENDA_CORRECTIVA_RECEPCION_IA.md`, Bloque 1.

AgendaMedPro nunca es dueño del activo de Meta ni paga la factura de Meta.

- La clínica crea y conserva su Business Manager, su WABA y su número.
- La facturación de Meta llega a la tarjeta de la clínica, sin excepciones.
- AgendaMedPro solo se conecta a ese activo — el onboarding es de conexión/autorización, no de aprovisionamiento.
- Diseñar para Embedded Signup desde ya, aunque el piloto use captura manual de token.
- Ninguna lógica de AgendaMedPro debe absorber costo de Meta del lado de la plataforma.

## 2026-08-26 — D-2: Proveedor de LLM — el más barato que pase la evaluación

**Fuente:** `HANDOFF_V2.1_ADENDA_CORRECTIVA_RECEPCION_IA.md`, Bloque 1.

Criterio: costo por respuesta, no marca. **Luna procede como primario** (GPT-5.6 Luna, ~$0.20/millón entrada, ~$1.20/millón salida — precios del 30 jul 2026, `[VERIFICAR]` antes de cerrar contrato con cualquier clínica, ver Bloque 7 punto 8 de la adenda).

Condiciones no negociables:
- Modelo, timeout, `max_tokens` y tarifas viven en configuración server-side versionada, nunca hardcodeados en una ruta.
- Antes de activar Luna en producción, correr el set de evaluación de Fase 3 contra Luna; si falla, escalar a Terra y documentar por qué.
- El asistente interno para médicos (Anthropic) no se toca — son dos sistemas y dos presupuestos separados.

## 2026-08-26 — D-3: Orden de prioridad de optimización de costo

**Fuente:** `HANDOFF_V2.1_ADENDA_CORRECTIVA_RECEPCION_IA.md`, Bloque 1.

El costo del LLM no es la variable dominante (ver Bloque 2 de la adenda: el transporte de Meta cuesta ~12x lo que cuesta generar el texto una vez que la facturación por mensaje entre en vigor el 1 de octubre de 2026). Optimizar de Haiku a Luna ahorra centavos; optimizar de 6 mensajes a 2 mensajes por conversación ahorra el triple. **Prioridad: reducir mensajes salientes antes que optimizar el modelo.**

## 2026-08-26 — Diferida a Fase 6: ventana gratuita de Click-to-WhatsApp/CTA

**Fuente:** `HANDOFF_V2.1_ADENDA_CORRECTIVA_RECEPCION_IA.md`, Bloque 2.4.

Las conversaciones originadas en un anuncio Click-to-WhatsApp o un botón CTA de la página de Facebook conservan una ventana de entrada gratuita de 72 horas — si la clínica pauta, ese tráfico no cuesta transporte de Meta. No es tarea del piloto. Anotado aquí como optimización de Fase 6 y como argumento de venta a futuro.
