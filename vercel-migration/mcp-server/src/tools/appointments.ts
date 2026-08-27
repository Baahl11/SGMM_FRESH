import { z } from 'zod';
import { supabase } from '../utils/supabase.js';
import { clinicDateStringRangeUtc, dateStringInTimezone } from '../utils/timezone.js';

// Schema de validación para get_appointments
const getAppointmentsSchema = z.object({
  date: z.string().optional().describe('Fecha en formato YYYY-MM-DD. Si no se especifica, usa hoy.'),
  status: z.enum(['confirmed', 'cancelled', 'completed', 'pending']).optional().describe('Filtrar por estado'),
});

// Schema para create_appointment
const createAppointmentSchema = z.object({
  patient_id: z.string().describe('ID del paciente'),
  start_time: z.string().describe('Hora de inicio en formato ISO 8601'),
  duration_minutes: z.number().describe('Duración de la cita en minutos'),
  notes: z.string().optional().describe('Notas adicionales de la cita'),
  price: z.number().optional().describe('Precio de la consulta'),
});

export const appointmentTools = [
  {
    name: 'get_appointments',
    description: 'Obtiene las citas de una fecha específica con información del paciente. Si no se especifica fecha, devuelve las citas de hoy.',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Fecha en formato YYYY-MM-DD. Si no se especifica, usa hoy.'
        },
        status: {
          type: 'string',
          enum: ['confirmed', 'cancelled', 'completed', 'pending'],
          description: 'Filtrar por estado de la cita (opcional)'
        }
      }
    },
    handler: async (args: unknown) => {
      // Validar argumentos con Zod
      const validatedArgs = getAppointmentsSchema.parse(args);
      // Adenda V2.1, A-5: fecha local de la clínica, no el día UTC del proceso
      const date = validatedArgs.date || dateStringInTimezone(new Date());
      const { startUtc, endUtc } = clinicDateStringRangeUtc(date);

      let query = supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          price,
          treatment_id,
          patient:patients(
            id,
            name,
            phone,
            email
          )
        `)
        .gte('start_time', startUtc.toISOString())
        .lt('start_time', endUtc.toISOString())
        .order('start_time', { ascending: true });
      
      if (validatedArgs.status) {
        query = query.eq('status', validatedArgs.status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        date,
        total: data?.length || 0,
        appointments: data || []
      };
    }
  },

  {
    name: 'create_appointment',
    description: 'Crea una nueva cita médica para un paciente existente',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: {
          type: 'string',
          description: 'ID del paciente (UUID)'
        },
        start_time: {
          type: 'string',
          description: 'Fecha y hora de inicio en formato ISO 8601 (ej: 2026-01-26T10:00:00)'
        },
        duration_minutes: {
          type: 'number',
          description: 'Duración de la cita en minutos (ej: 30, 60)'
        },
        notes: {
          type: 'string',
          description: 'Notas o motivo de la consulta (opcional)'
        },
        price: {
          type: 'number',
          description: 'Precio de la consulta en MXN (opcional)'
        }
      },
      required: ['patient_id', 'start_time', 'duration_minutes']
    },
    handler: async (args: unknown) => {
      const validatedArgs = createAppointmentSchema.parse(args);
      
      // Calcular end_time
      const startTime = new Date(validatedArgs.start_time);
      const endTime = new Date(startTime.getTime() + validatedArgs.duration_minutes * 60000);

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: validatedArgs.patient_id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'confirmed',
          notes: validatedArgs.notes || '',
          price: validatedArgs.price || 0,
        })
        .select(`
          id,
          start_time,
          end_time,
          status,
          patient:patients(name, phone)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to create appointment: ${error.message}`);
      }

      return {
        success: true,
        message: 'Cita creada exitosamente',
        appointment: data
      };
    }
  },

  {
    name: 'cancel_appointment',
    description: 'Cancela una cita existente por su ID',
    inputSchema: {
      type: 'object',
      properties: {
        appointment_id: {
          type: 'string',
          description: 'ID de la cita a cancelar (UUID)'
        },
        reason: {
          type: 'string',
          description: 'Motivo de la cancelación (opcional)'
        }
      },
      required: ['appointment_id']
    },
    handler: async (args: any) => {
      const { appointment_id, reason } = args;

      const updateData: any = { status: 'cancelled' };
      if (reason) {
        updateData.notes = reason;
      }

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointment_id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to cancel appointment: ${error.message}`);
      }

      return {
        success: true,
        message: 'Cita cancelada exitosamente',
        appointment: data
      };
    }
  }
];
