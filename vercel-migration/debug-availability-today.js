require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { addDays, format, parse, addMinutes } = require('date-fns');
const { es } = require('date-fns/locale');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugAvailabilityToday() {
  const userId = '86cbe61c-8829-41a2-aa29-81e11844f83e';
  
  // HOY - 29 de enero de 2026
  const today = new Date();
  const dateParam = today.toISOString().split('T')[0]; // "2026-01-29"
  const requestedDate = new Date(dateParam + 'T00:00:00');
  const dayOfWeek = format(requestedDate, 'EEEE', { locale: es }).toLowerCase();
  
  console.log('🔍 DEBUGGING DISPONIBILIDAD PARA HOY\n');
  console.log('📅 Fecha:', dateParam);
  console.log('📅 Día de la semana:', dayOfWeek);
  console.log('🕐 Hora actual:', today.toLocaleTimeString('es-MX'));
  
  // 1. Obtener configuración
  const { data: settings } = await supabase
    .from('booking_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  console.log('\n⚙️ Configuración:');
  console.log('   min_advance_hours:', settings.min_advance_hours);
  console.log('   slot_duration_minutes:', settings.slot_duration_minutes);
  console.log('   buffer_time_minutes:', settings.buffer_time_minutes);
  
  // 2. Mapeo de días
  const dayMapping = {
    lunes: 'monday',
    martes: 'tuesday',
    miércoles: 'wednesday',
    jueves: 'thursday',
    viernes: 'friday',
    sábado: 'saturday',
    domingo: 'sunday',
  };
  
  const englishDayName = dayMapping[dayOfWeek] || dayOfWeek;
  console.log('   Día en inglés:', englishDayName);
  
  // 3. Verificar si está en available_days
  const availableDays = settings.available_days || [];
  console.log('   Días disponibles:', availableDays);
  console.log('   ¿Está disponible hoy?:', availableDays.includes(englishDayName) ? '✅' : '❌');
  
  if (!availableDays.includes(englishDayName)) {
    console.log('\n❌ PROBLEMA: Hoy no está en los días disponibles!');
    return;
  }
  
  // 4. Obtener rangos de tiempo para hoy
  const timeRanges = (settings.time_ranges || {})[englishDayName] || [];
  console.log('\n⏰ Rangos de tiempo para hoy:', JSON.stringify(timeRanges, null, 2));
  
  if (timeRanges.length === 0) {
    console.log('❌ PROBLEMA: No hay rangos de tiempo configurados para hoy!');
    return;
  }
  
  // 5. Generar todos los slots posibles
  const slotDuration = settings.slot_duration_minutes || 30;
  const bufferTime = settings.buffer_time_minutes || 5;
  const totalSlotTime = slotDuration + bufferTime;
  
  const allSlots = [];
  
  for (const range of timeRanges) {
    const startTime = parse(range.start, 'HH:mm', requestedDate);
    const endTime = parse(range.end, 'HH:mm', requestedDate);
    let currentSlot = startTime;
    
    while (currentSlot < endTime) {
      const slotEndTime = addMinutes(currentSlot, slotDuration);
      if (slotEndTime <= endTime) {
        allSlots.push(format(currentSlot, 'HH:mm'));
      }
      currentSlot = addMinutes(currentSlot, totalSlotTime);
    }
  }
  
  console.log('\n📋 Slots generados (total ' + allSlots.length + '):');
  console.log('   ', allSlots.join(', '));
  
  // 6. Obtener citas existentes
  const { data: existingBookings } = await supabase
    .from('public_bookings')
    .select('booking_time, service_duration_minutes, status')
    .eq('clinic_user_id', userId)
    .eq('booking_date', dateParam)
    .in('status', ['pending', 'confirmed']);
  
  const { data: existingAppointments } = await supabase
    .from('appointments')
    .select('fecha_hora, duracion_minutos, estado')
    .eq('user_id', userId)
    .gte('fecha_hora', `${dateParam}T00:00:00`)
    .lt('fecha_hora', `${dateParam}T23:59:59`)
    .in('estado', ['programada', 'confirmada', 'en_proceso']);
  
  console.log('\n📌 Citas existentes:');
  console.log('   Bookings públicos:', existingBookings?.length || 0);
  if (existingBookings && existingBookings.length > 0) {
    existingBookings.forEach(b => {
      console.log('      -', b.booking_time, '(', b.service_duration_minutes, 'min) -', b.status);
    });
  }
  
  console.log('   Appointments internos:', existingAppointments?.length || 0);
  if (existingAppointments && existingAppointments.length > 0) {
    existingAppointments.forEach(a => {
      const time = new Date(a.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      console.log('      -', time, '(', a.duracion_minutos, 'min) -', a.estado);
    });
  }
  
  // 7. Calcular slots ocupados
  const occupiedTimes = new Set();
  
  // Desde bookings
  if (existingBookings) {
    for (const booking of existingBookings) {
      const bookingTime = booking.booking_time;
      occupiedTimes.add(bookingTime.substring(0, 5)); // "HH:mm" format
      
      const duration = booking.service_duration_minutes || slotDuration;
      const bookingStart = parse(bookingTime, 'HH:mm:ss', requestedDate);
      
      for (const slot of allSlots) {
        const slotStart = parse(slot, 'HH:mm', requestedDate);
        const slotEnd = addMinutes(slotStart, slotDuration);
        
        if (
          (slotStart >= bookingStart && slotStart < addMinutes(bookingStart, duration)) ||
          (slotEnd > bookingStart && slotEnd <= addMinutes(bookingStart, duration)) ||
          (slotStart <= bookingStart && slotEnd >= addMinutes(bookingStart, duration))
        ) {
          occupiedTimes.add(slot);
        }
      }
    }
  }
  
  // Desde appointments
  if (existingAppointments) {
    for (const appointment of existingAppointments) {
      const appointmentDateTime = new Date(appointment.fecha_hora);
      const appointmentTime = format(appointmentDateTime, 'HH:mm');
      occupiedTimes.add(appointmentTime);
      
      const duration = appointment.duracion_minutos || slotDuration;
      
      for (const slot of allSlots) {
        const slotStart = parse(slot, 'HH:mm', requestedDate);
        const slotEnd = addMinutes(slotStart, slotDuration);
        
        if (
          (slotStart >= appointmentDateTime && slotStart < addMinutes(appointmentDateTime, duration)) ||
          (slotEnd > appointmentDateTime && slotEnd <= addMinutes(appointmentDateTime, duration)) ||
          (slotStart <= appointmentDateTime && slotEnd >= addMinutes(appointmentDateTime, duration))
        ) {
          occupiedTimes.add(slot);
        }
      }
    }
  }
  
  console.log('\n🚫 Slots ocupados (' + occupiedTimes.size + '):');
  console.log('   ', Array.from(occupiedTimes).join(', '));
  
  // 8. Filtrar por tiempo mínimo de anticipación
  const now = new Date();
  const minAdvanceTime = new Date(now);
  minAdvanceTime.setHours(now.getHours() + settings.min_advance_hours);
  
  console.log('\n⏳ Filtro de anticipación:');
  console.log('   Hora actual:', now.toLocaleTimeString('es-MX'));
  console.log('   Tiempo mínimo requerido:', minAdvanceTime.toLocaleTimeString('es-MX'));
  
  const availableSlots = allSlots
    .filter(slot => !occupiedTimes.has(slot))
    .filter(slot => {
      const slotDateTime = parse(slot, 'HH:mm', requestedDate);
      return slotDateTime >= minAdvanceTime;
    });
  
  console.log('\n✅ SLOTS DISPONIBLES PARA HOY (' + availableSlots.length + '):');
  if (availableSlots.length > 0) {
    console.log('   ', availableSlots.join(', '));
  } else {
    console.log('   ❌ NINGUNO');
    console.log('\n🔍 Análisis:');
    
    const slotsAfterNow = allSlots.filter(slot => {
      const slotDateTime = parse(slot, 'HH:mm', requestedDate);
      return slotDateTime >= minAdvanceTime;
    });
    
    console.log('   Slots después del tiempo mínimo:', slotsAfterNow.length);
    console.log('      ', slotsAfterNow.join(', '));
    console.log('   Slots no ocupados:', allSlots.filter(slot => !occupiedTimes.has(slot)).length);
    console.log('      ', allSlots.filter(slot => !occupiedTimes.has(slot)).join(', '));
  }
}

debugAvailabilityToday().catch(console.error);
