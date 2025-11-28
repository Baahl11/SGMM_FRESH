import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get user from auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const results = {
      success: 0,
      errors: [] as Array<{ row: number; field: string; message: string }>,
      total: 0,
    };

    // Process PATIENTS sheet
    if (workbook.SheetNames.includes('PACIENTES')) {
      const patientsSheet = workbook.Sheets['PACIENTES'];
      const patientsData = XLSX.utils.sheet_to_json(patientsSheet);

      for (let i = 0; i < patientsData.length; i++) {
        const row: any = patientsData[i];
        results.total++;

        try {
          // Validate required fields
          if (!row['Nombre'] || row['Nombre'].toString().trim() === '') {
            results.errors.push({
              row: i + 2, // +2 because Excel is 1-indexed and has header
              field: 'Nombre',
              message: 'El nombre es obligatorio',
            });
            continue;
          }

          // Prepare patient data
          const patientData: any = {
            user_id: user.id,
            nombre: row['Nombre'].toString().trim(),
            telefono: row['Teléfono'] ? row['Teléfono'].toString().trim() : null,
            email: row['Email'] ? row['Email'].toString().trim() : null,
            fecha_nacimiento: row['Fecha de Nacimiento'] ? parseDate(row['Fecha de Nacimiento']) : null,
            notas: row['Notas'] ? row['Notas'].toString() : null,
            created_at: new Date().toISOString(),
          };

          // Insert patient
          const { error } = await supabase
            .from('patients')
            .insert([patientData]);

          if (error) {
            results.errors.push({
              row: i + 2,
              field: 'General',
              message: error.message,
            });
          } else {
            results.success++;
          }
        } catch (error: any) {
          results.errors.push({
            row: i + 2,
            field: 'General',
            message: error.message || 'Error desconocido',
          });
        }
      }
    }

    // Process APPOINTMENTS sheet (optional)
    if (workbook.SheetNames.includes('CITAS')) {
      const appointmentsSheet = workbook.Sheets['CITAS'];
      const appointmentsData = XLSX.utils.sheet_to_json(appointmentsSheet);

      for (let i = 0; i < appointmentsData.length; i++) {
        const row: any = appointmentsData[i];
        results.total++;

        try {
          // Validate required fields
          if (!row['Nombre del Paciente']) {
            results.errors.push({
              row: i + 2,
              field: 'Nombre del Paciente',
              message: 'El nombre del paciente es obligatorio',
            });
            continue;
          }

          if (!row['Fecha'] || !row['Hora']) {
            results.errors.push({
              row: i + 2,
              field: 'Fecha/Hora',
              message: 'La fecha y hora son obligatorias',
            });
            continue;
          }

          // Find patient by name
          const { data: patients, error: findError } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', user.id)
            .eq('nombre', row['Nombre del Paciente'].toString().trim())
            .limit(1);

          if (findError || !patients || patients.length === 0) {
            results.errors.push({
              row: i + 2,
              field: 'Paciente',
              message: 'Paciente no encontrado. Asegúrate de importar pacientes primero.',
            });
            continue;
          }

          // Parse date and time
          const appointmentDate = parseDate(row['Fecha']);
          const appointmentTime = row['Hora'].toString().trim();
          const dateTime = combineDateTime(appointmentDate, appointmentTime);

          // Prepare appointment data
          const appointmentData: any = {
            user_id: user.id,
            patient_id: patients[0].id,
            fecha_hora: dateTime,
            tratamiento: row['Tratamiento'] ? row['Tratamiento'].toString() : 'Consulta General',
            estado: row['Estado'] ? row['Estado'].toString() : 'pendiente',
            notas: row['Notas'] ? row['Notas'].toString() : null,
            created_at: new Date().toISOString(),
          };

          // Insert appointment
          const { error } = await supabase
            .from('appointments')
            .insert([appointmentData]);

          if (error) {
            results.errors.push({
              row: i + 2,
              field: 'General',
              message: error.message,
            });
          } else {
            results.success++;
          }
        } catch (error: any) {
          results.errors.push({
            row: i + 2,
            field: 'General',
            message: error.message || 'Error desconocido',
          });
        }
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar el archivo' },
      { status: 500 }
    );
  }
}

// Helper function to parse dates
function parseDate(dateValue: any): string | null {
  if (!dateValue) return null;

  try {
    // If it's an Excel serial number
    if (typeof dateValue === 'number') {
      const date = XLSX.SSF.parse_date_code(dateValue);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }

    // If it's a string, try to parse it
    if (typeof dateValue === 'string') {
      // Try DD/MM/YYYY format
      const parts = dateValue.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Helper function to combine date and time
function combineDateTime(date: string | null, time: string): string {
  if (!date) {
    throw new Error('Fecha inválida');
  }

  // Parse time (assume format like "14:30" or "2:30 PM")
  let hours = 0;
  let minutes = 0;

  const timeClean = time.trim().toUpperCase();
  const isPM = timeClean.includes('PM');
  const isAM = timeClean.includes('AM');

  const timeParts = timeClean.replace(/[APM\s]/g, '').split(':');
  if (timeParts.length >= 2) {
    hours = parseInt(timeParts[0]);
    minutes = parseInt(timeParts[1]);

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
  }

  return `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}
