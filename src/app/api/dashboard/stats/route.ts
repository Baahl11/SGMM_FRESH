import { NextResponse } from 'next/server'

export async function GET() {
  console.log('[API] dashboard-stats: Serving standalone data for MSI')
  
  // Datos completamente autónomos para MSI - sin backend externo
  return NextResponse.json({
    total_patients: 127,
    total_treatments: 8,
    total_records: 342,
    total_revenue: 2150000,
    total_costs: 890000,
    total_profit: 1260000,
    monthly_revenue: 380000,
    monthly_gross_profit: 290000,
    monthly_fixed_costs: 85000,
    monthly_net_profit: 205000,
    monthly_margin_percentage: 53.9,
    billingStats: {
      billedRevenue: 320000,
      nonBilledRevenue: 60000,
      billedPercentage: 84.2
    },
    paymentMethods: {
      efectivo: 180000,
      tarjeta: 120000,
      transferencia: 80000
    },
    fixedCostsBreakdown: [
      {
        concepto: 'Renta del Consultorio',
        monto: 15000,
        frecuencia: 'mensual',
        monto_mensual: 15000
      },
      {
        concepto: 'Servicios (Luz, Agua, Internet)',
        monto: 3500,
        frecuencia: 'mensual', 
        monto_mensual: 3500
      },
      {
        concepto: 'Seguro Médico Profesional',
        monto: 2800,
        frecuencia: 'mensual',
        monto_mensual: 2800
      }
    ]
  })
}
