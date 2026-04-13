import { z } from 'zod';
import { supabase } from '../utils/supabase.js';

const getDayStatsSchema = z.object({
  date: z.string().optional().describe('Fecha en formato YYYY-MM-DD. Default: hoy'),
});

export const statsTools = [
  {
    name: 'get_day_stats',
    description: 'Obtiene estadísticas completas del día: total de citas, estados, ingresos totales',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Fecha en formato YYYY-MM-DD. Si no se especifica, usa hoy.'
        }
      }
    },
    handler: async (args: unknown) => {
      const validatedArgs = getDayStatsSchema.parse(args);
      const date = validatedArgs.date || new Date().toISOString().split('T')[0];

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('status, price')
        .gte('start_time', `${date}T00:00:00`)
        .lte('start_time', `${date}T23:59:59`);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const stats = {
        total: appointments?.length || 0,
        confirmed: appointments?.filter(a => a.status === 'confirmed').length || 0,
        cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
        completed: appointments?.filter(a => a.status === 'completed').length || 0,
        pending: appointments?.filter(a => a.status === 'pending').length || 0,
        totalIncome: appointments?.reduce((sum, a) => sum + (a.price || 0), 0) || 0,
      };

      return {
        success: true,
        date,
        stats
      };
    }
  },

  {
    name: 'get_week_summary',
    description: 'Obtiene resumen de la semana: total de citas, ingresos, pacientes atendidos',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Fecha de inicio en formato YYYY-MM-DD. Default: inicio de semana actual'
        }
      }
    },
    handler: async (args: any) => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const startDate = args.start_date || startOfWeek.toISOString().split('T')[0];
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('status, price, patient_id')
        .gte('start_time', `${startDate}T00:00:00`)
        .lt('start_time', endDate.toISOString());

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const uniquePatients = new Set(appointments?.map(a => a.patient_id) || []);

      return {
        success: true,
        period: {
          start: startDate,
          end: endDate.toISOString().split('T')[0]
        },
        summary: {
          total_appointments: appointments?.length || 0,
          completed: appointments?.filter(a => a.status === 'completed').length || 0,
          total_income: appointments?.reduce((sum, a) => sum + (a.price || 0), 0) || 0,
          unique_patients: uniquePatients.size
        }
      };
    }
  }
];
