#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

// Cliente con SERVICE_ROLE_KEY (bypassa RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const USER_ID = '86cbe61c-8829-41a2-aa29-81e11844f83e'

async function main() {
  console.log('🔍 Listando TODOS los usuarios en auth.users...\n')

  // Listar TODOS los usuarios
  const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('❌ Error al listar usuarios:', listError.message)
    process.exit(1)
  }

  console.log(`📋 Total de usuarios: ${allUsers.users.length}\n`)
  allUsers.users.forEach((u, i) => {
    console.log(`${i + 1}. ID: ${u.id}`)
    console.log(`   Email: ${u.email}`)
    console.log(`   Confirmado: ${u.email_confirmed_at ? 'Sí' : 'No'}`)
    console.log(`   Creado: ${u.created_at}\n`)
  })

  console.log('🔍 Verificando usuario específico...\n')

  // Verificar usuario
  const { data: user, error: userError } = await supabase.auth.admin.getUserById(USER_ID)

  if (userError) {
    console.error(`❌ Error al obtener usuario ${USER_ID}:`, userError.message)
    console.error('\n⚠️  El usuario NO EXISTE en este proyecto.')
    console.error('   Opciones:')
    console.error('   1. Crear el usuario en ESTE proyecto (sbwpqtrxhiuucwlbozet)')
    console.error('   2. Verificar que estás en el proyecto correcto')
    process.exit(1)
  }

  if (!user) {
    console.error(`❌ Usuario ${USER_ID} NO EXISTE en auth.users`)
    process.exit(1)
  }

  console.log('✅ Usuario encontrado:')
  console.log(`   - ID: ${user.user.id}`)
  console.log(`   - Email: ${user.user.email}`)
  console.log(`   - Email confirmado: ${user.user.email_confirmed_at ? 'Sí' : 'No'}`)
  console.log(`   - Creado: ${user.user.created_at}\n`)

  // Si el email no está confirmado, confirmarlo
  if (!user.user.email_confirmed_at) {
    console.log('⏳ Confirmando email...')
    const { error: updateError } = await supabase.auth.admin.updateUserById(USER_ID, {
      email_confirm: true
    })
    if (updateError) {
      console.error('❌ Error al confirmar email:', updateError.message)
    } else {
      console.log('✅ Email confirmado\n')
    }
  }

  console.log('🌱 Ejecutando seed data...\n')

  // 1. Verificar si ya existe doctor
  const { data: existingDoctor } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', USER_ID)
    .single()

  let doctorId

  if (existingDoctor) {
    console.log('ℹ️  Doctor ya existe, usando ID existente:', existingDoctor.id)
    doctorId = existingDoctor.id
  } else {
    // Crear doctor
    const { data: newDoctor, error: doctorError } = await supabase
      .from('doctors')
      .insert({
        user_id: USER_ID,
        nombre: 'Dr. Juan Pérez',
        especialidad: 'Medicina General',
        color: '#3b82f6',
        activo: true
      })
      .select('id')
      .single()

    if (doctorError) {
      console.error('❌ Error al crear doctor:', doctorError.message)
      process.exit(1)
    }

    doctorId = newDoctor.id
    console.log('✅ Doctor creado con ID:', doctorId)
  }

  // 2. Verificar si ya existe consultorio
  const { data: existingConsultorio } = await supabase
    .from('consultorios')
    .select('id')
    .eq('user_id', USER_ID)
    .single()

  let consultorioId

  if (existingConsultorio) {
    console.log('ℹ️  Consultorio ya existe, usando ID existente:', existingConsultorio.id)
    consultorioId = existingConsultorio.id
  } else {
    // Crear consultorio
    const { data: newConsultorio, error: consultorioError } = await supabase
      .from('consultorios')
      .insert({
        user_id: USER_ID,
        nombre: 'Consultorio Principal',
        ubicacion: 'Planta Baja - Sala 101',
        activo: true
      })
      .select('id')
      .single()

    if (consultorioError) {
      console.error('❌ Error al crear consultorio:', consultorioError.message)
      process.exit(1)
    }

    consultorioId = newConsultorio.id
    console.log('✅ Consultorio creado con ID:', consultorioId)
  }

  // 3. Crear tipos de cita (si no existen)
  const appointmentTypes = [
    { nombre: 'Consulta General', duracion_minutos: 30, color: '#10b981' },
    { nombre: 'Seguimiento', duracion_minutos: 20, color: '#3b82f6' },
    { nombre: 'Procedimiento', duracion_minutos: 60, color: '#f59e0b' },
    { nombre: 'Urgencia', duracion_minutos: 15, color: '#ef4444' }
  ]

  for (const type of appointmentTypes) {
    const { data: existing } = await supabase
      .from('appointment_types')
      .select('id')
      .eq('user_id', USER_ID)
      .eq('nombre', type.nombre)
      .single()

    if (!existing) {
      const { error: typeError } = await supabase
        .from('appointment_types')
        .insert({ ...type, user_id: USER_ID, activo: true })

      if (typeError) {
        console.error(`❌ Error al crear tipo "${type.nombre}":`, typeError.message)
      } else {
        console.log(`✅ Tipo de cita "${type.nombre}" creado`)
      }
    } else {
      console.log(`ℹ️  Tipo "${type.nombre}" ya existe`)
    }
  }

  // 4. Crear horarios del doctor (Lunes a Viernes 09:00-18:00)
  const dias = [1, 2, 3, 4, 5] // Lunes a Viernes

  for (const dia of dias) {
    const { data: existing } = await supabase
      .from('doctor_schedules')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('dia_semana', dia)
      .single()

    if (!existing) {
      const { error: scheduleError } = await supabase
        .from('doctor_schedules')
        .insert({
          doctor_id: doctorId,
          user_id: USER_ID,
          dia_semana: dia,
          hora_inicio: '09:00:00',
          hora_fin: '18:00:00',
          activo: true
        })

      if (scheduleError) {
        console.error(`❌ Error al crear horario día ${dia}:`, scheduleError.message)
      } else {
        console.log(`✅ Horario creado para día ${dia}`)
      }
    } else {
      console.log(`ℹ️  Horario día ${dia} ya existe`)
    }
  }

  console.log('\n✅ SEED DATA COMPLETADO')
  console.log('\n📊 Resumen:')

  // Contar registros
  const { count: doctorsCount } = await supabase
    .from('doctors')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)

  const { count: consultoriosCount } = await supabase
    .from('consultorios')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)

  const { count: typesCount } = await supabase
    .from('appointment_types')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)

  const { count: schedulesCount } = await supabase
    .from('doctor_schedules')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)

  console.log(`   - Doctores: ${doctorsCount}`)
  console.log(`   - Consultorios: ${consultoriosCount}`)
  console.log(`   - Tipos de cita: ${typesCount}`)
  console.log(`   - Horarios: ${schedulesCount}`)
}

main().catch(console.error)
