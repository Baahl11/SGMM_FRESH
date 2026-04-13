require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeSecurityIssues() {
  console.log('🔍 ANALIZANDO ESTRUCTURA DE VISTAS Y TABLAS CON ERRORES DE SEGURIDAD\n');
  
  // 1. Obtener definición de las vistas con SECURITY DEFINER
  console.log('📋 1. VISTAS CON SECURITY DEFINER:\n');
  
  const views = [
    'deposit_analytics',
    'seller_commission_summary', 
    'platform_fees_summary',
    'pending_seller_payments'
  ];
  
  for (const viewName of views) {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `SELECT pg_get_viewdef('public.${viewName}'::regclass, true) as definition`
    }).maybeSingle();
    
    if (error) {
      // Intentar obtener de otra forma
      const { data: viewDef } = await supabase
        .from('pg_views')
        .select('definition')
        .eq('viewname', viewName)
        .eq('schemaname', 'public')
        .maybeSingle();
      
      if (viewDef) {
        console.log(`📄 ${viewName}:`);
        console.log(`   ${viewDef.definition}\n`);
      } else {
        console.log(`❌ ${viewName}: No se pudo obtener definición\n`);
      }
    } else if (data) {
      console.log(`📄 ${viewName}:`);
      console.log(`   ${data.definition}\n`);
    }
  }
  
  // 2. Verificar columnas de public_bookings
  console.log('\n📋 2. COLUMNAS DE public_bookings:\n');
  const { data: bookingCols } = await supabase
    .from('public_bookings')
    .select('*')
    .limit(1);
  
  if (bookingCols && bookingCols.length > 0) {
    console.log('   Columnas:', Object.keys(bookingCols[0]).join(', '));
  } else {
    // Obtener estructura sin datos
    const { data: colInfo } = await supabase.rpc('exec_sql', {
      sql: `SELECT column_name FROM information_schema.columns WHERE table_name = 'public_bookings' AND table_schema = 'public'`
    });
    console.log('   Columnas:', colInfo);
  }
  
  // 3. Verificar columnas de seller_commissions
  console.log('\n📋 3. COLUMNAS DE seller_commissions:\n');
  const { data: sellerCols } = await supabase
    .from('seller_commissions')
    .select('*')
    .limit(1);
  
  if (sellerCols && sellerCols.length > 0) {
    console.log('   Columnas:', Object.keys(sellerCols[0]).join(', '));
  }
  
  // 4. Verificar columnas de subscriptions
  console.log('\n📋 4. COLUMNAS DE subscriptions:\n');
  const { data: subCols } = await supabase
    .from('subscriptions')
    .select('*')
    .limit(1);
  
  if (subCols && subCols.length > 0) {
    console.log('   Columnas:', Object.keys(subCols[0]).join(', '));
  }
}

analyzeSecurityIssues().catch(console.error);
