# AgendaMedPro (vercel-migration)

Aplicacion web activa de SGMM_FRESH.

## Stack
- Next.js App Router
- Supabase (Auth + PostgreSQL + RLS)
- Stripe / MercadoPago
- Facturama (CFDI)

## Comandos basicos
```bash
npm install
npm run dev
npm run build
npm run lint
```

## Estructura clave
- `app/` rutas y paginas
- `app/api/` endpoints server
- `supabase/migrations/` migraciones de base de datos
- `docs/` documentacion tecnica activa

## Documentacion recomendada
- `docs/CAPABILITY_MATRIX_2026.md`
- `../DOCS_ESTADO_REAL_MERGED.md`
- `../ROADMAP_GAPS_MERGED.md`

## Nota
Este directorio es la fuente de verdad del producto actual. No tratarlo como carpeta experimental.
