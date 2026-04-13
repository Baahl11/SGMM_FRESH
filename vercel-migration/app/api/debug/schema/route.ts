import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  // Check patients table structure
  const { data: patientsData, error: patientsError } = await supabase
    .from('patients')
    .select('*')
    .limit(1);

  // Check appointments table structure
  const { data: appointmentsData, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*, patient:patients(*)')
    .limit(1);

  return NextResponse.json({
    patients: {
      sample: patientsData,
      error: patientsError,
      columns: patientsData?.[0] ? Object.keys(patientsData[0]) : []
    },
    appointments: {
      sample: appointmentsData,
      error: appointmentsError,
      columns: appointmentsData?.[0] ? Object.keys(appointmentsData[0]) : []
    }
  });
}
