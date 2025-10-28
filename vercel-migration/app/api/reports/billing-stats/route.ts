import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all invoices for the user (invoices are already filtered by RLS in Supabase)
    // Supabase RLS ensures users only see their own invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        id,
        patient_id,
        fecha_emision,
        total,
        subtotal,
        iva,
        status,
        serie,
        folio_number,
        emailed_at,
        patients!patient_id (
          id,
          nombre,
          apellido
        )
      `)
      .order('fecha_emision', { ascending: false });

    if (invoicesError) {
      console.error('[API /billing-stats] Error fetching invoices:', invoicesError);
      return NextResponse.json({ error: 'Error fetching invoices' }, { status: 500 });
    }

    const allInvoices = invoices || [];

    // Calculate statistics
    const totalAmount = allInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalCount = allInvoices.length;
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;

    // Current month stats
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthInvoices = allInvoices.filter(inv => 
      new Date(inv.fecha_emision) >= currentMonthStart
    );
    const currentMonthTotal = currentMonthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Monthly trend (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthInvoices = allInvoices.filter(inv => {
        const invDate = new Date(inv.fecha_emision);
        return invDate >= monthStart && invDate <= monthEnd;
      });

      const monthTotal = monthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const monthCount = monthInvoices.length;

      monthlyData.push({
        month: monthDate.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }),
        monthFull: monthDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
        total: monthTotal,
        count: monthCount,
        average: monthCount > 0 ? monthTotal / monthCount : 0,
      });
    }

    // Top patients by total billed
    const patientTotals = new Map<string, { 
      patient_id: string;
      name: string; 
      total: number; 
      count: number 
    }>();

    allInvoices.forEach(inv => {
      const patientId = inv.patient_id;
      
      // Handle both single object and array responses from Supabase
      const patientData = Array.isArray(inv.patients) ? inv.patients[0] : inv.patients;
      const patientName = patientData 
        ? `${patientData.nombre || ''} ${patientData.apellido || ''}`.trim() 
        : 'Paciente Desconocido';

      if (!patientTotals.has(patientId)) {
        patientTotals.set(patientId, {
          patient_id: patientId,
          name: patientName,
          total: 0,
          count: 0,
        });
      }

      const patient = patientTotals.get(patientId)!;
      patient.total += inv.total || 0;
      patient.count += 1;
    });

    const topPatients = Array.from(patientTotals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Status breakdown
    const statusBreakdown = {
      issued: allInvoices.filter(inv => inv.status === 'issued').length,
      sent: allInvoices.filter(inv => inv.status === 'sent' || inv.emailed_at).length,
      cancelled: allInvoices.filter(inv => inv.status === 'cancelled').length,
    };

    return NextResponse.json({
      summary: {
        totalAmount,
        totalCount,
        averageAmount,
        currentMonthTotal,
        currentMonthCount: currentMonthInvoices.length,
      },
      monthlyTrend: monthlyData,
      topPatients,
      statusBreakdown,
    });

  } catch (error) {
    console.error('[API /billing-stats] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
