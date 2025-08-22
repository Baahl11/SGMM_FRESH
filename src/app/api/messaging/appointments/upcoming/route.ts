import { NextRequest, NextResponse } from 'next/server';

// Configuration for Next.js static export
export const dynamic = 'force-dynamic';
export const revalidate = false;

// Usar backend Tauri embebido según documentación TAURI_AGENDA_ENDPOINTS_FIX_COMPLETE.md
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Interfaces for type safety
interface Patient {
  id: number;
  email?: string;
  phone?: string;
  telefono?: string;
  whatsapp?: string;
  name?: string;
  [key: string]: any;
}

interface Appointment {
  id: number;
  patient_id: number;
  appointment_date: string;
  appointment_time: string;
  patient_name?: string;
  duration_minutes?: number;
  notes?: string;
  [key: string]: any;
}

interface AppointmentWithContact {
  id: number;
  patient_id: number;
  fecha: string; // Using fecha format for messaging system compatibility
  appointment_time: string;
  patient_name: string;
  treatment_name: string;
  duration_minutes: number;
  patient_email: string;
  patient_phone: string;
  patient_whatsapp: string;
  patient_full_data: Patient;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '7';
    
    console.log(`🔍 Getting upcoming appointments for next ${days} days...`);
    console.log(`🌐 Using API_BASE: ${API_BASE}`);
    
    // Primero intentar obtener datos reales de las APIs de appointments y patients
    let realData: AppointmentWithContact[] = [];
    let usingRealData = false;
    
    try {
      console.log('🔄 Attempting to fetch real appointment data...');
      
      // Calcular fechas para el rango solicitado
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + parseInt(days));
      
      const dateFrom = today.toISOString().split('T')[0];
      const dateTo = futureDate.toISOString().split('T')[0];
      
