/**
 * Componente de Ejemplo: Dashboard de Reportes de Ventas por Equipo
 * 
 * Ubicación sugerida: app/admin/sales-reports/page.tsx
 * 
 * Este componente muestra:
 * - Ventas totales por equipo
 * - Comisiones ganadas
 * - Gráficos de distribución
 * - Lista de últimas ventas
 */

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, DollarSign, Building2 } from 'lucide-react'

// Tipos
type SalesTeam = 'internal' | 'distributor'

type SalesMetrics = {
  team: SalesTeam
  totalSales: number
  activeSubscriptions: number
  grossRevenue: number
  platformFees: number
  netRevenue: number
}

type RecentSale = {
  id: string
  created_at: string
  sales_team: SalesTeam
  plan_tier: string
  referral_source: string
  application_fee_percent: number
  platform_fee_amount: number
  user_email: string
  status: string
}

// Función auxiliar para obtener el precio de un plan
function getPlanPrice(tier: string): number {
  const prices: Record<string, number> = {
    'basico': 599,
    'pro': 999,
    'enterprise': 2999,
    'lifetime': 19990,
  }
  return prices[tier] || 0
}

// Formatear moneda
const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

export default async function SalesReportsPage() {
  const supabase = await createClient()

  // Verificar que el usuario sea admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return <div>No autorizado</div>
  }

  // Obtener todas las suscripciones activas
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select(`
      *,
      users (
        email
      )
    `)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })

  if (!subscriptions) {
    return <div>Error al cargar datos</div>
  }

  // Calcular métricas por equipo
  const metrics: Record<SalesTeam, SalesMetrics> = {
    internal: {
      team: 'internal',
      totalSales: 0,
      activeSubscriptions: 0,
      grossRevenue: 0,
      platformFees: 0,
      netRevenue: 0,
    },
    distributor: {
      team: 'distributor',
      totalSales: 0,
      activeSubscriptions: 0,
      grossRevenue: 0,
      platformFees: 0,
      netRevenue: 0,
    },
  }

  subscriptions.forEach((sub) => {
    const team = (sub.sales_team || 'internal') as SalesTeam
    const planPrice = getPlanPrice(sub.plan_tier)
    const platformFee = sub.platform_fee_amount || 0

    metrics[team].totalSales++
    metrics[team].activeSubscriptions++
    metrics[team].grossRevenue += planPrice
    metrics[team].platformFees += platformFee
    metrics[team].netRevenue += (planPrice - platformFee)
  })

  // Últimas 10 ventas
  const recentSales: RecentSale[] = subscriptions.slice(0, 10).map((sub: any) => ({
    id: sub.id,
    created_at: sub.created_at,
    sales_team: sub.sales_team || 'internal',
    plan_tier: sub.plan_tier,
    referral_source: sub.referral_source || 'direct',
    application_fee_percent: sub.application_fee_percent || 0,
    platform_fee_amount: sub.platform_fee_amount || 0,
    user_email: sub.users?.email || 'N/A',
    status: sub.status,
  }))

  // Calcular totales generales
  const totalRevenue = metrics.internal.grossRevenue + metrics.distributor.platformFees
  const totalSales = metrics.internal.totalSales + metrics.distributor.totalSales

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Reportes de Ventas</h1>
        <p className="text-gray-600">Dashboard de ingresos por equipo de ventas</p>
      </div>

      {/* Resumen General */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {currencyFormatter.format(totalRevenue)}
            </div>
            <p className="text-xs text-gray-500">Para tu cuenta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-gray-500">Suscripciones activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipo Interno</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.internal.totalSales}</div>
            <p className="text-xs text-gray-500">
              {currencyFormatter.format(metrics.internal.grossRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distribuidora</CardTitle>
            <Building2 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.distributor.totalSales}</div>
            <p className="text-xs text-gray-500">
              {currencyFormatter.format(metrics.distributor.platformFees)} comisión
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detalles por Equipo */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Equipo Interno */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Equipo Interno
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ventas totales:</span>
              <span className="font-bold">{metrics.internal.totalSales}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ingresos brutos:</span>
              <span className="font-bold text-green-600">
                {currencyFormatter.format(metrics.internal.grossRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Comisión plataforma:</span>
              <span className="font-bold">
                {currencyFormatter.format(metrics.internal.platformFees)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-gray-900 font-semibold">Tu ganancia:</span>
              <span className="font-bold text-green-700 text-xl">
                {currencyFormatter.format(metrics.internal.grossRevenue)} (100%)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Distribuidora */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              Distribuidora
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ventas totales:</span>
              <span className="font-bold">{metrics.distributor.totalSales}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ingresos brutos:</span>
              <span className="font-bold">
                {currencyFormatter.format(metrics.distributor.grossRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tu comisión (70%):</span>
              <span className="font-bold text-green-600">
                {currencyFormatter.format(metrics.distributor.platformFees)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Para distribuidora (30%):</span>
              <span className="font-bold text-orange-600">
                {currencyFormatter.format(metrics.distributor.netRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-gray-900 font-semibold">Tu ganancia:</span>
              <span className="font-bold text-green-700 text-xl">
                {currencyFormatter.format(metrics.distributor.platformFees)} (70%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimas Ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Fecha</th>
                  <th className="text-left py-2 px-4">Cliente</th>
                  <th className="text-left py-2 px-4">Plan</th>
                  <th className="text-left py-2 px-4">Equipo</th>
                  <th className="text-left py-2 px-4">Referencia</th>
                  <th className="text-right py-2 px-4">Comisión</th>
                  <th className="text-right py-2 px-4">Monto</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => {
                  const planPrice = getPlanPrice(sale.plan_tier)
                  return (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">
                        {new Date(sale.created_at).toLocaleDateString('es-MX')}
                      </td>
                      <td className="py-3 px-4 text-sm">{sale.user_email}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {sale.plan_tier}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          className={
                            sale.sales_team === 'internal' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-orange-100 text-orange-700'
                          }
                        >
                          {sale.sales_team === 'internal' ? '🏠 Interno' : '🏢 Distribuidora'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {sale.referral_source}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        {sale.application_fee_percent}%
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {currencyFormatter.format(planPrice)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
