require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDoctors() {
  console.log('🔍 BUSCANDO TABLA DE DOCTORES\n');
  
  const userId = '86cbe61c-8829-41a2-aa29-81e11844f83e'; // Tu usuario

  // Intentar varias posibles tablas
  const possibleTables = [
    'doctors',
    'medicos',
    'team_doctors',
    'medical_staff',
    'staff',
    'employees',
    'colaboradores'
  ];

  for (const tableName of possibleTables) {
    try {
      console.log(`\n📊 Intentando tabla: ${tableName}`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .limit(5);

      if (!error && data) {
        console.log(`✅ ENCONTRADA! Tabla: ${tableName}`);
        console.log(`📝 Total registros: ${data.length}`);
        if (data.length > 0) {
          console.log(`\n🔍 Columnas disponibles:`, Object.keys(data[0]));
          console.log(`\n📄 Primer registro:`, JSON.stringify(data[0], null, 2));
        }
      }
    } catch (e) {
      console.log(`❌ Tabla ${tableName} no existe`);
    }
  }

  // También revisar team_members con más detalle
  console.log('\n\n📊 REVISANDO TEAM_MEMBERS en detalle:');
  const { data: teamData } = await supabase
    .from('team_members')
    .select('*')
    .or(`owner_user_id.eq.${userId},member_user_id.eq.${userId}`);
  
  if (teamData) {
    console.log(`Total: ${teamData.length} registros`);
    console.log('Columnas:', teamData.length > 0 ? Object.keys(teamData[0]) : 'N/A');
    teamData.forEach((member, i) => {
      console.log(`\n${i+1}. Email: ${member.member_email}`);
      console.log(`   Role: ${member.role}`);
      console.log(`   Status: ${member.status}`);
      console.log(`   Owner: ${member.owner_user_id}`);
      console.log(`   Member: ${member.member_user_id}`);
    });
  }
}

checkDoctors().catch(console.error);
