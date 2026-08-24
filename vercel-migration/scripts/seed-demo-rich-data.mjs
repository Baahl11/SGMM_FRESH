#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local'), quiet: true })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

function readArg(flag, fallback = null) {
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return fallback
  return process.argv[idx + 1] || fallback
}

function hasFlag(flag) {
  return process.argv.includes(flag)
}

function parsePositiveInt(flag, fallback) {
  const raw = readArg(flag, String(fallback))
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) {
    console.error(`${flag} must be a valid non-negative number`)
    process.exit(1)
  }
  return Math.floor(value)
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(array) {
  return array[randInt(0, array.length - 1)]
}

function randomDateBetween(start, end) {
  const startMs = start.getTime()
  const endMs = end.getTime()
  const sampled = randInt(startMs, endMs)
  return new Date(sampled)
}

function chunk(array, size) {
  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

function uniqueBy(array, keyFn) {
  const seen = new Set()
  const out = []
  for (const item of array) {
    const key = keyFn(item)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

async function resolveUserId(inputUserId, inputEmail) {
  if (inputUserId) {
    if (!isUuid(inputUserId)) {
      throw new Error('--user must be a valid UUID')
    }

    const { data, error } = await supabase.auth.admin.getUserById(inputUserId)
    if (error || !data?.user) {
      throw new Error(`User not found by id: ${inputUserId}`)
    }

    return { userId: data.user.id, email: data.user.email || null }
  }

  if (inputEmail) {
    const target = inputEmail.trim().toLowerCase()
    const allUsers = []
    let page = 1
    const perPage = 200

    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
      if (error) throw new Error(`Cannot list auth users: ${error.message}`)

      const users = data?.users || []
      allUsers.push(...users)

      if (users.length < perPage) break
      page += 1
    }

    const match = allUsers.find((u) => (u.email || '').toLowerCase() === target)
    if (!match) {
      throw new Error(`User not found by email: ${inputEmail}`)
    }

    return { userId: match.id, email: match.email || null }
  }

  throw new Error('Provide --user <UUID> or --email <user@example.com>')
}

async function maybeResetDemoData(userId) {
  const deleteOrder = [
    'invoice_records',
    'invoices',
    'patient_fiscal_data',
    'facturama_config',
    'document_signatures',
    'document_templates',
    'nps_responses',
    'nps_surveys',
    'intake_responses',
    'intake_forms',
    'patient_photos',
    'notification_logs',
    'whatsapp_messages',
    'messaging_config',
    'public_bookings',
    'booking_settings',
    'lead_notes',
    'leads',
    'inventory_movements',
    'treatment_inventory_items',
    'promotion_treatments',
    'promotions',
    'records',
    'appointments',
    'variable_expenses',
    'gastos_fijos',
    'inventory_items',
    'treatments',
    'doctor_schedules',
    'appointment_types',
    'consultorios',
    'doctors',
    'patients',
  ]

  for (const table of deleteOrder) {
    let query = supabase.from(table).delete()

    if (table === 'promotion_treatments') {
      const { data: ownedPromotions } = await supabase
        .from('promotions')
        .select('id')
        .eq('user_id', userId)

      const promotionIds = (ownedPromotions || []).map((row) => row.id)
      if (promotionIds.length === 0) continue
      query = query.in('promotion_id', promotionIds)
    } else if (table === 'invoice_records') {
      const { data: userInvoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('created_by', userId)

      const invoiceIds = (userInvoices || []).map((row) => row.id)
      if (invoiceIds.length === 0) continue
      query = query.in('invoice_id', invoiceIds)
    } else if (table === 'invoices') {
      query = query.eq('created_by', userId)
    } else if (table === 'patient_fiscal_data') {
      const { data: ownedPatients } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', userId)

      const patientIds = (ownedPatients || []).map((row) => row.id)
      if (patientIds.length === 0) continue
      query = query.in('patient_id', patientIds)
    } else if (table === 'document_signatures') {
      const { data: templates } = await supabase
        .from('document_templates')
        .select('id')
        .eq('user_id', userId)

      const templateIds = (templates || []).map((row) => row.id)
      if (templateIds.length === 0) continue
      query = query.in('template_id', templateIds)
    } else if (table === 'nps_responses') {
      const { data: surveys } = await supabase
        .from('nps_surveys')
        .select('id')
        .eq('user_id', userId)

      const surveyIds = (surveys || []).map((row) => row.id)
      if (surveyIds.length === 0) continue
      query = query.in('survey_id', surveyIds)
    } else if (table === 'intake_responses') {
      const { data: forms } = await supabase
        .from('intake_forms')
        .select('id')
        .eq('user_id', userId)

      const formIds = (forms || []).map((row) => row.id)
      if (formIds.length === 0) continue
      query = query.in('form_id', formIds)
    } else if (table === 'public_bookings') {
      query = query.eq('clinic_user_id', userId)
    } else {
      query = query.eq('user_id', userId)
    }

    const { error } = await query
    if (error) {
      console.warn(`Warning: reset failed on table ${table}: ${error.message}`)
    }
  }
}

async function ensureDoctors(userId, count) {
  const { data: existing, error } = await supabase
    .from('doctors')
    .select('id, nombre')
    .eq('user_id', userId)

  if (error) throw new Error(`Error loading doctors: ${error.message}`)

  const rows = [...(existing || [])]
  const palette = ['#3b82f6', '#22c55e', '#f97316', '#ec4899', '#6366f1', '#14b8a6']

  while (rows.length < count) {
    const idx = rows.length + 1
    const { data: created, error: insertError } = await supabase
      .from('doctors')
      .insert({
        user_id: userId,
        nombre: `Dr Demo ${idx}`,
        especialidad: idx % 2 === 0 ? 'Dermatologia' : 'Medicina estetica',
        color: palette[idx % palette.length],
        activo: true,
      })
      .select('id, nombre')
      .single()

    if (insertError || !created) {
      throw new Error(`Error creating doctor: ${insertError?.message || 'unknown'}`)
    }

    rows.push(created)
  }

  return rows
}

async function ensureConsultorios(userId, count) {
  const { data: existing, error } = await supabase
    .from('consultorios')
    .select('id, nombre')
    .eq('user_id', userId)

  if (error) throw new Error(`Error loading consultorios: ${error.message}`)

  const rows = [...(existing || [])]

  while (rows.length < count) {
    const idx = rows.length + 1
    const { data: created, error: insertError } = await supabase
      .from('consultorios')
      .insert({
        user_id: userId,
        nombre: `Consultorio Demo ${idx}`,
        ubicacion: `Piso ${Math.ceil(idx / 2)} - Sala ${100 + idx}`,
        activo: true,
      })
      .select('id, nombre')
      .single()

    if (insertError || !created) {
      throw new Error(`Error creating consultorio: ${insertError?.message || 'unknown'}`)
    }

    rows.push(created)
  }

  return rows
}

async function ensureAppointmentTypes(userId) {
  const base = [
    { nombre: 'Consulta valoracion', duracion_minutos: 30, color: '#3b82f6' },
    { nombre: 'Seguimiento clinico', duracion_minutos: 20, color: '#22c55e' },
    { nombre: 'Aplicacion toxina', duracion_minutos: 45, color: '#f97316' },
    { nombre: 'Aplicacion relleno', duracion_minutos: 60, color: '#ec4899' },
    { nombre: 'Limpieza facial', duracion_minutos: 50, color: '#14b8a6' },
  ]

  const { data: existing, error } = await supabase
    .from('appointment_types')
    .select('id, nombre, duracion_minutos')
    .eq('user_id', userId)

  if (error) throw new Error(`Error loading appointment types: ${error.message}`)

  const rows = [...(existing || [])]
  const existingNames = new Set(rows.map((row) => row.nombre.toLowerCase()))

  for (const row of base) {
    if (existingNames.has(row.nombre.toLowerCase())) continue

    const { data: created, error: insertError } = await supabase
      .from('appointment_types')
      .insert({
        ...row,
        user_id: userId,
        activo: true,
      })
      .select('id, nombre, duracion_minutos')
      .single()

    if (insertError || !created) {
      throw new Error(`Error creating appointment type: ${insertError?.message || 'unknown'}`)
    }

    rows.push(created)
  }

  return rows
}

async function ensureDoctorSchedules(userId, doctors) {
  for (const doctor of doctors) {
    for (const day of [1, 2, 3, 4, 5, 6]) {
      const { data: existing, error: checkError } = await supabase
        .from('doctor_schedules')
        .select('id')
        .eq('user_id', userId)
        .eq('doctor_id', doctor.id)
        .eq('dia_semana', day)
        .maybeSingle()

      if (checkError) {
        throw new Error(`Error loading doctor schedule: ${checkError.message}`)
      }

      if (existing) continue

      const { error: insertError } = await supabase
        .from('doctor_schedules')
        .insert({
          user_id: userId,
          doctor_id: doctor.id,
          dia_semana: day,
          hora_inicio: day === 6 ? '09:00:00' : '08:30:00',
          hora_fin: day === 6 ? '14:00:00' : '18:30:00',
          activo: true,
        })

      if (insertError) {
        throw new Error(`Error creating doctor schedule: ${insertError.message}`)
      }
    }
  }
}

async function ensurePatients(userId, targetCount) {
  const { data: existing, error } = await supabase
    .from('patients')
    .select('id, nombre, apellido, telefono, email')
    .eq('user_id', userId)

  if (error) throw new Error(`Error loading patients: ${error.message}`)

  const rows = [...(existing || [])]
  const firstNames = ['Ana', 'Luis', 'Carla', 'Jorge', 'Maria', 'Diana', 'Carlos', 'Elena', 'Pablo', 'Sofia']
  const lastNames = ['Garcia', 'Lopez', 'Hernandez', 'Martinez', 'Ramirez', 'Santos', 'Castillo', 'Gomez']

  while (rows.length < targetCount) {
    const idx = rows.length + 1
    const nombre = pick(firstNames)
    const apellido = `${pick(lastNames)} ${pick(lastNames)}`

    const { data: created, error: insertError } = await supabase
      .from('patients')
      .insert({
        user_id: userId,
        nombre,
        apellido,
        telefono: `55${String(10000000 + idx).slice(-8)}`,
        email: `demo.patient.${idx}@agendamedpro.test`,
        direccion: `Calle Demo ${idx}, CDMX`,
        notas: 'Paciente generado para demo comercial',
        activo: true,
      })
      .select('id, nombre, apellido, telefono, email')
      .single()

    if (insertError || !created) {
      throw new Error(`Error creating patient: ${insertError?.message || 'unknown'}`)
    }

    rows.push(created)
  }

  return rows
}

async function ensureTreatments(userId, targetCount) {
  const { data: existing, error } = await supabase
    .from('treatments')
    .select('id, nombre, precio_base, costo_unitario, duracion_minutos')
    .eq('user_id', userId)

  if (error) throw new Error(`Error loading treatments: ${error.message}`)

  const rows = [...(existing || [])]
  const baseNames = [
    'Botox full face',
    'Acido hialuronico labios',
    'Profilaxis facial',
    'Mesoterapia capilar',
    'Hydrafacial premium',
    'Skin booster',
    'Radiofrecuencia facial',
    'Peeling quimico',
    'Microneedling',
    'Bioestimulador colageno',
  ]

  while (rows.length < targetCount) {
    const idx = rows.length + 1
    const base = baseNames[idx % baseNames.length]
    const price = randInt(900, 6900)
    const cost = Math.round(price * (0.28 + Math.random() * 0.22))

    const { data: created, error: insertError } = await supabase
      .from('treatments')
      .insert({
        user_id: userId,
        nombre: `${base} #${idx}`,
        descripcion: 'Tratamiento de demo para pruebas comerciales',
        precio_base: price,
        costo_unitario: cost,
        duracion_minutos: pick([20, 30, 45, 60, 75]),
        activo: true,
        category: pick(['facial', 'corporal', 'inyectable', 'laser']),
        tags: ['demo', 'comercial'],
      })
      .select('id, nombre, precio_base, costo_unitario, duracion_minutos')
      .single()

    if (insertError || !created) {
      throw new Error(`Error creating treatment: ${insertError?.message || 'unknown'}`)
    }

    rows.push(created)
  }

  return rows
}

async function ensureInventoryItems(userId, targetCount) {
  const inventoryCatalog = [
    { nombre: 'Toxina botulinica 100U', descripcion: 'Frasco de toxina para aplicaciones faciales', price: [2800, 4200], min: [4, 12], max: [24, 42] },
    { nombre: 'Acido hialuronico 1ml', descripcion: 'Relleno dermico monofasico', price: [1500, 2800], min: [6, 14], max: [35, 65] },
    { nombre: 'Jeringa 1ml Luer Lock', descripcion: 'Jeringa esteril de precision', price: [8, 22], min: [30, 60], max: [180, 320] },
    { nombre: 'Aguja 30G x 13mm', descripcion: 'Aguja para procedimientos inyectables', price: [4, 15], min: [40, 80], max: [220, 420] },
    { nombre: 'Canula 25G 50mm', descripcion: 'Canula roma para rellenos', price: [65, 140], min: [12, 25], max: [70, 140] },
    { nombre: 'Guantes nitrilo talla M', descripcion: 'Caja con 100 piezas', price: [95, 220], min: [10, 25], max: [80, 150] },
    { nombre: 'Cubrebocas quirurgico', descripcion: 'Caja con 50 piezas tricapa', price: [45, 120], min: [14, 32], max: [100, 220] },
    { nombre: 'Toallitas antisepticas', descripcion: 'Paquete para limpieza preprocedimiento', price: [35, 90], min: [18, 30], max: [90, 180] },
    { nombre: 'Solucion desinfectante clinica', descripcion: 'Concentrado para superficies', price: [120, 320], min: [5, 12], max: [22, 50] },
    { nombre: 'Gasa esteril 10x10', descripcion: 'Paquete de gasas para curacion', price: [38, 95], min: [20, 45], max: [120, 240] },
    { nombre: 'Skin booster hidratante', descripcion: 'Ampolleta de hidratacion intensiva', price: [900, 1800], min: [8, 16], max: [30, 70] },
    { nombre: 'Vitamina C inyectable', descripcion: 'Ampolletas para mesoterapia', price: [280, 740], min: [10, 18], max: [45, 95] },
    { nombre: 'Peeling quimico suave', descripcion: 'Solucion despigmentante controlada', price: [240, 640], min: [7, 15], max: [35, 75] },
    { nombre: 'Gel conductor radiofrecuencia', descripcion: 'Gel hipoalergenico para aparatologia', price: [140, 320], min: [6, 14], max: [26, 56] },
    { nombre: 'Crema reparadora post-procedimiento', descripcion: 'Uso posterior a tratamiento laser', price: [160, 420], min: [9, 18], max: [34, 72] },
    { nombre: 'Serum calmante dermocosmetico', descripcion: 'Suero para recuperacion de barrera cutanea', price: [190, 450], min: [8, 17], max: [28, 60] },
    { nombre: 'Microagujas cartucho 12 pin', descripcion: 'Cartucho desechable para microneedling', price: [50, 140], min: [16, 32], max: [90, 180] },
    { nombre: 'Lidocaina topica', descripcion: 'Anestesico topico previo a procedimiento', price: [120, 320], min: [7, 14], max: [34, 72] },
    { nombre: 'Biostimulador de colageno', descripcion: 'Vial para bioestimulacion inyectable', price: [2200, 3900], min: [3, 8], max: [18, 36] },
    { nombre: 'Relleno de menton 1ml', descripcion: 'Relleno de alta densidad para perfilado', price: [1500, 2900], min: [5, 12], max: [25, 52] },
  ]

  const { data: existing, error } = await supabase
    .from('inventory_items')
    .select('id, nombre, descripcion, stock_actual, stock_minimo, stock_maximo, precio_unitario, activo')
    .eq('user_id', userId)

  if (error) throw new Error(`Error loading inventory items: ${error.message}`)

  const rows = [...(existing || [])]

  while (rows.length < targetCount) {
    const idx = rows.length
    const catalog = inventoryCatalog[idx % inventoryCatalog.length]
    const stockMinimo = randInt(catalog.min[0], catalog.min[1])
    const stockMaximo = randInt(catalog.max[0], catalog.max[1])

    let stockActual
    if (idx % 5 === 0) {
      stockActual = randInt(Math.max(0, Math.floor(stockMinimo * 0.2)), Math.max(1, Math.floor(stockMinimo * 0.85)))
    } else if (idx % 5 === 1) {
      stockActual = randInt(stockMinimo, Math.min(stockMinimo + 10, stockMaximo))
    } else if (idx % 5 === 2) {
      stockActual = randInt(stockMinimo + 8, Math.max(stockMinimo + 12, Math.floor(stockMaximo * 0.5)))
    } else {
      stockActual = randInt(Math.max(stockMinimo + 12, Math.floor(stockMaximo * 0.55)), stockMaximo)
    }

    const { data: created, error: insertError } = await supabase
      .from('inventory_items')
      .insert({
        user_id: userId,
        nombre: `${catalog.nombre} ${Math.floor(idx / inventoryCatalog.length) + 1}`,
        descripcion: catalog.descripcion,
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
        stock_maximo: stockMaximo,
        precio_unitario: randInt(catalog.price[0], catalog.price[1]),
        activo: true,
      })
      .select('id, nombre, descripcion, stock_actual, stock_minimo, stock_maximo, precio_unitario, activo')
      .single()

    if (insertError || !created) {
      throw new Error(`Error creating inventory item: ${insertError?.message || 'unknown'}`)
    }

    rows.push(created)
  }

  // Rebalance existing items so dashboard does not look flat at 100% stock everywhere.
  const reshuffled = rows.map((item, idx) => {
    const stockMinimo = Math.max(1, Number(item.stock_minimo || randInt(6, 18)))
    const stockMaximo = Math.max(stockMinimo + 20, Number(item.stock_maximo || randInt(60, 160)))

    let stockActual
    if (idx % 6 === 0) {
      stockActual = randInt(Math.max(0, Math.floor(stockMinimo * 0.1)), Math.max(1, Math.floor(stockMinimo * 0.75)))
    } else if (idx % 6 === 1) {
      stockActual = randInt(stockMinimo, Math.min(stockMinimo + 8, stockMaximo))
    } else {
      stockActual = randInt(Math.max(stockMinimo + 4, Math.floor(stockMaximo * 0.35)), stockMaximo)
    }

    return {
      ...item,
      stock_actual: stockActual,
      stock_minimo: stockMinimo,
      stock_maximo: stockMaximo,
    }
  })

  for (const item of reshuffled) {
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({
        stock_actual: item.stock_actual,
        stock_minimo: item.stock_minimo,
        stock_maximo: item.stock_maximo,
      })
      .eq('id', item.id)
      .eq('user_id', userId)

    if (updateError) {
      console.warn(`Warning: inventory rebalance failed for ${item.id}: ${updateError.message}`)
    }
  }

  return reshuffled
}

async function createPromotions(userId, treatments, targetCount) {
  if (treatments.length === 0 || targetCount === 0) return []

  const { data: existing, error } = await supabase
    .from('promotions')
    .select('id, nombre')
    .eq('user_id', userId)

  if (error) throw new Error(`Error loading promotions: ${error.message}`)

  const rows = [...(existing || [])]
  let createdCount = 0

  while (createdCount < targetCount) {
    const idx = rows.length + 1
    const sample = uniqueBy(
      [pick(treatments), pick(treatments), pick(treatments)],
      (item) => item.id
    )

    const bundlePrice = sample.reduce((sum, item) => sum + Number(item.precio_base || 0), 0)
    const promoPrice = Math.round(bundlePrice * 0.82)

    const { data: promotion, error: promotionError } = await supabase
      .from('promotions')
      .insert({
        user_id: userId,
        nombre: `Promo Demo ${idx}`,
        descripcion: 'Paquete promocional de demo',
        precio_total: promoPrice,
        descuento_porcentaje: 18,
        activo: true,
      })
      .select('id, nombre')
      .single()

    if (promotionError || !promotion) {
      throw new Error(`Error creating promotion: ${promotionError?.message || 'unknown'}`)
    }

    const lines = sample.map((treatment) => ({
      promotion_id: promotion.id,
      treatment_id: treatment.id,
      cantidad: randInt(1, 2),
    }))

    const { error: lineError } = await supabase
      .from('promotion_treatments')
      .insert(lines)

    if (lineError) {
      throw new Error(`Error creating promotion_treatments: ${lineError.message}`)
    }

    rows.push(promotion)
    createdCount += 1
  }

  return rows
}

async function createAppointments({
  userId,
  patients,
  treatments,
  doctors,
  consultorios,
  appointmentTypes,
  targetCount,
  daysPast,
  daysFuture,
}) {
  if (targetCount === 0) return []

  const now = new Date()
  const start = new Date(now.getTime() - daysPast * 24 * 60 * 60 * 1000)
  const end = new Date(now.getTime() + daysFuture * 24 * 60 * 60 * 1000)

  const payload = []

  for (let i = 0; i < targetCount; i += 1) {
    const patient = pick(patients)
    const treatment = pick(treatments)
    const doctor = pick(doctors)
    const consultorio = pick(consultorios)
    const type = pick(appointmentTypes)
    const date = randomDateBetween(start, end)

    let estado = 'programada'
    if (date < now) {
      estado = pick(['completada', 'confirmada', 'cancelada'])
    } else {
      estado = pick(['programada', 'confirmada'])
    }

    payload.push({
      user_id: userId,
      patient_id: patient.id,
      treatment_id: treatment.id,
      doctor_id: doctor.id,
      consultorio_id: consultorio.id,
      appointment_type_id: type.id,
      fecha_hora: date.toISOString(),
      duracion_minutos: Number(type.duracion_minutos || treatment.duracion_minutos || 30),
      estado,
      notas: 'Cita creada automaticamente para demo',
      precio_acordado: Number(treatment.precio_base || 0),
    })
  }

  for (const batch of chunk(payload, 200)) {
    const { error } = await supabase.from('appointments').insert(batch)
    if (error) {
      throw new Error(`Error creating appointments: ${error.message}`)
    }
  }

  const { data: created, error: loadError } = await supabase
    .from('appointments')
    .select('id, patient_id, treatment_id, fecha_hora, estado')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(targetCount)

  if (loadError) throw new Error(`Error loading created appointments: ${loadError.message}`)
  return created || []
}

async function detectRecordColumnSupport() {
  const support = {
    treatment_name: false,
    price: false,
    cantidad: false,
    pendiente_facturar: false,
  }

  for (const column of Object.keys(support)) {
    const { error } = await supabase
      .from('records')
      .select(column)
      .limit(1)

    support[column] = !error
  }

  return support
}

async function createRecords(userId, appointments, treatments, targetCount, columnSupport) {
  if (targetCount === 0) return []

  const completedAppointments = (appointments || []).filter((a) => a.estado === 'completada')
  const source = completedAppointments.length > 0 ? completedAppointments : appointments
  if (!source || source.length === 0) return []

  const payload = []

  for (let i = 0; i < targetCount; i += 1) {
    const apt = pick(source)
    const treatment = treatments.find((t) => t.id === apt.treatment_id) || pick(treatments)
    const paid = Number(treatment.precio_base || randInt(900, 3500))
    const cost = Number(treatment.costo_unitario || Math.round(paid * 0.35))

    const row = {
      user_id: userId,
      patient_id: apt.patient_id,
      treatment_id: treatment.id,
      fecha: apt.fecha_hora || new Date().toISOString(),
      monto_pagado: paid,
      monto_neto: paid,
      costo_unitario: cost,
      ganancia: paid - cost,
      metodo_pago: pick(['efectivo', 'tarjeta', 'transferencia']),
      tipo_tarjeta: pick(['credito', 'debito', null]),
      meses_sin_intereses: pick([0, 0, 0, 3, 6]),
      tasa_comision: pick([0, 2.9, 3.6]),
      comision_monto: pick([0, Math.round(paid * 0.029)]),
      notas: 'Registro financiero generado para demo',
    }

    if (columnSupport.treatment_name) row.treatment_name = treatment.nombre
    if (columnSupport.price) row.price = paid
    if (columnSupport.cantidad) row.cantidad = pick([1, 1, 1, 2])
    if (columnSupport.pendiente_facturar) {
      row.pendiente_facturar = row.metodo_pago === 'efectivo' ? false : Math.random() > 0.45
    }

    payload.push(row)
  }

  for (const batch of chunk(payload, 200)) {
    const { error } = await supabase.from('records').insert(batch)
    if (error) {
      throw new Error(`Error creating records: ${error.message}`)
    }
  }

  const { data, error: loadError } = await supabase
    .from('records')
    .select('id, patient_id, treatment_id, fecha, monto_pagado, metodo_pago')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(targetCount)

  if (loadError) throw new Error(`Error loading records: ${loadError.message}`)
  return data || []
}

async function createFixedExpenses(userId, targetCount) {
  if (targetCount === 0) return []

  const conceptos = [
    'Renta clinica',
    'Internet y telefonia',
    'Sueldos asistentes',
    'Software administrativo',
    'Servicio de limpieza',
    'Mantenimiento equipo',
  ]

  const payload = []
  for (let i = 0; i < targetCount; i += 1) {
    const concepto = `${pick(conceptos)} ${i + 1}`
    payload.push({
      user_id: userId,
      concepto,
      monto: randInt(1200, 26000),
      frecuencia: pick(['mensual', 'quincenal', 'anual']),
      activo: true,
      fecha_inicio: new Date(Date.now() - randInt(30, 500) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      notas: 'Gasto fijo de demo',
    })
  }

  for (const batch of chunk(payload, 200)) {
    const { error } = await supabase.from('gastos_fijos').insert(batch)
    if (error) {
      throw new Error(`Error creating fixed expenses: ${error.message}`)
    }
  }

  return payload
}

async function createVariableExpenses(userId, targetCount, daysPast) {
  if (targetCount === 0) return []

  const categorias = [
    'insumos_extraordinarios',
    'marketing',
    'tecnologia',
    'reparacion',
    'servicios_profesionales',
    'otros',
  ]

  const conceptos = [
    'Compra de guantes',
    'Campana redes sociales',
    'Reparacion laser',
    'Pago fotografia clinica',
    'Capacitacion equipo',
    'Licencia adicional software',
  ]

  const start = new Date(Date.now() - Math.max(daysPast, 30) * 24 * 60 * 60 * 1000)
  const end = new Date()

  const payload = []

  for (let i = 0; i < targetCount; i += 1) {
    const fecha = randomDateBetween(start, end).toISOString().slice(0, 10)
    payload.push({
      user_id: userId,
      concepto: `${pick(conceptos)} ${i + 1}`,
      descripcion: 'Gasto variable de demo comercial',
      categoria: pick(categorias),
      monto: randInt(300, 12500),
      fecha,
      metodo_pago: pick(['efectivo', 'tarjeta', 'transferencia', 'cheque']),
      proveedor: `Proveedor Demo ${randInt(1, 20)}`,
      proveedor_rfc: null,
      proveedor_telefono: null,
      proveedor_email: null,
      factura_numero: null,
      factura_url: null,
      factura_tipo: pick(['fiscal', 'simple', 'ninguna']),
      es_deducible: Math.random() > 0.25,
      notas: 'Registro para tablero de gastos demo',
      tags: ['demo', 'ops'],
      estado: pick(['pendiente', 'aprobado', 'pagado']),
    })
  }

  for (const batch of chunk(payload, 200)) {
    const { error } = await supabase.from('variable_expenses').insert(batch)
    if (error) {
      throw new Error(`Error creating variable expenses: ${error.message}`)
    }
  }

  return payload
}

function slugifyForBooking(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function ensureProfileAndBookingSettings(userId, userEmail, treatments) {
  const { data: existingProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileError && profileError.code !== 'PGRST116') {
    throw new Error(`Error loading user profile: ${profileError.message}`)
  }

  const seedBase = existingProfile?.booking_slug
    || existingProfile?.clinic_name
    || existingProfile?.name
    || userEmail
    || `clinica-${userId.slice(0, 8)}`

  let bookingSlug = existingProfile?.booking_slug || slugifyForBooking(seedBase) || `clinica-${userId.slice(0, 8)}`

  if (!existingProfile?.booking_slug) {
    let attempts = 0
    let candidate = bookingSlug
    while (attempts < 20) {
      const { data: duplicate, error: dupError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('booking_slug', candidate)
        .neq('user_id', userId)
        .maybeSingle()

      if (dupError && dupError.code !== 'PGRST116') {
        throw new Error(`Error checking booking slug: ${dupError.message}`)
      }

      if (!duplicate) {
        bookingSlug = candidate
        break
      }

      attempts += 1
      candidate = `${bookingSlug}-${attempts}`
    }
  }

  const profilePatch = {
    name: existingProfile?.name || 'Dra. Demo Comercial',
    email: existingProfile?.email || userEmail || null,
    booking_slug: bookingSlug,
    booking_enabled: true,
    specialty: existingProfile?.specialty || 'Medicina estetica',
    clinic_name: existingProfile?.clinic_name || 'Clinica Aura Demo',
    clinic_address: existingProfile?.clinic_address || 'Av. Reforma 123, CDMX',
    clinic_phone: existingProfile?.clinic_phone || '+52 55 1000 2000',
    clinic_email: existingProfile?.clinic_email || userEmail || null,
  }

  if (existingProfile) {
    const { error: updateProfileError } = await supabase
      .from('user_profiles')
      .update(profilePatch)
      .eq('user_id', userId)

    if (updateProfileError) {
      throw new Error(`Error updating user profile: ${updateProfileError.message}`)
    }
  } else {
    const { error: insertProfileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        role: 'user',
        plan_type: 'premium',
        ...profilePatch,
      })

    if (insertProfileError) {
      throw new Error(`Error creating user profile: ${insertProfileError.message}`)
    }
  }

  const services = uniqueBy(
    (treatments || []).slice(0, 10).map((t, idx) => ({
      id: String(t.id),
      name: t.nombre,
      duration: Number(t.duracion_minutos || pick([30, 45, 60])),
      price: Number(t.precio_base || randInt(900, 3600)),
      description: t.descripcion || `Servicio premium ${idx + 1}`,
    })),
    (service) => service.id
  )

  const bookingPatch = {
    user_id: userId,
    available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    time_ranges: {
      monday: [{ start: '09:00', end: '14:00' }, { start: '16:00', end: '20:00' }],
      tuesday: [{ start: '09:00', end: '14:00' }, { start: '16:00', end: '20:00' }],
      wednesday: [{ start: '09:00', end: '14:00' }, { start: '16:00', end: '20:00' }],
      thursday: [{ start: '09:00', end: '14:00' }, { start: '16:00', end: '20:00' }],
      friday: [{ start: '09:00', end: '14:00' }, { start: '16:00', end: '20:00' }],
      saturday: [{ start: '09:00', end: '14:00' }],
    },
    slot_duration_minutes: 30,
    buffer_time_minutes: 10,
    min_advance_hours: 2,
    max_advance_days: 90,
    services,
    page_title: 'Reserva tu cita estetica',
    welcome_message: 'Agenda online en menos de 2 minutos. Te confirmamos por WhatsApp.',
    show_prices: true,
    require_phone: true,
    auto_confirm: false,
    send_confirmation_email: true,
    send_confirmation_sms: false,
    send_confirmation_whatsapp: true,
    updated_at: new Date().toISOString(),
  }

  const { data: existingSettings, error: bookingError } = await supabase
    .from('booking_settings')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (bookingError && bookingError.code !== 'PGRST116') {
    throw new Error(`Error loading booking settings: ${bookingError.message}`)
  }

  if (existingSettings) {
    const { error: updateBookingError } = await supabase
      .from('booking_settings')
      .update(bookingPatch)
      .eq('user_id', userId)

    if (updateBookingError) {
      throw new Error(`Error updating booking settings: ${updateBookingError.message}`)
    }
  } else {
    const { error: insertBookingError } = await supabase
      .from('booking_settings')
      .insert(bookingPatch)

    if (insertBookingError) {
      throw new Error(`Error creating booking settings: ${insertBookingError.message}`)
    }
  }

  return bookingSlug
}

async function createPublicBookings({ userId, patients, treatments, targetCount, daysPast, daysFuture }) {
  if (!targetCount || targetCount <= 0 || (patients || []).length === 0 || (treatments || []).length === 0) return []

  const { count: existingCount, error: countError } = await supabase
    .from('public_bookings')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_user_id', userId)

  if (countError) {
    throw new Error(`Error counting public bookings: ${countError.message}`)
  }

  const needed = Math.max(0, targetCount - Number(existingCount || 0))
  if (needed > 0) {
    const now = new Date()
    const start = new Date(now.getTime() - Math.max(daysPast, 45) * 24 * 60 * 60 * 1000)
    const end = new Date(now.getTime() + Math.max(daysFuture, 30) * 24 * 60 * 60 * 1000)
    const timeSlots = ['09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '11:30:00', '12:00:00', '16:00:00', '16:30:00', '17:00:00', '17:30:00', '18:00:00']
    const payload = []

    for (let i = 0; i < needed; i += 1) {
      const patient = pick(patients)
      const treatment = pick(treatments)
      const dateObj = randomDateBetween(start, end)
      const isPast = dateObj.getTime() < now.getTime()

      let status = 'pending'
      if (isPast) {
        status = pick(['completed', 'completed', 'confirmed', 'cancelled'])
      } else {
        status = pick(['pending', 'pending', 'confirmed'])
      }

      const bookingDate = dateObj.toISOString().slice(0, 10)
      const bookingTime = pick(timeSlots)
      const normalizedPhone = String(patient.telefono || `55${String(randInt(10000000, 99999999))}`).replace(/\D/g, '')

      payload.push({
        clinic_user_id: userId,
        patient_name: `${patient.nombre || ''} ${patient.apellido || ''}`.trim() || `Paciente web ${i + 1}`,
        patient_email: patient.email || `reserva.demo.${i + 1}@agendamedpro.test`,
        patient_phone: normalizedPhone,
        service_name: treatment.nombre,
        service_price: Number(treatment.precio_base || randInt(900, 3800)),
        service_duration_minutes: Number(treatment.duracion_minutos || pick([30, 45, 60])),
        booking_date: bookingDate,
        booking_time: bookingTime,
        status,
        patient_notes: pick([
          'Primera visita por recomendacion.',
          'Le interesa plan de seguimiento mensual.',
          'Solicita valorar paquete combinado.',
          'Desea informacion de cuidados post-tratamiento.',
        ]),
        clinic_notes: Math.random() > 0.55 ? pick([
          'Confirmar por WhatsApp 24h antes.',
          'Paciente potencial para paquete premium.',
          'Solicita factura al finalizar.',
          'Ajustar bloque de 60 min por primera valoracion.',
        ]) : null,
        locked_until: status === 'pending'
          ? new Date(Date.now() + randInt(5, 25) * 60 * 1000).toISOString()
          : null,
      })
    }

    for (const batch of chunk(payload, 200)) {
      const { error } = await supabase.from('public_bookings').insert(batch)
      if (error) {
        throw new Error(`Error creating public bookings: ${error.message}`)
      }
    }
  }

  const { data: bookings, error: loadError } = await supabase
    .from('public_bookings')
    .select('id, patient_name, patient_email, patient_phone, status, booking_date, booking_time, service_name, created_at')
    .eq('clinic_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(Math.max(120, targetCount))

  if (loadError) {
    throw new Error(`Error loading public bookings: ${loadError.message}`)
  }

  return bookings || []
}

async function createLeads(userId, targetCount) {
  if (!targetCount || targetCount <= 0) return []

  const { data: existing, error } = await supabase
    .from('leads')
    .select('id, nombre, status')
    .eq('user_id', userId)

  if (error) throw new Error(`Error loading leads: ${error.message}`)

  const rows = [...(existing || [])]
  const needed = Math.max(0, targetCount - rows.length)

  if (needed > 0) {
    const firstNames = ['Andrea', 'Miguel', 'Paola', 'Diego', 'Fernanda', 'Rafael', 'Valeria', 'Sebastian', 'Regina', 'Daniel']
    const lastNames = ['Lopez', 'Hernandez', 'Mendoza', 'Ruiz', 'Vega', 'Ortega', 'Paredes', 'Campos']
    const statuses = ['nuevo', 'contactado', 'calificado', 'convertido', 'perdido']
    const sources = ['manual', 'landing_contact', 'whatsapp_click', 'calculator', 'referral']
    const payload = []

    for (let i = 0; i < needed; i += 1) {
      const idx = rows.length + i + 1
      const nombre = `${pick(firstNames)} ${pick(lastNames)}`

      payload.push({
        user_id: userId,
        nombre,
        email: `lead.demo.${idx}@agendamedpro.test`,
        telefono: `55${String(20000000 + idx).slice(-8)}`,
        source: pick(sources),
        status: pick(statuses),
        notas: pick([
          'Solicita consulta de valoracion facial.',
          'Interesado en plan de rejuvenecimiento integral.',
          'Contacto desde anuncio de redes sociales.',
          'Pregunto por financiamiento y paquetes.',
        ]),
        utm_source: pick(['google', 'instagram', 'facebook', 'newsletter']),
        utm_medium: pick(['cpc', 'organic', 'referral']),
        utm_campaign: pick(['botox_q4', 'skinbooster_launch', 'bundle_premium']),
        created_at: randomDateBetween(new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), new Date()).toISOString(),
      })
    }

    for (const batch of chunk(payload, 200)) {
      const { error: insertError } = await supabase.from('leads').insert(batch)
      if (insertError) {
        throw new Error(`Error creating leads: ${insertError.message}`)
      }
    }
  }

  const { data: refreshed, error: loadError } = await supabase
    .from('leads')
    .select('id, nombre, status')
    .eq('user_id', userId)

  if (loadError) throw new Error(`Error loading seeded leads: ${loadError.message}`)
  return refreshed || []
}

async function createLeadNotes(userId, leads, targetCount) {
  if (!targetCount || targetCount <= 0 || (leads || []).length === 0) return 0

  const { count, error: countError } = await supabase
    .from('lead_notes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) throw new Error(`Error counting lead notes: ${countError.message}`)

  const needed = Math.max(0, targetCount - Number(count || 0))
  if (needed === 0) return 0

  const noteBodies = [
    'Se envio brochure por WhatsApp y quedo pendiente llamada.',
    'Confirmo disponibilidad para valoracion esta semana.',
    'Pregunta por promociones de tratamiento combinado.',
    'Interes en iniciar con protocolo de 3 sesiones.',
    'Solicito informacion de opciones de pago.',
    'Comento antecedentes de sensibilidad cutanea.',
  ]

  const payload = []
  for (let i = 0; i < needed; i += 1) {
    payload.push({
      lead_id: pick(leads).id,
      user_id: userId,
      body: pick(noteBodies),
      created_at: randomDateBetween(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date()).toISOString(),
    })
  }

  for (const batch of chunk(payload, 200)) {
    const { error } = await supabase.from('lead_notes').insert(batch)
    if (error) {
      throw new Error(`Error creating lead notes: ${error.message}`)
    }
  }

  return needed
}

async function ensureMessagingConfig(userId) {
  const { data: existing, error } = await supabase
    .from('messaging_config')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error loading messaging config: ${error.message}`)
  }

  const payload = {
    user_id: userId,
    whatsapp_business_id: existing?.whatsapp_business_id || `demo-business-${userId.slice(0, 8)}`,
    whatsapp_phone_number_id: existing?.whatsapp_phone_number_id || `demo-phone-${userId.slice(0, 8)}`,
    whatsapp_access_token: existing?.whatsapp_access_token || `DEMO_ACCESS_TOKEN_${userId.slice(0, 6).toUpperCase()}`,
    whatsapp_phone_number: existing?.whatsapp_phone_number || '+525510002000',
    whatsapp_enabled: true,
    auto_reminders_enabled: true,
    reminder_24h_enabled: true,
    reminder_1h_enabled: true,
    daily_message_limit: existing?.daily_message_limit || 1000,
    current_daily_usage: Math.min(existing?.daily_message_limit || 1000, randInt(48, 260)),
    usage_reset_date: new Date().toISOString().slice(0, 10),
    doctor_name: existing?.doctor_name || 'Dra. Aura Demo',
    clinic_name: existing?.clinic_name || 'Clinica Aura Demo',
    clinic_address: existing?.clinic_address || 'Av. Reforma 123, CDMX',
    clinic_phone: existing?.clinic_phone || '+52 55 1000 2000',
    custom_message_signature: existing?.custom_message_signature || 'Equipo Clinica Aura Demo',
    connection_status: 'connected',
    last_connection_test: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('messaging_config')
      .update(payload)
      .eq('user_id', userId)

    if (updateError) {
      throw new Error(`Error updating messaging config: ${updateError.message}`)
    }
  } else {
    const { error: insertError } = await supabase
      .from('messaging_config')
      .insert(payload)

    if (insertError) {
      throw new Error(`Error creating messaging config: ${insertError.message}`)
    }
  }
}

async function createWhatsAppMessages(userId, patients, appointments, targetCount) {
  if (!targetCount || targetCount <= 0 || (patients || []).length === 0) return 0

  const { count, error: countError } = await supabase
    .from('whatsapp_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) throw new Error(`Error counting WhatsApp messages: ${countError.message}`)

  const needed = Math.max(0, targetCount - Number(count || 0))
  if (needed === 0) return 0

  const statuses = ['sent', 'delivered', 'read', 'read', 'failed', 'pending', 'delivered', 'sent']
  const templates = ['booking_received', 'booking_confirmed', 'reminder_24h', 'followup_day7']
  const messages = [
    'Hola, confirmamos tu cita. Cualquier duda estamos para ayudarte.',
    'Te recordamos tu cita de manana. Responde SI para confirmar.',
    'Gracias por tu visita. Te compartimos cuidados post-tratamiento.',
    'Tenemos espacios disponibles esta semana para seguimiento.',
    'Recibimos tu solicitud. Te contactamos en breve para confirmar.',
  ]

  const start = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  const end = new Date()
  const payload = []

  for (let i = 0; i < needed; i += 1) {
    const patient = pick(patients)
    const appointment = (appointments || []).length > 0 ? pick(appointments) : null
    const status = pick(statuses)
    const createdAt = randomDateBetween(start, end)
    const sentAt = status === 'pending' ? null : new Date(createdAt.getTime() + randInt(1, 50) * 60 * 1000)
    const deliveredAt = (status === 'delivered' || status === 'read') && sentAt
      ? new Date(sentAt.getTime() + randInt(1, 20) * 60 * 1000)
      : null
    const readAt = status === 'read' && deliveredAt
      ? new Date(deliveredAt.getTime() + randInt(5, 75) * 60 * 1000)
      : null
    const failedAt = status === 'failed' ? new Date(createdAt.getTime() + randInt(1, 30) * 60 * 1000) : null
    const phone = `+52${String(patient.telefono || randInt(5500000000, 5599999999)).replace(/\D/g, '').slice(-10)}`

    payload.push({
      user_id: userId,
      patient_id: patient.id,
      appointment_id: appointment?.id || null,
      to_phone: phone,
      message_type: Math.random() > 0.45 ? 'template' : 'text',
      template_name: Math.random() > 0.4 ? pick(templates) : null,
      template_language: 'es_MX',
      message_body: pick(messages),
      status,
      meta_message_id: status === 'failed' || status === 'pending' ? null : `wamid.demo.${Date.now()}${randInt(100, 999)}`,
      error_code: status === 'failed' ? '131047' : null,
      error_message: status === 'failed' ? 'Demo failure: timeout with provider' : null,
      sent_at: sentAt?.toISOString() || null,
      delivered_at: deliveredAt?.toISOString() || null,
      read_at: readAt?.toISOString() || null,
      failed_at: failedAt?.toISOString() || null,
      created_at: createdAt.toISOString(),
    })
  }

  for (const batch of chunk(payload, 200)) {
    const { error } = await supabase.from('whatsapp_messages').insert(batch)
    if (error) {
      throw new Error(`Error creating WhatsApp messages: ${error.message}`)
    }
  }

  return needed
}

async function createNotificationLogs(userId, patients, bookings, appointments, targetCount) {
  if (!targetCount || targetCount <= 0) return 0

  const { count, error: countError } = await supabase
    .from('notification_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) throw new Error(`Error counting notification logs: ${countError.message}`)

  const needed = Math.max(0, targetCount - Number(count || 0))
  if (needed === 0) return 0

  const types = ['email', 'whatsapp', 'sms']
  const statuses = ['pending', 'sent', 'delivered', 'read', 'failed', 'sent', 'delivered']
  const events = ['booking_received', 'booking_confirmed', 'booking_cancelled', 'reminder_24h', 'reminder_1h', 'followup_request']
  const providersByType = {
    email: ['smtp', 'resend'],
    whatsapp: ['whatsapp_business'],
    sms: ['twilio'],
  }

  const start = new Date(Date.now() - 75 * 24 * 60 * 60 * 1000)
  const end = new Date()
  const payload = []

  for (let i = 0; i < needed; i += 1) {
    const type = pick(types)
    const status = pick(statuses)
    const patient = (patients || []).length > 0 ? pick(patients) : null
    const booking = (bookings || []).length > 0 ? pick(bookings) : null
    const appointment = (appointments || []).length > 0 ? pick(appointments) : null
    const createdAt = randomDateBetween(start, end)
    const sentAt = status === 'pending' ? null : new Date(createdAt.getTime() + randInt(1, 30) * 60 * 1000)
    const deliveredAt = (status === 'delivered' || status === 'read') && sentAt
      ? new Date(sentAt.getTime() + randInt(1, 20) * 60 * 1000)
      : null
    const failedAt = status === 'failed' ? new Date(createdAt.getTime() + randInt(1, 40) * 60 * 1000) : null

    const recipientEmail = type === 'email'
      ? (patient?.email || booking?.patient_email || `notificacion.demo.${i + 1}@agendamedpro.test`)
      : null

    const fallbackPhone = `+52${String(randInt(5500000000, 5599999999)).slice(-10)}`
    const recipientPhone = type !== 'email'
      ? (`+52${String(patient?.telefono || booking?.patient_phone || fallbackPhone).replace(/\D/g, '').slice(-10)}`)
      : null

    payload.push({
      user_id: userId,
      booking_id: booking?.id || null,
      appointment_id: appointment?.id || null,
      patient_id: patient?.id || null,
      notification_type: type,
      event_type: pick(events),
      recipient_email: recipientEmail,
      recipient_phone: recipientPhone,
      subject: type === 'email' ? pick([
        'Confirmacion de cita',
        'Recordatorio de consulta',
        'Actualizacion de reserva',
      ]) : null,
      message_body: pick([
        'Tu cita ha sido confirmada. Gracias por elegirnos.',
        'Te recordamos tu cita programada para manana.',
        'Hemos recibido tu solicitud y estamos procesandola.',
        'Se actualizo el estado de tu reserva.',
      ]),
      status,
      provider: pick(providersByType[type]),
      provider_message_id: status === 'failed' || status === 'pending' ? null : `notif_${Date.now()}_${randInt(1000, 9999)}`,
      error_code: status === 'failed' ? 'DELIVERY_TIMEOUT' : null,
      error_message: status === 'failed' ? 'No se pudo entregar dentro del tiempo esperado' : null,
      retry_count: status === 'failed' ? randInt(1, 3) : 0,
      sent_at: sentAt?.toISOString() || null,
      delivered_at: deliveredAt?.toISOString() || null,
      failed_at: failedAt?.toISOString() || null,
      created_at: createdAt.toISOString(),
    })
  }

  for (const batch of chunk(payload, 200)) {
    const { error } = await supabase.from('notification_logs').insert(batch)
    if (error) {
      throw new Error(`Error creating notification logs: ${error.message}`)
    }
  }

  return needed
}

async function createPatientPhotos(userId, patients, targetCount) {
  if (!targetCount || targetCount <= 0 || (patients || []).length === 0) return 0

  const { count, error: countError } = await supabase
    .from('patient_photos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) throw new Error(`Error counting patient photos: ${countError.message}`)

  const needed = Math.max(0, targetCount - Number(count || 0))
  if (needed === 0) return 0

  const categories = ['antes', 'progreso', 'despues', 'progreso', 'progreso']
  const captions = {
    antes: ['Registro inicial de valoracion facial', 'Foto base previo al protocolo', 'Captura inicial para seguimiento'],
    progreso: ['Control semanal de evolucion', 'Seguimiento post sesion', 'Comparativo intermedio del tratamiento'],
    despues: ['Resultado final del protocolo', 'Comparativo final de tratamiento', 'Cierre de caso con alta satisfaccion'],
  }

  const payload = []
  const start = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
  const end = new Date()

  for (let i = 0; i < needed; i += 1) {
    const patient = pick(patients)
    const category = pick(categories)
    const seed = `${patient.id.slice(0, 6)}-${Date.now()}-${i}`

    payload.push({
      user_id: userId,
      patient_id: patient.id,
      url: `https://picsum.photos/seed/${seed}/1200/900`,
      descripcion: pick(captions[category]),
      categoria: category,
      created_at: randomDateBetween(start, end).toISOString(),
    })
  }

  for (const batch of chunk(payload, 200)) {
    const { error } = await supabase.from('patient_photos').insert(batch)
    if (error) {
      throw new Error(`Error creating patient photos: ${error.message}`)
    }
  }

  return needed
}

async function detectIntakeFormTitleColumn() {
  const titleProbe = await supabase
    .from('intake_forms')
    .select('id, title')
    .limit(1)

  if (!titleProbe.error) return 'title'

  const nameProbe = await supabase
    .from('intake_forms')
    .select('id, name')
    .limit(1)

  if (!nameProbe.error) return 'name'

  throw new Error(`Unable to detect intake form title column: ${titleProbe.error?.message || nameProbe.error?.message}`)
}

async function hasTableColumn(table, column) {
  const { error } = await supabase
    .from(table)
    .select(column)
    .limit(1)

  return !error
}

async function ensureIntakeForms(userId, targetCount) {
  if (!targetCount || targetCount <= 0) return []

  const titleColumn = await detectIntakeFormTitleColumn()
  const statusColumn = await hasTableColumn('intake_forms', 'is_active')
    ? 'is_active'
    : (await hasTableColumn('intake_forms', 'active') ? 'active' : null)

  const templates = [
    {
      title: 'Valoracion inicial estetica',
      description: 'Antecedentes y expectativas de la primera consulta',
      fields: [
        { id: 'motivo_consulta', type: 'textarea', label: 'Motivo de consulta', required: true },
        { id: 'tratamientos_previos', type: 'textarea', label: 'Tratamientos esteticos previos', required: false },
        { id: 'alergias', type: 'text', label: 'Alergias conocidas', required: false },
        { id: 'objetivo', type: 'select', label: 'Objetivo principal', required: true, options: ['Rejuvenecimiento', 'Armonizacion facial', 'Control de acne', 'Otro'] },
      ],
    },
    {
      title: 'Checklist pre-procedimiento inyectable',
      description: 'Validaciones previas para toxina y rellenos',
      fields: [
        { id: 'medicamentos', type: 'textarea', label: 'Medicamentos actuales', required: true },
        { id: 'embarazo', type: 'radio', label: 'Embarazo o lactancia', required: true, options: ['Si', 'No'] },
        { id: 'anticoagulantes', type: 'radio', label: 'Uso de anticoagulantes', required: true, options: ['Si', 'No'] },
        { id: 'acepta_consentimiento', type: 'checkbox', label: 'Acepta consentimiento informado', required: true, options: ['Confirmo'] },
      ],
    },
    {
      title: 'Seguimiento post tratamiento',
      description: 'Control de evolucion y efectos secundarios',
      fields: [
        { id: 'dolor', type: 'select', label: 'Nivel de molestia', required: true, options: ['Ninguna', 'Leve', 'Moderada', 'Alta'] },
        { id: 'satisfaccion', type: 'select', label: 'Nivel de satisfaccion', required: true, options: ['1', '2', '3', '4', '5'] },
        { id: 'comentarios', type: 'textarea', label: 'Comentarios adicionales', required: false },
      ],
    },
    {
      title: 'Historia dermatologica breve',
      description: 'Formulario para tratamientos de piel',
      fields: [
        { id: 'tipo_piel', type: 'select', label: 'Tipo de piel', required: true, options: ['Seca', 'Mixta', 'Grasa', 'Sensible'] },
        { id: 'habitos', type: 'checkbox', label: 'Habitos de cuidado', required: false, options: ['Protector solar', 'Retinol', 'Exfoliacion', 'Hidratacion'] },
        { id: 'brotes', type: 'radio', label: 'Brotes recientes', required: true, options: ['Si', 'No'] },
      ],
    },
  ]

  const { data: existing, error } = await supabase
    .from('intake_forms')
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error(`Error loading intake forms: ${error.message}`)

  const rows = [...(existing || [])].map((row) => ({
    ...row,
    title: row.title || row.name || 'Formulario',
  }))
  const needed = Math.max(0, targetCount - rows.length)

  if (needed > 0) {
    const payload = []
    for (let i = 0; i < needed; i += 1) {
      const template = templates[(rows.length + i) % templates.length]
      const label = `${template.title}${Math.floor((rows.length + i) / templates.length) > 0 ? ` ${Math.floor((rows.length + i) / templates.length) + 1}` : ''}`
      const formRow = {
        user_id: userId,
        description: template.description,
        fields: template.fields,
      }
      formRow[titleColumn] = label
      if (statusColumn) {
        formRow[statusColumn] = true
      }
      payload.push({
        ...formRow,
      })
    }

    for (const batch of chunk(payload, 50)) {
      const { error: insertError } = await supabase.from('intake_forms').insert(batch)
      if (insertError) {
        throw new Error(`Error creating intake forms: ${insertError.message}`)
      }
    }
  }

  const { data: forms, error: loadError } = await supabase
    .from('intake_forms')
    .select('*')
    .eq('user_id', userId)

  if (loadError) throw new Error(`Error loading seeded intake forms: ${loadError.message}`)
  return (forms || []).map((row) => ({
    ...row,
    title: row.title || row.name || 'Formulario',
  }))
}

async function createIntakeResponses(forms, patients, appointments, targetCount) {
  if (!targetCount || targetCount <= 0 || (forms || []).length === 0 || (patients || []).length === 0) return 0

  const formIds = forms.map((form) => form.id)

  const { count, error: countError } = await supabase
    .from('intake_responses')
    .select('id', { count: 'exact', head: true })
    .in('form_id', formIds)

  if (countError) throw new Error(`Error counting intake responses: ${countError.message}`)

  const needed = Math.max(0, targetCount - Number(count || 0))
  if (needed === 0) return 0

  const buildAnswerValue = (field) => {
    const options = Array.isArray(field.options) ? field.options : []
    switch (field.type) {
      case 'textarea':
        return pick([
          'Paciente reporta buena tolerancia al tratamiento.',
          'Solicita seguimiento en dos semanas.',
          'No presenta molestias relevantes.',
        ])
      case 'email':
        return `paciente.${randInt(1, 999)}@demo.test`
      case 'phone':
        return `55${String(randInt(10000000, 99999999))}`
      case 'date':
        return randomDateBetween(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date()).toISOString().slice(0, 10)
      case 'select':
      case 'radio':
        return options.length > 0 ? pick(options) : 'N/A'
      case 'checkbox':
        if (options.length === 0) return []
        return uniqueBy([pick(options), pick(options)], (item) => item)
      default:
        return pick(['Sin antecedentes relevantes', 'Seguimiento normal', 'Prefiere contacto por WhatsApp'])
    }
  }

  const payload = []
  const start = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)
  const end = new Date()

  for (let i = 0; i < needed; i += 1) {
    const form = pick(forms)
    const patient = pick(patients)
    const maybeAppointment = (appointments || []).find((apt) => apt.patient_id === patient.id)
    const answers = {}

    for (const field of Array.isArray(form.fields) ? form.fields : []) {
      answers[field.id || `field_${randInt(1, 9999)}`] = buildAnswerValue(field)
    }

    payload.push({
      form_id: form.id,
      patient_id: patient.id,
      appointment_id: maybeAppointment?.id || null,
      nombre: `${patient.nombre || ''} ${patient.apellido || ''}`.trim(),
      email: patient.email || `respuesta.${randInt(1, 999)}@demo.test`,
      telefono: patient.telefono || `55${String(randInt(10000000, 99999999))}`,
      answers,
      submitted_at: randomDateBetween(start, end).toISOString(),
    })
  }

  for (const batch of chunk(payload, 200)) {
    const { error } = await supabase.from('intake_responses').insert(batch)
    if (error) {
      throw new Error(`Error creating intake responses: ${error.message}`)
    }
  }

  return needed
}

async function ensureNpsSurveys(userId, targetCount) {
  if (!targetCount || targetCount <= 0) return []

  const templates = [
    { title: 'Satisfaccion post-consulta', message: 'Del 0 al 10, que tan probable es que recomiendes nuestra clinica?', send_delay_hours: 2 },
    { title: 'Experiencia tratamiento inyectable', message: 'Califica tu experiencia general con el tratamiento de hoy.', send_delay_hours: 4 },
    { title: 'Seguimiento de servicio premium', message: 'Tu opinion nos ayuda a mejorar la atencion personalizada.', send_delay_hours: 24 },
  ]

  const { data: existing, error } = await supabase
    .from('nps_surveys')
    .select('id, title')
    .eq('user_id', userId)

  if (error) throw new Error(`Error loading NPS surveys: ${error.message}`)

  const rows = [...(existing || [])]
  const needed = Math.max(0, targetCount - rows.length)

  if (needed > 0) {
    const payload = []
    for (let i = 0; i < needed; i += 1) {
      const tpl = templates[(rows.length + i) % templates.length]
      payload.push({
        user_id: userId,
        title: tpl.title,
        message: tpl.message,
        send_delay_hours: tpl.send_delay_hours,
        is_active: true,
      })
    }

    for (const batch of chunk(payload, 100)) {
      const { error: insertError } = await supabase.from('nps_surveys').insert(batch)
      if (insertError) {
        throw new Error(`Error creating NPS surveys: ${insertError.message}`)
      }
    }
  }

  const { data: surveys, error: loadError } = await supabase
    .from('nps_surveys')
    .select('id, title')
    .eq('user_id', userId)

  if (loadError) throw new Error(`Error loading seeded NPS surveys: ${loadError.message}`)
  return surveys || []
}

async function createNpsResponses(surveys, patients, appointments, targetCount) {
  if (!targetCount || targetCount <= 0 || (surveys || []).length === 0 || (patients || []).length === 0) return 0

  const surveyIds = surveys.map((survey) => survey.id)
  const { count, error: countError } = await supabase
    .from('nps_responses')
    .select('id', { count: 'exact', head: true })
    .in('survey_id', surveyIds)

  if (countError) throw new Error(`Error counting NPS responses: ${countError.message}`)

  const needed = Math.max(0, targetCount - Number(count || 0))
  if (needed === 0) return 0

  const scorePool = [10, 9, 9, 8, 8, 7, 10, 9, 6, 5]
  const comments = {
    promoter: ['Excelente atencion y resultados.', 'Muy profesional todo el equipo.', 'Recomendaria totalmente la clinica.'],
    passive: ['Buena experiencia general.', 'Todo bien, podria mejorar la puntualidad.', 'Servicio correcto y amable.'],
    detractor: ['Tuve que esperar mas de lo esperado.', 'Esperaba mas seguimiento post-cita.', 'La comunicacion puede mejorar.'],
  }

  const start = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)
  const end = new Date()
  const payload = []

  for (let i = 0; i < needed; i += 1) {
    const survey = pick(surveys)
    const patient = pick(patients)
    const appointment = (appointments || []).find((apt) => apt.patient_id === patient.id)
    const score = pick(scorePool)
    const bucket = score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor'

    payload.push({
      survey_id: survey.id,
      appointment_id: appointment?.id || null,
      patient_id: patient.id,
      score,
      comment: pick(comments[bucket]),
      respondent_name: `${patient.nombre || ''} ${patient.apellido || ''}`.trim(),
      respondent_email: patient.email || `nps.${randInt(1, 999)}@demo.test`,
      submitted_at: randomDateBetween(start, end).toISOString(),
    })
  }

  for (const batch of chunk(payload, 200)) {
    const { error } = await supabase.from('nps_responses').insert(batch)
    if (error) {
      throw new Error(`Error creating NPS responses: ${error.message}`)
    }
  }

  return needed
}

async function ensureDocumentTemplates(userId, targetCount) {
  if (!targetCount || targetCount <= 0) return []

  const templates = [
    {
      title: 'Consentimiento informado toxina botulinica',
      content: '<h2>Consentimiento informado</h2><p>He recibido explicacion del procedimiento, riesgos y cuidados posteriores. Autorizo la aplicacion de toxina botulinica de forma voluntaria.</p>',
    },
    {
      title: 'Consentimiento para rellenos faciales',
      content: '<h2>Consentimiento para rellenos</h2><p>Confirmo que fui informado sobre beneficios, alternativas y posibles efectos secundarios del uso de rellenos faciales.</p>',
    },
    {
      title: 'Autorizacion de uso de imagen clinica',
      content: '<h2>Autorizacion de imagen</h2><p>Autorizo el uso de fotografias clinicas para seguimiento interno y comparativo de resultados, respetando privacidad.</p>',
    },
  ]

  const { data: existing, error } = await supabase
    .from('document_templates')
    .select('id, title')
    .eq('user_id', userId)

  if (error) throw new Error(`Error loading document templates: ${error.message}`)

  const rows = [...(existing || [])]
  const needed = Math.max(0, targetCount - rows.length)

  if (needed > 0) {
    const payload = []
    for (let i = 0; i < needed; i += 1) {
      const tpl = templates[(rows.length + i) % templates.length]
      payload.push({
        user_id: userId,
        title: tpl.title,
        content: tpl.content,
        is_active: true,
      })
    }

    for (const batch of chunk(payload, 100)) {
      const { error: insertError } = await supabase.from('document_templates').insert(batch)
      if (insertError) {
        throw new Error(`Error creating document templates: ${insertError.message}`)
      }
    }
  }

  const { data: docs, error: loadError } = await supabase
    .from('document_templates')
    .select('id, title')
    .eq('user_id', userId)

  if (loadError) throw new Error(`Error loading seeded templates: ${loadError.message}`)
  return docs || []
}

async function createDocumentSignatures(templates, patients, appointments, targetCount) {
  if (!targetCount || targetCount <= 0 || (templates || []).length === 0 || (patients || []).length === 0) return 0

  const templateIds = templates.map((template) => template.id)
  const { count, error: countError } = await supabase
    .from('document_signatures')
    .select('id', { count: 'exact', head: true })
    .in('template_id', templateIds)

  if (countError) throw new Error(`Error counting document signatures: ${countError.message}`)

  const needed = Math.max(0, targetCount - Number(count || 0))
  if (needed === 0) return 0

  const payload = []
  const start = new Date(Date.now() - 150 * 24 * 60 * 60 * 1000)
  const end = new Date()

  for (let i = 0; i < needed; i += 1) {
    const template = pick(templates)
    const patient = pick(patients)
    const appointment = (appointments || []).find((apt) => apt.patient_id === patient.id)

    payload.push({
      template_id: template.id,
      patient_id: patient.id,
      appointment_id: appointment?.id || null,
      signer_name: `${patient.nombre || ''} ${patient.apellido || ''}`.trim(),
      signer_email: patient.email || `firma.${randInt(1, 999)}@demo.test`,
      signature_data: `demo-signature-${randInt(100000, 999999)}`,
      ip_address: `189.2.${randInt(10, 240)}.${randInt(10, 240)}`,
      signed_at: randomDateBetween(start, end).toISOString(),
    })
  }

  for (const batch of chunk(payload, 200)) {
    const { error } = await supabase.from('document_signatures').insert(batch)
    if (error) {
      throw new Error(`Error creating document signatures: ${error.message}`)
    }
  }

  return needed
}

async function ensureTreatmentInventoryLinks(userId, treatments, inventoryItems, linksPerTreatment) {
  if (!linksPerTreatment || linksPerTreatment <= 0 || (treatments || []).length === 0 || (inventoryItems || []).length === 0) return 0

  const treatmentIds = treatments.map((t) => t.id)
  const { data: existing, error } = await supabase
    .from('treatment_inventory_items')
    .select('id, treatment_id, inventory_item_id')
    .eq('user_id', userId)
    .in('treatment_id', treatmentIds)

  if (error) throw new Error(`Error loading treatment inventory links: ${error.message}`)

  const byTreatment = new Map()
  for (const row of existing || []) {
    if (!byTreatment.has(row.treatment_id)) byTreatment.set(row.treatment_id, new Set())
    byTreatment.get(row.treatment_id).add(row.inventory_item_id)
  }

  const payload = []

  for (const treatment of treatments) {
    const used = byTreatment.get(treatment.id) || new Set()
    const target = Math.min(inventoryItems.length, Math.max(1, linksPerTreatment))

    if (used.size >= target) continue

    const candidates = [...inventoryItems]
      .filter((item) => !used.has(item.id))
      .sort(() => Math.random() - 0.5)

    for (const item of candidates) {
      if (used.size >= target) break
      used.add(item.id)
      payload.push({
        user_id: userId,
        treatment_id: treatment.id,
        inventory_item_id: item.id,
        cantidad_requerida: Number((Math.random() * 2.4 + 0.6).toFixed(2)),
      })
    }
  }

  if (payload.length > 0) {
    for (const batch of chunk(payload, 200)) {
      const { error: insertError } = await supabase
        .from('treatment_inventory_items')
        .insert(batch)

      if (insertError) {
        throw new Error(`Error creating treatment inventory links: ${insertError.message}`)
      }
    }
  }

  return payload.length
}

async function ensureFacturamaConfig(userId) {
  const { data: existing, error } = await supabase
    .from('facturama_config')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error loading Facturama config: ${error.message}`)
  }

  if (existing?.is_configured && existing?.api_user && existing?.api_password_encrypted) {
    return false
  }

  const payload = {
    user_id: userId,
    api_user: existing?.api_user || `demo_facturama_${userId.slice(0, 8)}`,
    api_password_encrypted: existing?.api_password_encrypted || 'demo_encrypted_password',
    is_sandbox: true,
    emisor_rfc: existing?.emisor_rfc || 'XAXX010101000',
    emisor_razon_social: existing?.emisor_razon_social || 'Clinica Aura Demo SA de CV',
    emisor_regimen_fiscal: existing?.emisor_regimen_fiscal || '601',
    emisor_codigo_postal: existing?.emisor_codigo_postal || '01000',
    emisor_email: existing?.emisor_email || 'facturacion@clinicademo.test',
    emisor_telefono: existing?.emisor_telefono || '+52 55 1000 2000',
    emisor_direccion: existing?.emisor_direccion || 'Av. Reforma 123',
    emisor_ciudad: existing?.emisor_ciudad || 'Ciudad de Mexico',
    emisor_estado: existing?.emisor_estado || 'CDMX',
    serie_default: existing?.serie_default || 'D',
    folio_inicial: existing?.folio_inicial || 100,
    auto_send_email: false,
    is_active: true,
    is_configured: true,
    last_validated_at: new Date().toISOString(),
    validation_error: null,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('facturama_config')
      .update(payload)
      .eq('user_id', userId)

    if (updateError) {
      throw new Error(`Error updating Facturama config: ${updateError.message}`)
    }
  } else {
    const { error: insertError } = await supabase
      .from('facturama_config')
      .insert(payload)

    if (insertError) {
      throw new Error(`Error creating Facturama config: ${insertError.message}`)
    }
  }

  return true
}

async function ensurePatientFiscalData(patients, targetCount) {
  if (!targetCount || targetCount <= 0 || (patients || []).length === 0) return []

  const hasPaisColumn = await hasTableColumn('patient_fiscal_data', 'pais')

  const selectedPatients = patients.slice(0, Math.min(targetCount, patients.length))
  const patientIds = selectedPatients.map((patient) => patient.id)

  const { data: existing, error } = await supabase
    .from('patient_fiscal_data')
    .select('id, patient_id')
    .in('patient_id', patientIds)

  if (error) {
    throw new Error(`Error loading patient fiscal data: ${error.message}`)
  }

  const existingByPatient = new Set((existing || []).map((row) => row.patient_id))
  const payload = []

  for (let i = 0; i < selectedPatients.length; i += 1) {
    const patient = selectedPatients[i]
    if (existingByPatient.has(patient.id)) continue

    const fiscalRow = {
      patient_id: patient.id,
      rfc: 'XAXX010101000',
      razon_social: `${patient.nombre || ''} ${patient.apellido || ''}`.trim() || `Paciente Fiscal ${i + 1}`,
      regimen_fiscal: pick(['601', '612']),
      codigo_postal: pick(['01000', '03100', '06700', '11550']),
      uso_cfdi: pick(['G03', 'D01']),
      email_facturacion: patient.email || `fiscal.${i + 1}@demo.test`,
      telefono: patient.telefono || `55${String(randInt(10000000, 99999999))}`,
      ciudad: 'Ciudad de Mexico',
      estado: 'DF',
      is_default: true,
    }

    if (hasPaisColumn) {
      fiscalRow.pais = 'MX'
    }

    payload.push(fiscalRow)
  }

  if (payload.length > 0) {
    for (const batch of chunk(payload, 100)) {
      const { error: insertError } = await supabase
        .from('patient_fiscal_data')
        .insert(batch)

      if (insertError) {
        throw new Error(`Error creating patient fiscal data: ${insertError.message}`)
      }
    }
  }

  const { data: allFiscal, error: loadError } = await supabase
    .from('patient_fiscal_data')
    .select('id, patient_id')
    .in('patient_id', patientIds)

  if (loadError) {
    throw new Error(`Error loading fiscal data after insert: ${loadError.message}`)
  }

  return allFiscal || []
}

async function detectInvoicesUserIdColumn() {
  const { error } = await supabase
    .from('invoices')
    .select('user_id')
    .limit(1)

  return !error
}

async function createSimulatedInvoices({ userId, recordsTarget, fiscalDataRows, targetCount, hasPendingFacturarColumn }) {
  if (!targetCount || targetCount <= 0) return 0

  const { count: existingCount, error: countError } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId)

  if (countError) {
    throw new Error(`Error counting invoices: ${countError.message}`)
  }

  const needed = Math.max(0, targetCount - Number(existingCount || 0))
  if (needed === 0) return 0

  const hasInvoiceUserId = await detectInvoicesUserIdColumn()

  const { data: records, error: recordsError } = await supabase
    .from('records')
    .select('id, patient_id, fecha, monto_pagado, metodo_pago')
    .eq('user_id', userId)
    .order('fecha', { ascending: false })
    .limit(Math.max(recordsTarget, 300))

  if (recordsError) {
    throw new Error(`Error loading records for invoices: ${recordsError.message}`)
  }

  const { data: existingInvoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('id')
    .eq('created_by', userId)

  if (invoicesError) {
    throw new Error(`Error loading existing invoices: ${invoicesError.message}`)
  }

  const existingInvoiceIds = (existingInvoices || []).map((invoice) => invoice.id)
  let linkedRecordIds = new Set()

  if (existingInvoiceIds.length > 0) {
    const { data: links, error: linksError } = await supabase
      .from('invoice_records')
      .select('record_id')
      .in('invoice_id', existingInvoiceIds)

    if (linksError) {
      throw new Error(`Error loading existing invoice links: ${linksError.message}`)
    }

    linkedRecordIds = new Set((links || []).map((link) => link.record_id))
  }

  const fiscalByPatient = new Map((fiscalDataRows || []).map((row) => [row.patient_id, row.id]))
  const byPatient = new Map()

  for (const row of records || []) {
    if (linkedRecordIds.has(row.id)) continue
    if (!fiscalByPatient.has(row.patient_id)) continue

    if (!byPatient.has(row.patient_id)) byPatient.set(row.patient_id, [])
    byPatient.get(row.patient_id).push(row)
  }

  let created = 0
  const appBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const patientIds = [...byPatient.keys()]

  while (created < needed && patientIds.length > 0) {
    const patientId = pick(patientIds)
    const pool = byPatient.get(patientId) || []

    if (pool.length === 0) {
      byPatient.delete(patientId)
      const idx = patientIds.indexOf(patientId)
      if (idx >= 0) patientIds.splice(idx, 1)
      continue
    }

    const takeCount = Math.min(pool.length, pick([1, 1, 2, 2, 3]))
    const selected = pool.splice(0, takeCount)
    const total = Number(selected.reduce((sum, row) => sum + Number(row.monto_pagado || 0), 0).toFixed(2))

    if (total <= 0) continue

    const subtotal = Number((total / 1.16).toFixed(2))
    const iva = Number((total - subtotal).toFixed(2))
    const baseDate = selected[0]?.fecha ? new Date(selected[0].fecha) : new Date()
    const folio = String(100000 + Number(existingCount || 0) + created + 1)
    const demoUuid = `DEMO-${Date.now()}-${randInt(1000, 9999)}`
    const formaPago = selected[0]?.metodo_pago === 'transferencia'
      ? '03'
      : selected[0]?.metodo_pago === 'tarjeta'
        ? '04'
        : '01'

    const invoicePayload = {
      patient_id: patientId,
      fiscal_data_id: fiscalByPatient.get(patientId),
      facturama_id: `demo_facturama_${Date.now()}_${randInt(10, 99)}`,
      folio_number: folio,
      serie: 'D',
      uuid: demoUuid,
      fecha_emision: baseDate.toISOString(),
      fecha_timbrado: new Date(baseDate.getTime() + 2 * 60 * 1000).toISOString(),
      subtotal,
      iva,
      total,
      moneda: 'MXN',
      tipo_comprobante: 'I',
      forma_pago: formaPago,
      metodo_pago: 'PUE',
      xml_url: `${appBase}/demo-assets/invoices/${demoUuid}.xml`,
      pdf_url: `${appBase}/demo-assets/invoices/${demoUuid}.pdf`,
      status: 'issued',
      notas: 'Factura simulada para demo comercial',
      created_by: userId,
    }

    if (hasInvoiceUserId) {
      invoicePayload.user_id = userId
    }

    const { data: invoice, error: insertInvoiceError } = await supabase
      .from('invoices')
      .insert(invoicePayload)
      .select('id')
      .single()

    if (insertInvoiceError || !invoice) {
      console.warn(`Warning: could not create simulated invoice: ${insertInvoiceError?.message || 'unknown error'}`)
      continue
    }

    const linksPayload = selected.map((row) => ({
      invoice_id: invoice.id,
      record_id: row.id,
      monto: Number(row.monto_pagado || 0),
    }))

    const { error: insertLinksError } = await supabase
      .from('invoice_records')
      .insert(linksPayload)

    if (insertLinksError) {
      console.warn(`Warning: could not link invoice records: ${insertLinksError.message}`)
    }

    if (hasPendingFacturarColumn) {
      const { error: markError } = await supabase
        .from('records')
        .update({ pendiente_facturar: false })
        .in('id', selected.map((row) => row.id))

      if (markError) {
        console.warn(`Warning: could not mark records as billed: ${markError.message}`)
      }
    }

    created += 1
  }

  return created
}

async function appendDemoAuditLog(userId, summary) {
  const { error } = await supabase
    .from('demo_audit_log')
    .insert({
      user_id: userId,
      event_type: 'demo_rich_seed_completed',
      integration: 'system',
      resource_type: 'seed',
      resource_id: `seed_${Date.now()}`,
      status: 'simulated',
      payload: summary,
    })

  if (error) {
    console.warn('Warning: could not append demo audit log:', error.message)
  }
}

async function main() {
  const userArg = readArg('--user')
  const emailArg = readArg('--email')
  const shouldReset = hasFlag('--reset')

  const patientsTarget = parsePositiveInt('--patients', 60)
  const treatmentsTarget = parsePositiveInt('--treatments', 22)
  const inventoryTarget = parsePositiveInt('--inventory', 35)
  const appointmentsTarget = parsePositiveInt('--appointments', 180)
  const recordsTarget = parsePositiveInt('--records', 120)
  const promotionsTarget = parsePositiveInt('--promotions', 8)
  const fixedExpensesTarget = parsePositiveInt('--fixed-expenses', 12)
  const variableExpensesTarget = parsePositiveInt('--variable-expenses', 45)
  const leadsTarget = parsePositiveInt('--leads', 36)
  const leadNotesTarget = parsePositiveInt('--lead-notes', 110)
  const whatsappMessagesTarget = parsePositiveInt('--messages', 95)
  const bookingTarget = parsePositiveInt('--bookings', 55)
  const notificationLogsTarget = parsePositiveInt('--notification-logs', 140)
  const photosTarget = parsePositiveInt('--photos', 90)
  const intakeFormsTarget = parsePositiveInt('--intake-forms', 4)
  const intakeResponsesTarget = parsePositiveInt('--intake-responses', 85)
  const npsSurveysTarget = parsePositiveInt('--nps-surveys', 3)
  const npsResponsesTarget = parsePositiveInt('--nps-responses', 90)
  const documentsTarget = parsePositiveInt('--documents', 3)
  const signaturesTarget = parsePositiveInt('--signatures', 75)
  const invoicesTarget = parsePositiveInt('--invoices', 32)
  const fiscalDataTarget = parsePositiveInt('--fiscal-data', 30)
  const linksPerTreatment = parsePositiveInt('--links-per-treatment', 3)
  const daysPast = parsePositiveInt('--days-past', 120)
  const daysFuture = parsePositiveInt('--days-future', 45)

  const user = await resolveUserId(userArg, emailArg)
  const userId = user.userId

  console.log('Starting demo rich seed')
  console.log(`- user_id: ${userId}`)
  if (user.email) {
    console.log(`- email: ${user.email}`)
  }

  if (shouldReset) {
    console.log('Reset enabled: deleting existing demo data for this user...')
    await maybeResetDemoData(userId)
    console.log('Reset completed')
  }

  const { data: demoConfig } = await supabase
    .from('demo_mode_config')
    .select('is_demo_account, demo_expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (!demoConfig?.is_demo_account) {
    console.warn('Warning: user does not appear as active demo account in demo_mode_config')
  }

  const doctors = await ensureDoctors(userId, 3)
  const consultorios = await ensureConsultorios(userId, 3)
  const appointmentTypes = await ensureAppointmentTypes(userId)
  await ensureDoctorSchedules(userId, doctors)

  const patients = await ensurePatients(userId, patientsTarget)
  const treatments = await ensureTreatments(userId, treatmentsTarget)
  const inventoryItems = await ensureInventoryItems(userId, inventoryTarget)
  const bookingSlug = await ensureProfileAndBookingSettings(userId, user.email, treatments)
  const treatmentInventoryLinks = await ensureTreatmentInventoryLinks(userId, treatments, inventoryItems, linksPerTreatment)

  const promotions = await createPromotions(userId, treatments, promotionsTarget)
  const appointments = await createAppointments({
    userId,
    patients,
    treatments,
    doctors,
    consultorios,
    appointmentTypes,
    targetCount: appointmentsTarget,
    daysPast,
    daysFuture,
  })

  const recordColumns = await detectRecordColumnSupport()
  const records = await createRecords(userId, appointments, treatments, recordsTarget, recordColumns)
  await createFixedExpenses(userId, fixedExpensesTarget)
  await createVariableExpenses(userId, variableExpensesTarget, daysPast)

  const publicBookings = await createPublicBookings({
    userId,
    patients,
    treatments,
    targetCount: bookingTarget,
    daysPast,
    daysFuture,
  })

  const leads = await createLeads(userId, leadsTarget)
  const leadNotesCreated = await createLeadNotes(userId, leads, leadNotesTarget)

  await ensureMessagingConfig(userId)
  const whatsappMessagesCreated = await createWhatsAppMessages(userId, patients, appointments, whatsappMessagesTarget)
  const notificationLogsCreated = await createNotificationLogs(
    userId,
    patients,
    publicBookings,
    appointments,
    notificationLogsTarget
  )

  const patientPhotosCreated = await createPatientPhotos(userId, patients, photosTarget)

  const intakeForms = await ensureIntakeForms(userId, intakeFormsTarget)
  const intakeResponsesCreated = await createIntakeResponses(intakeForms, patients, appointments, intakeResponsesTarget)

  const npsSurveys = await ensureNpsSurveys(userId, npsSurveysTarget)
  const npsResponsesCreated = await createNpsResponses(npsSurveys, patients, appointments, npsResponsesTarget)

  const documentTemplates = await ensureDocumentTemplates(userId, documentsTarget)
  const documentSignaturesCreated = await createDocumentSignatures(documentTemplates, patients, appointments, signaturesTarget)

  await ensureFacturamaConfig(userId)
  const fiscalData = await ensurePatientFiscalData(patients, fiscalDataTarget)
  const invoicesCreated = await createSimulatedInvoices({
    userId,
    recordsTarget,
    fiscalDataRows: fiscalData,
    targetCount: invoicesTarget,
    hasPendingFacturarColumn: recordColumns.pendiente_facturar,
  })

  const summary = {
    user_id: userId,
    doctors: doctors.length,
    consultorios: consultorios.length,
    appointment_types: appointmentTypes.length,
    patients: patients.length,
    treatments: treatments.length,
    inventory_items: inventoryItems.length,
    treatment_inventory_links_created: treatmentInventoryLinks,
    promotions: promotions.length,
    appointments_created: appointmentsTarget,
    records_created: records.length,
    fixed_expenses_created: fixedExpensesTarget,
    variable_expenses_created: variableExpensesTarget,
    booking_slug: bookingSlug,
    public_bookings_total: publicBookings.length,
    leads_total: leads.length,
    lead_notes_created: leadNotesCreated,
    whatsapp_messages_created: whatsappMessagesCreated,
    notification_logs_created: notificationLogsCreated,
    patient_photos_created: patientPhotosCreated,
    intake_forms_total: intakeForms.length,
    intake_responses_created: intakeResponsesCreated,
    nps_surveys_total: npsSurveys.length,
    nps_responses_created: npsResponsesCreated,
    document_templates_total: documentTemplates.length,
    document_signatures_created: documentSignaturesCreated,
    fiscal_data_total: fiscalData.length,
    invoices_created: invoicesCreated,
    generated_at: new Date().toISOString(),
  }

  await appendDemoAuditLog(userId, summary)

  console.log('\nDemo rich seed completed successfully')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('Demo rich seed failed:', error)
  process.exit(1)
})
