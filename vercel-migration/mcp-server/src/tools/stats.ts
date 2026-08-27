import { z } from 'zod';
import { supabase } from '../utils/supabase.js';
import { clinicDateStringRangeUtc, dateStringInTimezone } from '../utils/timezone.js';

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
      // Adenda V2.1, A-5: fecha local de la clínica, no el día UTC del proceso
      const date = validatedArgs.date || dateStringInTimezone(new Date());
      const { startUtc, endUtc } = clinicDateStringRangeUtc(date);

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('status, price')
        .gte('start_time', startUtc.toISOString())
        .lt('start_time', endUtc.toISOString());

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

      const endDateObj = new Date(startDate);
      endDateObj.setDate(endDateObj.getDate() + 7);
      const endDate = endDateObj.toISOString().split('T')[0];

      // Adenda V2.1, A-5: rango de la semana en hora local de la clinica,
      // no strings sin offset interpretados como UTC (ambos limites deben
      // pasar por el mismo calculo, o quedan corridos entre si)
      const { startUtc: weekStartUtc } = clinicDateStringRangeUtc(startDate);
      const { startUtc: weekEndUtc } = clinicDateStringRangeUtc(endDate);

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('status, price, patient_id')
        .gte('start_time', weekStartUtc.toISOString())
        .lt('start_time', weekEndUtc.toISOString());

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const uniquePatients = new Set(appointments?.map(a => a.patient_id) || []);

      return {
        success: true,
        period: {
          start: startDate,
          end: endDate
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
