import { z } from 'zod';
import { supabase } from '../utils/supabase.js';

const searchPatientsSchema = z.object({
  query: z.string().describe('Nombre o apellido del paciente a buscar'),
  limit: z.number().optional().default(10).describe('Número máximo de resultados'),
});

const getPatientByIdSchema = z.object({
  patient_id: z.string().describe('ID del paciente (UUID)'),
});

export const patientTools = [
  {
    name: 'search_patients',
    description: 'Busca pacientes por nombre o apellido en la base de datos',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Nombre o apellido del paciente a buscar'
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (default: 10)'
        }
      },
      required: ['query']
    },
    handler: async (args: unknown) => {
      const validatedArgs = searchPatientsSchema.parse(args);
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, phone, email, date_of_birth, created_at')
        .ilike('name', `%${validatedArgs.query}%`)
        .limit(validatedArgs.limit)
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        query: validatedArgs.query,
        total: data?.length || 0,
        patients: data || []
      };
    }
  },

  {
    name: 'get_patient_details',
    description: 'Obtiene información detallada de un paciente específico por su ID, incluyendo historial de citas',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: {
          type: 'string',
          description: 'ID del paciente (UUID)'
        }
      },
      required: ['patient_id']
    },
    handler: async (args: unknown) => {
      const { patient_id } = getPatientByIdSchema.parse(args);

      // Obtener datos del paciente
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patient_id)
        .single();

      if (patientError) {
        throw new Error(`Patient not found: ${patientError.message}`);
      }

      // Obtener historial de citas
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, start_time, end_time, status, notes, price')
        .eq('patient_id', patient_id)
        .order('start_time', { ascending: false })
        .limit(10);

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
      }

      return {
        success: true,
        patient,
        appointments: appointments || [],
        total_appointments: appointments?.length || 0
      };
    }
  },

  {
    name: 'create_patient',
    description: 'Crea un nuevo paciente en el sistema',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nombre completo del paciente'
        },
        phone: {
          type: 'string',
          description: 'Teléfono de contacto'
        },
        email: {
          type: 'string',
          description: 'Correo electrónico (opcional)'
        },
        date_of_birth: {
          type: 'string',
          description: 'Fecha de nacimiento en formato YYYY-MM-DD (opcional)'
        }
      },
      required: ['name', 'phone']
    },
    handler: async (args: any) => {
      const { name, phone, email, date_of_birth } = args;

      const { data, error } = await supabase
        .from('patients')
        .insert({
          name,
          phone,
          email: email || null,
          date_of_birth: date_of_birth || null
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create patient: ${error.message}`);
      }

      return {
        success: true,
        message: 'Paciente creado exitosamente',
        patient: data
      };
    }
  }
];
