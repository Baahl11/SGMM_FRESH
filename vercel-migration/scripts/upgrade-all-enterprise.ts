/**
 * Script para dar plan Enterprise a TODOS los usuarios
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function upgradeAllToEnterprise() {
  console.log('🚀 Actualizando TODOS los usuarios a Plan Enterprise\n')
  
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()
  
  if (userError) {
    console.error('❌ Error:', userError)
    return
  }
  
  console.log(`📋 Total de usuarios: ${users.users.length}\n`)
  
  for (const user of users.users) {
    console.log(`========================================`)
    console.log(`👤 ${user.email}`)
    
    const enterpriseData = {
      user_id: user.id,
      stripe_customer_id: `admin_${user.id.slice(0, 8)}`,
      stripe_subscription_id: `admin_enterprise_${user.id.slice(0, 8)}`,
      stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || 'price_1SJ3wWCpe9CE4d2l9VzHo1Fp',
      plan_tier: 'enterprise',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      max_doctors: 999,
      max_locations: 999,
    }
    
    // Intentar actualizar primero
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(enterpriseData)
      .eq('user_id', user.id)
    
    if (updateError) {
      // Si falla, crear
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert(enterpriseData)
      
      if (insertError) {
        console.error(`   ❌ Error:`, insertError.message)
      } else {
        console.log(`   ✅ Creado: Enterprise (999/999)`)
      }
    } else {
      console.log(`   ✅ Actualizado: Enterprise (999/999)`)
    }
  }
  
  console.log('\n✅ ¡Listo! Todos los usuarios tienen Enterprise.')
}

upgradeAllToEnterprise()
