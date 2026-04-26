# SGMM - Roadmap de Brechas Reales (Merged)

Fecha: 2026-04-26
Base: auditoria de codigo real en `vercel-migration/` + benchmark MX/LATAM y global.
Referencia de benchmark: `ANALISIS_COMPETITIVO_COMPLETO_AGENDAS_MEDICAS.md`.

## Criterio de priorizacion
- Impacto negocio (adopcion, retencion, conversion)
- Riesgo operativo/compliance
- Esfuerzo de implementacion

## Horizonte 1 (Quick Wins: 2-4 semanas)

1) Portal paciente minimo viable
- Estado actual: pendiente
- Alcance minimo: proximas citas, reagendar/cancelar, recordatorios, perfil basico
- Impacto: alto (experiencia y retencion)

2) KPI dashboard operativo
- Estado actual: parcial
- Agregar: productividad por doctor, no-show por canal, LTV basico, cohortes trial->pago
- Impacto: alto (decision comercial)

3) Documentacion operativa unificada
- Estado actual: dispersa
- Accion: mantener 4-5 docs vivos y archivar legacy
- Impacto: medio-alto (velocidad de equipo)

4) Hardening de onboarding y paywall
- Estado actual: avanzado
- Accion: pruebas E2E para casos legacy trial, cancelacion y reactivacion
- Impacto: alto (ingresos)

## Horizonte 2 (1-2 trimestres)

1) Automatizacion de crecimiento
- Referral rewards real (no solo tracking)
- Campanas segmentadas por comportamiento

2) Inteligencia de agenda
- Prediccion de no-show
- Recomendacion de huecos y sobrecupo controlado

3) Integraciones operativas
- Webhooks salientes para CRM/ERP
- Mejoras de integracion externa de pagos/facturacion

4) Reporteria financiera avanzada
- Margen por tratamiento
- Rentabilidad por sucursal/doctor

## Horizonte 3 (6-12 meses)

1) IA clinica de mayor valor
- Notas clinicas estructuradas por voz
- Asistentes de resumen y cartas

2) Ecosistema paciente completo
- Documentos, consentimientos y seguimiento longitudinal
- Experiencia omnicanal paciente

3) Diferenciadores enterprise
- Multi-entidad avanzada, auditoria ampliada, analitica multi-clinica

## Riesgos a monitorear
- Deuda documental (si vuelve la dispersion)
- Brechas de compliance por cambios de facturacion
- Dependencia de flujos manuales en operaciones criticas

## Backlog inicial recomendado
- P0: portal paciente minimo + KPI dashboard operativo + pruebas E2E onboarding/paywall
- P1: referral rewards + webhooks salientes + rentabilidad por tratamiento
- P2: IA clinica avanzada + expansion enterprise
