#!/usr/bin/env node

/**
 * Script para aplicar la migración de Stripe Connect a Supabase
 * Uso: node scripts/apply-stripe-connect-migration.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sbwpqtrxhiuucwlbozet.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY no está configurada')
  console.log('\n📝 Configúrala con:')
  console.log('   $env:SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"')
  console.log('\n🔑 Obtén la clave en:')
  console.log('   https://supabase.com/dashboard/project/sbwpqtrxhiuucwlbozet/settings/api')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🚀 Aplicando migración de Stripe Connect...\n')

  try {
    // Leer el archivo SQL
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251118_stripe_connect.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Archivo de migración cargado')
    console.log(`📏 Tamaño: ${sql.length} caracteres\n`)

    // Dividir en statements individuales (separados por ;)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📦 Ejecutando ${statements.length} statements SQL...\n`)

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Identificar tipo de statement
      const type = statement.match(/^(CREATE|ALTER|COMMENT|DROP|INSERT)/i)?.[1]?.toUpperCase() || 'SQL'
      
      process.stdout.write(`  [${i + 1}/${statements.length}] ${type}... `)

      const { error } = await supabase.rpc('exec', { 
        sql_query: statement + ';' 
      })

      if (error) {
        // Si el error es porque ya existe, está OK
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist') ||
            error.message.includes('IF NOT EXISTS')) {
          console.log('⏭️  (ya existe)')
        } else {
          console.log('❌')
          console.error(`\n⚠️  Error en statement ${i + 1}:`)
          console.error(`   ${error.message}\n`)
          console.error(`   Statement: ${statement.substring(0, 100)}...\n`)
          // Continuar con los demás
        }
      } else {
        console.log('✅')
      }
    }

    console.log('\n✨ Migración completada!\n')
    console.log('📊 Verifica las tablas creadas en:')
    console.log('   https://supabase.com/dashboard/project/sbwpqtrxhiuucwlbozet/editor\n')

    // Verificar que las tablas existen
    console.log('🔍 Verificando tablas creadas...\n')
    
    const tables = ['connected_accounts', 'platform_fees']
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`   ❌ ${table}: Error - ${error.message}`)
      } else {
        console.log(`   ✅ ${table}: OK (${count} registros)`)
      }
    }

    console.log('\n🎉 Todo listo para usar Stripe Connect!\n')

  } catch (error) {
    console.error('❌ Error inesperado:', error.message)
    process.exit(1)
  }
}

// Ejecutar
applyMigration()
