# SGMM_FRESH Workspace

Este workspace contiene historico de varias etapas del producto.

## Sistema activo
La aplicacion activa es `vercel-migration/`.

- Stack actual: Next.js + Supabase
- Produccion: Vercel
- Pagos: Stripe (principal) + MercadoPago (soporte)
- Facturacion MX: Facturama / CFDI

## Estado de limpieza (2026-04-26)
Se inicio limpieza segura con estrategia `archive-first`.

- Archivo legado creado en: `archive/legacy-20260426/`
- Se movieron carpetas legacy de experimentos desktop/cloud y snapshots
- Se movieron logs legacy de instalacion/build MSI
- Se movieron docs obsoletos/snapshots en lotes controlados a `archive/legacy-20260426/docs-obsolete/`
- Trazabilidad de docs movidos: `archive/legacy-20260426/DOCS_MIGRATION_INDEX.md`
- No se modifico runtime del sistema activo en este paso

## Documentos consolidados de referencia
- `DOCS_ESTADO_REAL_MERGED.md`
- `ROADMAP_GAPS_MERGED.md`
- `vercel-migration/docs/CAPABILITY_MATRIX_2026.md`

## Regla operativa
- Cualquier cambio funcional se valida primero en `vercel-migration/`.
- Documentacion obsoleta se mueve a `archive/legacy-20260426/docs-obsolete/`.
- Evitar crear snapshots de estado duplicados; mantener docs vivos consolidados.
