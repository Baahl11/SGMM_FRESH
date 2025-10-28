# Migración: Email Tracking para Facturas

## Archivo
`supabase/migrations/20251020_add_emailed_at_to_invoices.sql`

## Contenido
```sql
-- Add emailed_at timestamp to track when invoices were sent by email
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ;

COMMENT ON COLUMN invoices.emailed_at IS 'Timestamp when the invoice was sent by email';
```

## Cómo Aplicar

### Opción 1: Supabase Dashboard (Recomendado)
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor" en el menú lateral
4. Copia y pega el SQL de arriba
5. Click en "Run"

### Opción 2: Supabase CLI
```bash
supabase db push
```

### Opción 3: Manual SQL
Ejecuta el siguiente comando SQL en tu base de datos:

```sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ;
COMMENT ON COLUMN invoices.emailed_at IS 'Timestamp when the invoice was sent by email';
```

## Verificación
Para verificar que la columna se agregó correctamente:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'invoices' AND column_name = 'emailed_at';
```

Deberías ver:
```
column_name | data_type                   | is_nullable
------------|----------------------------|------------
emailed_at  | timestamp with time zone    | YES
```

## Impacto
- ✅ NO afecta datos existentes
- ✅ Permite valor NULL (facturas antiguas no tendrán timestamp)
- ✅ Compatible con código actual
- ✅ Permite tracking de envío de emails

## Rollback (si es necesario)
```sql
ALTER TABLE invoices DROP COLUMN IF EXISTS emailed_at;
```
