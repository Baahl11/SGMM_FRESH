import { NextResponse } from 'next/server';

// Datos de ejemplo para el historial de notificaciones
// En el futuro esto se leerá de la base de datos
const mockLogs = [
  {
    id: 1,
    appointment_id: 101,
    patient_name: 'María González',
    notification_type: 'email',
    status: 'sent',
    scheduled_for: new Date(Date.now() - 86400000).toISOString(), // Hace 1 día
    sent_at: new Date(Date.now() - 86400000 + 300000).toISOString(), // 5 minutos después
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2,
    appointment_id: 102,
    patient_name: 'Carlos Ruiz',
    notification_type: 'whatsapp',
    status: 'failed',
    scheduled_for: new Date(Date.now() - 43200000).toISOString(), // Hace 12 horas
    error_message: 'Número de teléfono inválido',
    created_at: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 3,
    appointment_id: 103,
    patient_name: 'Ana López',
    notification_type: 'email',
    status: 'pending',
    scheduled_for: new Date(Date.now() + 7200000).toISOString(), // En 2 horas
    created_at: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
  },
  {
    id: 4,
    appointment_id: 104,
    patient_name: 'Roberto Mendoza',
    notification_type: 'whatsapp',
    status: 'sent',
    scheduled_for: new Date(Date.now() - 7200000).toISOString(), // Hace 2 horas
    sent_at: new Date(Date.now() - 7200000 + 180000).toISOString(), // 3 minutos después
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 5,
    appointment_id: 105,
    patient_name: 'Laura Fernández',
    notification_type: 'email',
    status: 'sent',
    scheduled_for: new Date(Date.now() - 172800000).toISOString(), // Hace 2 días
    sent_at: new Date(Date.now() - 172800000 + 120000).toISOString(), // 2 minutos después
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

export async function GET() {
  try {
    // Ordenar por fecha de creación (más recientes primero)
    const sortedLogs = mockLogs.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(sortedLogs);
  } catch (error) {
    console.error('Error loading notification logs:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
