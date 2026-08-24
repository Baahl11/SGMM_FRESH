# Certificacion Funcional Demo - 2026-05-23

## Alcance
- Solo 1 cuenta demo dedicada: a1c99da8-08fc-411e-baf3-dc6bd5c1b02d / demo.sales.20260523@agendamedpro.test
- Cuenta personal owner restaurada a admin + enterprise y demo mode desactivado.
- Evidencia basada en ejecucion real de scripts/comandos en este entorno.

## Leyenda de Estado
- SI: Validado con evidencia ejecutada.
- PARCIAL: Backend implementado y compilado, falta smoke UI/manual.
- NO: No validado o sin evidencia ejecutada hoy.

## Credenciales Demo Activas
- Email: demo.sales.20260523@agendamedpro.test
- Password temporal: DemoSales2026!
- Perfil: STANDARD
- Expiracion demo: 2026-06-23T00:17:12.980+00:00

## Estado Cuenta Personal (Owner)
- Email: gmelgarejom@gmail.com
- Role users: admin
- Role user_profiles: admin
- Suscripcion: enterprise + active
- Demo mode: false

## Evidencia Tecnica Ejecutada
- Demo mode habilitado por script: npm run demo:enable
- Seed base ejecutado: node scripts/verify-and-seed.mjs
- Seed masivo ejecutado: npm run demo:seed
- Build de produccion OK: npm run build
- Snapshot de datos demo confirmado por DB (service role)

## Matriz Funcional (Paso 3)
| Area | Funcionalidad | Estado | Evidencia |
|---|---|---|---|
| Acceso | Login cuenta demo con email/password | SI | Password actualizado por admin API y email confirmado |
| Demo Core | demo_mode_config activo | SI | is_demo_account=true, seed_profile=STANDARD |
| Demo Core | demo_audit_log operativo | SI | Operativo (registros de seed y simulacion) |
| Demo Core | bypass paywall en demo mode | SI | Validado en pass final de produccion sobre rutas protegidas de cuenta demo |
| Datos | Pacientes poblados | SI | 80 registros |
| Datos | Tratamientos poblados | SI | 30 registros |
| Datos | Inventario poblado | SI | 60 registros |
| Datos | Promociones pobladas | SI | 30 registros |
| Datos | Citas pobladas | SI | 640 registros |
| Datos | Records/finanzas poblados | SI | 440 registros |
| Datos | Gastos fijos poblados | SI | 48 registros |
| Datos | Gastos variables poblados | SI | 240 registros |
| Datos | Doctores y consultorios | SI | 3 doctores, 3 consultorios |
| Datos | Tipos de cita | SI | 5 tipos |
| Notificaciones | WhatsApp simulado en endpoint messaging | PARCIAL | Backend implementado + build OK; falta envio manual validado |
| Notificaciones | WhatsApp Cloud simulado | PARCIAL | Backend implementado + build OK; falta prueba manual |
| Notificaciones | Email simulado en notifications/send | PARCIAL | Backend implementado + build OK; falta prueba manual |
| Mensajeria | SMS/Email/WhatsApp en messaging/send simulado | PARCIAL | Backend implementado + build OK; falta prueba manual |
| Pagos | Stripe create-trial-session simulado | PARCIAL | Backend implementado + build OK; falta click-flow completo |
| Pagos | Stripe create-checkout-session simulado | PARCIAL | Backend implementado + build OK; falta click-flow completo |
| Pagos | Stripe /api/stripe/checkout simulado | PARCIAL | Backend implementado + build OK; falta click-flow completo |
| Pagos | MercadoPago checkout simulado | PARCIAL | Backend implementado + build OK; falta click-flow completo |
| Facturacion | Facturama config simulado | PARCIAL | Backend implementado + build OK; falta validacion UI |
| Facturacion | Factura simulada (crear) | PARCIAL | Backend implementado + build OK; falta ejecucion manual |
| Facturacion | Factura simulada (cancelar) | PARCIAL | Backend implementado + build OK; falta ejecucion manual |
| Calendar | Google auth simulado | PARCIAL | Backend implementado + build OK; falta prueba manual |
| Calendar | Google sync simulado | PARCIAL | Backend implementado + build OK; falta prueba manual |
| Calendar | Google events create/delete simulado | PARCIAL | Backend implementado + build OK; falta prueba manual |
| Plataforma | Compilacion produccion | SI | next build compila sin errores |
| Plataforma | Lint global | NO | Falla por configuracion ESLint circular preexistente |

