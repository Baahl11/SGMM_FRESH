import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // PATIENTS sheet
    const patientsData = [
      {
        'Nombre': 'Juan Pérez García',
        'Teléfono': '5551234567',
        'Email': 'juan.perez@email.com',
        'Fecha de Nacimiento': '15/03/1985',
        'Notas': 'Paciente regular, prefiere citas por la tarde'
      },
      {
        'Nombre': 'María González López',
        'Teléfono': '5559876543',
        'Email': 'maria.gonzalez@email.com',
        'Fecha de Nacimiento': '22/07/1990',
        'Notas': 'Alergias: Penicilina'
      },
      {
        'Nombre': 'Carlos Rodríguez',
        'Teléfono': '5554567890',
        'Email': '',
        'Fecha de Nacimiento': '10/11/1978',
        'Notas': ''
      }
    ];

    const patientsSheet = XLSX.utils.json_to_sheet(patientsData);
    
    // Set column widths
    patientsSheet['!cols'] = [
      { wch: 30 }, // Nombre
      { wch: 15 }, // Teléfono
      { wch: 30 }, // Email
      { wch: 18 }, // Fecha de Nacimiento
      { wch: 50 }  // Notas
    ];

    XLSX.utils.book_append_sheet(workbook, patientsSheet, 'PACIENTES');

    // APPOINTMENTS sheet (optional)
    const appointmentsData = [
      {
        'Nombre del Paciente': 'Juan Pérez García',
        'Fecha': '01/12/2025',
        'Hora': '10:00',
        'Tratamiento': 'Consulta General',
        'Estado': 'pendiente',
        'Notas': 'Primera consulta'
      },
      {
        'Nombre del Paciente': 'María González López',
        'Fecha': '02/12/2025',
        'Hora': '14:30',
        'Tratamiento': 'Limpieza Dental',
        'Estado': 'confirmada',
        'Notas': ''
      },
      {
        'Nombre del Paciente': 'Carlos Rodríguez',
        'Fecha': '03/12/2025',
        'Hora': '16:00',
        'Tratamiento': 'Revisión',
        'Estado': 'pendiente',
        'Notas': 'Seguimiento de tratamiento'
      }
    ];

    const appointmentsSheet = XLSX.utils.json_to_sheet(appointmentsData);
    
    // Set column widths
    appointmentsSheet['!cols'] = [
      { wch: 30 }, // Nombre del Paciente
      { wch: 12 }, // Fecha
      { wch: 10 }, // Hora
      { wch: 20 }, // Tratamiento
      { wch: 12 }, // Estado
      { wch: 40 }  // Notas
    ];

    XLSX.utils.book_append_sheet(workbook, appointmentsSheet, 'CITAS');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="AgendaMedPro_Plantilla_Importacion.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar plantilla' },
      { status: 500 }
    );
  }
}