      // Intentar obtener appointments con nombres desde la API existente
      const appointmentsResponse = await fetch(`${API_BASE}/api/appointments/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // En producción, aquí habría que pasar el token de autenticación
        },
      });
      
      if (appointmentsResponse.ok) {
        const appointmentsResult = await appointmentsResponse.json();
        const appointmentsData = appointmentsResult.success ? appointmentsResult.data : appointmentsResult;
        console.log(`✅ Found ${appointmentsData.length || 0} real appointments`);
        
        // Si encontramos citas reales, obtener información completa de pacientes
        if (appointmentsData && appointmentsData.length > 0) {
          const patientsResponse = await fetch(`${API_BASE}/api/patients/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // En producción, aquí habría que pasar el token de autenticación
            },
          });
          
          if (patientsResponse.ok) {
            const patientsResult = await patientsResponse.json();
            const patientsData = patientsResult.success ? patientsResult.data : patientsResult;
            console.log(`✅ Found ${patientsData.length || 0} patients for contact info`);
            
            // Filtrar citas por rango de fechas solicitado
            const filteredAppointments = filterAppointmentsByDateRange(appointmentsData, days);
            console.log(`📅 After filtering by ${days} days: ${filteredAppointments.length} appointments`);
            
            // Combinar appointments con patient data
            realData = combineAppointmentsWithPatients(filteredAppointments, patientsData);
            usingRealData = realData.length > 0;
            
            if (usingRealData) {
              console.log('🎯 Successfully using real data from backend');
              const stats = calculateStatsFromReal(realData);
              return NextResponse.json({
                success: true,
                data: realData,
                stats: stats,
                total: realData.length,
                demo_mode: false,
                source: 'backend_api'
              });
            }
          }
        }
      }
    } catch (realDataError) {
      console.warn('⚠️ Could not fetch real data, falling back to demo:', realDataError instanceof Error ? realDataError.message : 'Unknown error');
    }
    
    // Si no pudimos obtener datos reales, usar datos de demo
    console.log('🎭 Using demo data for messaging system');
    return NextResponse.json({
      success: true,
      data: getDemoAppointments(),
      stats: getDemoStats(), 
      total: 3,
      demo_mode: true,
      source: 'demo_data',
      fallback_reason: 'backend_unavailable'
    });
    
  } catch (error) {
    console.error('💥 Error al obtener citas próximas:', error);
    return NextResponse.json({
      success: true,
      data: getDemoAppointments(),
      stats: getDemoStats(),
      total: 3,
      demo_mode: true,
      source: 'demo_data',
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Filtrar appointments por rango de fechas
function filterAppointmentsByDateRange(appointments: any[], days: string): any[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Inicio del día de hoy
  
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + parseInt(days));
  futureDate.setHours(23, 59, 59, 999); // Final del día límite
  
  console.log('📅 Filtering appointments between:', {
    from: today.toISOString(),
    to: futureDate.toISOString(),
    days: days
  });
  
  return appointments.filter(apt => {
    if (!apt.appointment_date) return false;
    
    const aptDate = new Date(apt.appointment_date + 'T00:00:00'); // Crear fecha sin timezone
    
    const isInRange = aptDate >= today && aptDate <= futureDate;
    
    if (isInRange) {
      console.log(`✅ Including appointment: ${apt.appointment_date} for patient ${apt.patient_id}`);
    }
    
    return isInRange;
  });
}

// Combinar appointments del backend con información de pacientes
function combineAppointmentsWithPatients(appointments: any[], patients: any[]): AppointmentWithContact[] {
  const patientsMap = new Map();
  patients.forEach(patient => {
    patientsMap.set(patient.id, patient);
  });

  console.log('🔗 Combining appointments with patients:', {
    appointments: appointments.length,
    patients: patients.length,
    sampleAppointment: appointments[0],
    samplePatient: patients[0]
  });

  return appointments
    .filter(apt => apt.appointment_date && apt.appointment_time)
    .map((apt): AppointmentWithContact => {
      const patient = patientsMap.get(apt.patient_id) || {};
      
      // Combinar fecha y hora en formato ISO
      const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}:00`);
      
      // Crear objeto combinado
      const combined = {
        id: apt.id,
        patient_id: apt.patient_id,
        fecha: appointmentDateTime.toISOString(),
        appointment_time: apt.appointment_time,
        patient_name: patient.nombre || patient.name || `Paciente ID ${apt.patient_id}`,
        treatment_name: 'Consulta General', // TODO: obtener nombre real del tratamiento
        duration_minutes: apt.duration_minutes || 60,
        patient_email: patient.email || '',
        patient_phone: patient.telefono || patient.phone || '',
        patient_whatsapp: patient.whatsapp || patient.telefono || patient.phone || '',
        patient_full_data: {
          id: patient.id,
          name: patient.nombre || patient.name,
          email: patient.email,
          phone: patient.telefono || patient.phone,
          whatsapp: patient.whatsapp || patient.telefono || patient.phone,
          ...patient
        },
        reminder_sent: false,
        reminder_type: calculateReminderType(appointmentDateTime),
        status: apt.status || 'confirmed'
      };
      
      console.log('🔗 Combined appointment:', {
        id: combined.id,
        patient_name: combined.patient_name,
        fecha: combined.fecha,
        reminder_type: combined.reminder_type
      });
      
      return combined;
    })
    .filter(apt => {
      // Solo incluir citas futuras
      const now = new Date();
      const appointmentDate = new Date(apt.fecha);
      return appointmentDate > now;
    });
}

// Calcular el tipo de recordatorio basado en el tiempo hasta la cita
function calculateReminderType(appointmentDate: Date): string {
  const now = new Date();
  const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntil <= 2) return '2h';
  if (hoursUntil <= 24) return '24h';
  if (hoursUntil <= 48) return '48h';
  return '7d';
}

// Calcular estadísticas de datos reales
function calculateStatsFromReal(appointments: AppointmentWithContact[]) {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.fecha);
    aptDate.setHours(0, 0, 0, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    return aptDate.getTime() === todayDate.getTime();
  }).length;

  const withEmail = appointments.filter(apt => apt.patient_email && apt.patient_email.includes('@')).length;
  const withPhone = appointments.filter(apt => apt.patient_phone && apt.patient_phone.length >= 10).length;
  const uniquePatients = new Set(appointments.map(apt => apt.patient_id)).size;
  
  // Calcular recordatorios pendientes basados en timing
  const now = new Date();
  const pendingReminders = appointments.filter(apt => {
    const aptDate = new Date(apt.fecha);
    const hoursUntil = (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil <= 48 && hoursUntil > 0 && !apt.reminder_sent;
  }).length;

  return {
    total_appointments: appointments.length,
    today_appointments: todayAppointments,
    with_email: withEmail,
    with_phone: withPhone,
    unique_patients: uniquePatients,
    pending_reminders: pendingReminders,
    contact_coverage: {
      email_percentage: appointments.length > 0 ? Math.round((withEmail / appointments.length) * 100) : 0,
      phone_percentage: appointments.length > 0 ? Math.round((withPhone / appointments.length) * 100) : 0,
    }
  };
}

// Datos de demo para cuando el backend no esté disponible
function getDemoAppointments(): AppointmentWithContact[] {
  const now = new Date();
  
  // Crear citas EXACTAMENTE en los rangos de recordatorio para testing
  const exactTime24h = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // Exactamente 24h
  const exactTime2h = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // Exactamente 2h
  const exactTime48h = new Date(now.getTime() + (48 * 60 * 60 * 1000)); // 48h para control
  
  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatISO = (date: Date) => {
    return date.toISOString();
  };

  // Logging para debug
  console.log('🕐 Generando citas demo:');
  console.log(`   Ahora: ${now.toISOString()}`);
  console.log(`   24h: ${exactTime24h.toISOString()}`);
  console.log(`   2h: ${exactTime2h.toISOString()}`);
  
  const appointments: AppointmentWithContact[] = [
    {
      id: 1,
      patient_id: 101,
      fecha: formatISO(exactTime24h), // ISO format for exact timing
      appointment_time: formatTime(exactTime24h),
      patient_name: 'María García',
      treatment_name: 'Limpieza Dental',
      duration_minutes: 60,
      patient_email: 'maria.garcia@email.com',
      patient_phone: '+52 555 123 4567',
      patient_whatsapp: '+52 555 123 4567',
      patient_full_data: {
        id: 101,
        name: 'María García',
        email: 'maria.garcia@email.com',
        phone: '+52 555 123 4567',
        whatsapp: '+52 555 123 4567'
      },
      reminder_sent: false,
      reminder_type: '24h',
      status: 'confirmed'
    },
    {
      id: 2,
      patient_id: 102,
      fecha: formatISO(exactTime2h), // ISO format for exact timing
      appointment_time: formatTime(exactTime2h),
      patient_name: 'Carlos López',
      treatment_name: 'Consulta General',
      duration_minutes: 45,
      patient_email: 'carlos.lopez@email.com',
      patient_phone: '+52 555 987 6543',
      patient_whatsapp: '+52 555 987 6543',
      patient_full_data: {
        id: 102,
        name: 'Carlos López',
        email: 'carlos.lopez@email.com',
        phone: '+52 555 987 6543',
        whatsapp: '+52 555 987 6543'
      },
      reminder_sent: false,
      reminder_type: '2h',
      status: 'confirmed'
    },
    {
      id: 3,
      patient_id: 103,
      fecha: formatISO(exactTime48h), // ISO format for exact timing
      appointment_time: formatTime(exactTime48h),
      patient_name: 'Ana Martínez',
      treatment_name: 'Endodoncia',
      duration_minutes: 90,
      patient_email: 'ana.martinez@email.com',
      patient_phone: '+52 555 456 7890',
      patient_whatsapp: '+52 555 456 7890',
      patient_full_data: {
        id: 103,
        name: 'Ana Martínez',
        email: 'ana.martinez@email.com',
        phone: '+52 555 456 7890',
        whatsapp: '+52 555 456 7890'
      },
      reminder_sent: false,
      reminder_type: '48h',
      status: 'pending'
    }
  ];

  // Debug logging para verificar tiempos exactos
  appointments.forEach((apt, index) => {
    const aptDate = new Date(apt.fecha);
    const hoursUntil = (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const timeFormatted = aptDate.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    console.log(`📅 ${apt.patient_name}: en ${hoursUntil.toFixed(2)} horas (${timeFormatted})`);
  });

  console.log('🕐 Hora actual:', now.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }));

  return appointments;
}

function getDemoStats() {
  return {
    total_appointments: 3,
    today_appointments: 0,
    with_email: 3,
    with_phone: 3,
    unique_patients: 3,
    pending_reminders: 3
  };
}