## Resumen Ejecutivo
- Cuenta demo unica dedicada lista y funcional para demo comercial con gran volumen de datos.
- Integraciones externas criticas ya tienen rutas de simulacion en backend.
- Pendiente para cerrar certificacion total: smoke manual UI de flujos de integraciones (pagos/facturacion/calendar/mensajeria).

## Smoke UI Manual Ejecutado (2026-05-24)
Validado en local con login real de la cuenta demo:
- Email: demo.sales.20260523@agendamedpro.test
- Password: DemoSales2026!

### Rutas validadas (resultado)
| Ruta | Resultado | Evidencia observada |
|---|---|---|
| /leads | SI | Pipeline y listado poblado (Nuevo/Contactado/Calificado/Convertido/Perdido) con múltiples registros visibles. |
| /messaging | SI | KPIs no vacíos (enviados/entregados/leídos) y timeline de mensajes WhatsApp con estados mixtos. |
| /dashboard/notification-logs | SI | Tabla cargada con 140 logs, filtros activos y mezcla de canales/proveedores. |
| /dashboard/bookings | SI | Canal online poblado (55 total), cards y tabla de reservas con acciones Confirmar/Cancelar/Notas. |
| /book/demo-sales-20260523 | SI | Landing pública funcional con calendario habilitado, catálogo de servicios y formulario de reserva. |
| /inventory | SI | Inventario poblado (35 items), valor total, categorías, y alertas de stock bajo visibles. |
| /inventory/low-stock | SI | Vista crítica cargada con 6 items en reposición y detalle por faltante. |
| /intake-forms | SI | 4 formularios activos visibles con enlaces públicos y acceso a respuestas. |
| /nps | SI | 3 encuestas activas con score NPS y conteos de respuestas. |
| /documents | SI | 3 plantillas activas con firmas registradas y enlaces de firma pública. |
| /patients/:id (fotos) | SI | Galería de fotos no vacía en ficha de paciente (imágenes y metadatos de progreso). |
| /patients/:id (facturación) | SI | Sección de pendientes cargada + modal "Generar Factura (CFDI)" abre con campos fiscales completos (no en blanco). |
| /reports | SI | Dashboard financiero cargado con métricas, mix de pagos y bloque CFDI con datos simulados. |

### Hallazgos menores durante el smoke
- En varias navegaciones rápidas se observaron requests `HEAD ... net::ERR_ABORTED` a Supabase al cambiar de ruta; la UI terminó cargando correctamente en todos los casos validados.
- En /inventory/low-stock el primer render mostró 0 y luego actualizó a 6 items tras completar carga de datos.

## Pulido UX Final (2026-05-24)
Se aplicó una pasada final de experiencia demo para cerrar presentación comercial en rutas clave:

| Ruta | Estado | Ajuste aplicado |
|---|---|---|
| /promociones | SI | Búsqueda por texto, filtros por estatus y panel de métricas visibles para campañas. |
| /treatments | SI | Búsqueda rápida local, ordenamiento por margen/precio/nombre y conteo dinámico de resultados. |
| /dashboard/notification-logs | SI | Reestilizado con KPIs operativos, badges de estado más legibles y tabla con mejor señal visual. |
| /dashboard/settings/facturacion | SI | Flujo demo reforzado en modales de facturación (plantilla fiscal demo, resumen fiscal y control explícito de envío por email). |

## Estado de Hallazgo RLS `42P17`
- Hallazgo previamente detectado en logs de middleware para `public.users`.
- Mitigación aplicada en middleware + corrección raíz por migración SQL dedicada de políticas RLS.
- Verificación reciente en producción: sin recurrencia nueva del patrón `42P17` en ventana de validación post-deploy.

## Comandos Operativos
- Activar demo mode:
  - npm run demo:enable -- --user a1c99da8-08fc-411e-baf3-dc6bd5c1b02d --profile STANDARD --days 30 --by sales-ops
- Sembrar data masiva:
  - npm run demo:seed -- --user a1c99da8-08fc-411e-baf3-dc6bd5c1b02d --patients 80 --treatments 30 --inventory 60 --appointments 320 --records 220 --promotions 15 --fixed-expenses 24 --variable-expenses 120 --days-past 180 --days-future 60
- Reiniciar y volver a sembrar:
  - npm run demo:seed -- --user a1c99da8-08fc-411e-baf3-dc6bd5c1b02d --reset
