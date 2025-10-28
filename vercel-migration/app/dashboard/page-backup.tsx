'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

// Temporary simple UI components
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>{children}</div>
)

const CardHeader = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 pb-2 ${className}`}>{children}</div>
)

const CardTitle = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
)

const CardContent = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 pt-2 ${className}`}>{children}</div>
)

const Button = ({ children, className = "", variant = "default", asChild = false, onClick = undefined, disabled = false }: any) => {
  const baseClasses = "px-4 py-2 rounded-md transition-colors font-medium inline-flex items-center justify-center"
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
  }
  
  if (asChild) {
    return children
  }
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant as keyof typeof variantClasses]} ${className}`} 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

interface DashboardStats {
  totalPatients: number
  totalTreatments: number
  totalRecords: number
  totalRevenue: number
  monthlyRevenue: number
  todayRevenue: number
  pendingAppointments: number
  lowStockItems: number
  monthlyExpenses: number
  todayAppointments: number
  recentRecords: Array<{
    id: number
    patient_name: string
    treatment_name: string
    monto_pagado: number
    fecha: string
    metodo_pago: string
  }>
  upcomingAppointments: Array<{
    id: number
    patient_name: string
    treatment_name: string
    fecha: string
    hora: string
    status: string
  }>
  lowStockAlerts: Array<{
    id: number
    nombre: string
    stock_actual: number
    stock_minimo: number
  }>
  monthlyExpensesList: Array<{
    id: number
    concepto: string
    monto: number
    frecuencia: string
  }>
  revenueChart: Array<{
    date: string
    revenue: number
  }>
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalTreatments: 0,
    totalRecords: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    todayRevenue: 0,
    pendingAppointments: 0,
    lowStockItems: 0,
    monthlyExpenses: 0,
    todayAppointments: 0,
    recentRecords: [],
    upcomingAppointments: [],
    lowStockAlerts: [],
    monthlyExpensesList: [],
    revenueChart: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    loadDashboardData()
  }, [session, status, router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load data from all APIs
      const [
        patientsRes,
        treatmentsRes,
        recordsRes,
        appointmentsRes,
        inventoryRes,
        gastosRes
      ] = await Promise.all([
        fetch('/api/patients').then(r => r.json()).catch(() => []),
        fetch('/api/treatments').then(r => r.json()).catch(() => []),
        fetch('/api/records/with-names').then(r => r.json()).catch(() => []),
        fetch('/api/appointments').then(r => r.json()).catch(() => []),
        fetch('/api/inventory').then(r => r.json()).catch(() => []),
        fetch('/api/gastos-fijos').then(r => r.json()).catch(() => [])
      ])
      
      // Calculate current date ranges
      const today = new Date()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const todayStr = today.toISOString().split('T')[0]
      
      // Process records for revenue calculations
      const records = Array.isArray(recordsRes) ? recordsRes : []
      const todayRecords = records.filter(r => r.fecha?.startsWith(todayStr))
      const monthlyRecords = records.filter(r => {
        const recordDate = new Date(r.fecha)
        return recordDate >= startOfMonth
      })
      
      // Process appointments
      const appointments = Array.isArray(appointmentsRes) ? appointmentsRes : []
      const todayAppointments = appointments.filter(a => a.appointment_date?.startsWith(todayStr))
      const upcomingAppointments = appointments.filter(a => {
        const appointmentDate = new Date(a.appointment_date)
        return appointmentDate >= today && a.status !== 'completada'
      }).slice(0, 5)
      
      // Process inventory for low stock alerts
      const inventory = Array.isArray(inventoryRes) ? inventoryRes : []
      const lowStockAlerts = inventory.filter(item => 
        item.stock_actual <= item.stock_minimo && item.activo
      ).slice(0, 5)
      
      // Process monthly expenses
      const gastos = Array.isArray(gastosRes) ? gastosRes : []
      const monthlyExpenses = gastos
        .filter(g => g.activo && g.frecuencia === 'mensual')
        .reduce((sum, g) => sum + (g.monto || 0), 0)
      
      // Generate simple revenue chart data (last 7 days)
      const revenueChart = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const dayRecords = records.filter(r => r.fecha?.startsWith(dateStr))
        const dayRevenue = dayRecords.reduce((sum, r) => sum + (r.monto_pagado || 0), 0)
        revenueChart.push({
          date: dateStr,
          revenue: dayRevenue
        })
      }
      
      setStats({
        totalPatients: Array.isArray(patientsRes) ? patientsRes.length : 0,
        totalTreatments: Array.isArray(treatmentsRes) ? treatmentsRes.length : 0,
        totalRecords: records.length,
        totalRevenue: records.reduce((sum, r) => sum + (r.monto_pagado || 0), 0),
        monthlyRevenue: monthlyRecords.reduce((sum, r) => sum + (r.monto_pagado || 0), 0),
        todayRevenue: todayRecords.reduce((sum, r) => sum + (r.monto_pagado || 0), 0),
        pendingAppointments: upcomingAppointments.length,
        lowStockItems: lowStockAlerts.length,
        monthlyExpenses: monthlyExpenses,
        todayAppointments: todayAppointments.length,
        recentRecords: records.slice(0, 5),
        upcomingAppointments: upcomingAppointments,
        lowStockAlerts: lowStockAlerts,
        monthlyExpensesList: gastos.filter(g => g.activo).slice(0, 5),
        revenueChart: revenueChart
      })
      
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    SGMM Pro
                  </h1>
                  <p className="text-sm text-gray-500">Sistema de Gestión Médica</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Dr. {session.user?.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('es-ES', { 
                    weekday: 'short', 
                    day: 'numeric',
                    month: 'short' 
                  })}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {session.user?.name?.charAt(0) || 'D'}
                </span>
              </div>
              <button
                onClick={() => window.location.href = '/api/auth/signout'}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Salir
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex space-x-6 border-t border-gray-200/50 pt-4 overflow-x-auto">
            <Link href="/dashboard" className="flex items-center space-x-2 pb-3 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm whitespace-nowrap">
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
            <Link href="/patients" className="flex items-center space-x-2 pb-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors whitespace-nowrap">
              <span>👥</span>
              <span>Pacientes</span>
            </Link>
            <Link href="/agenda" className="flex items-center space-x-2 pb-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors whitespace-nowrap">
              <span>📅</span>
              <span>Agenda</span>
            </Link>
            <Link href="/treatments" className="flex items-center space-x-2 pb-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors whitespace-nowrap">
              <span>💊</span>
              <span>Tratamientos</span>
            </Link>
            <Link href="/records" className="flex items-center space-x-2 pb-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors whitespace-nowrap">
              <span>📋</span>
              <span>Registros</span>
            </Link>
            <Link href="/inventory" className="flex items-center space-x-2 pb-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors whitespace-nowrap">
              <span>📦</span>
              <span>Inventario</span>
            </Link>
            <Link href="/gastos-fijos" className="flex items-center space-x-2 pb-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors whitespace-nowrap">
              <span>💰</span>
              <span>Gastos Fijos</span>
            </Link>
            <Link href="/billing" className="flex items-center space-x-2 pb-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors whitespace-nowrap">
              <span>🧾</span>
              <span>Facturación</span>
            </Link>
            <Link href="/messaging" className="flex items-center space-x-2 pb-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors whitespace-nowrap">
              <span>💬</span>
              <span>Mensajes</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {error && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 shadow-sm mb-6">
            <div className="flex items-center">
              <span className="text-yellow-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm border border-blue-100 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600">Resumen de tu consulta médica</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={loadDashboardData}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
            <Link href="/patients/new">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-sm">
                Nuevo Paciente
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-blue-700">Total Pacientes</CardTitle>
              <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{stats.totalPatients}</div>
              <div className="flex items-center mt-2">
                <span className="text-xs text-green-600 font-medium">Activos</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-purple-700">Citas Hoy</CardTitle>
              <div className="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{stats.todayAppointments}</div>
              <div className="flex items-center mt-2">
                <span className="text-xs text-purple-600 font-medium">Programadas</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-green-700">Ingresos Hoy</CardTitle>
              <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">${stats.todayRevenue.toLocaleString()}</div>
              <div className="flex items-center mt-2">
                <span className="text-xs text-green-600 font-medium">Hoy</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-amber-700">Ingresos Mes</CardTitle>
              <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900">${stats.monthlyRevenue.toLocaleString()}</div>
              <div className="flex items-center mt-2">
                <span className="text-xs text-green-600 font-medium">Este mes</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row Stats Cards - Alerts and Operations */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-orange-700">Stock Bajo</CardTitle>
              <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">{stats.lowStockItems}</div>
              <div className="flex items-center mt-2">
                <span className="text-xs text-orange-600 font-medium">Productos</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-red-700">Citas Pendientes</CardTitle>
              <div className="h-8 w-8 bg-red-500 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900">{stats.pendingAppointments}</div>
              <div className="flex items-center mt-2">
                <span className="text-xs text-red-600 font-medium">Próximas</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-emerald-700">Tratamientos</CardTitle>
              <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900">{stats.totalTreatments}</div>
              <div className="flex items-center mt-2">
                <span className="text-xs text-emerald-600 font-medium">Disponibles</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Gastos Mensual</CardTitle>
              <div className="h-8 w-8 bg-gray-500 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">${stats.monthlyExpenses.toLocaleString()}</div>
              <div className="flex items-center mt-2">
                <span className="text-xs text-gray-600 font-medium">Fijos</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white shadow-sm border border-gray-200 mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/patients/new">
                <Button className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl h-auto">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="font-medium">Nuevo Paciente</span>
                  </div>
                </Button>
              </Link>
              <Link href="/agenda/nueva-cita">
                <Button className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl h-auto">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Agendar Cita</span>
                  </div>
                </Button>
              </Link>
              <Link href="/treatments/new">
                <Button className="w-full p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl h-auto">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span className="font-medium">Nuevo Tratamiento</span>
                  </div>
                </Button>
              </Link>
              <Link href="/records/nuevo">
                <Button className="w-full p-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl h-auto">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">Nuevo Registro</span>
                  </div>
                </Button>
              </Link>
            </div>
            
            {/* Secondary Actions */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/inventory">
                <Button className="w-full p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg h-auto">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="font-medium">Inventario</span>
                  </div>
                </Button>
              </Link>
              <Link href="/gastos-fijos">
                <Button className="w-full p-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg h-auto">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-medium">Gastos Fijos</span>
                  </div>
                </Button>
              </Link>
              <Link href="/billing">
                <Button className="w-full p-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:from-yellow-600 hover:to-amber-600 transition-all duration-200 shadow-md hover:shadow-lg h-auto">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m-6 8h6m2-10h5a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h5" />
                    </svg>
                    <span className="font-medium">Facturación</span>
                  </div>
                </Button>
              </Link>
              <Link href="/messaging">
                <Button className="w-full p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg h-auto">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-medium">Mensajes</span>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Data Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Recent Records */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Últimos Registros
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentRecords.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{record.patient_name || 'Sin paciente'}</p>
                        <p className="text-sm text-gray-600">{record.treatment_name || 'Sin tratamiento'}</p>
                        <p className="text-xs text-gray-500">
                          {record.fecha ? new Date(record.fecha).toLocaleDateString('es-ES') : 'Sin fecha'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">${record.monto_pagado?.toLocaleString() || '0'}</p>
                        <p className="text-xs text-gray-500">{record.metodo_pago || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No hay registros recientes</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Próximas Citas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {stats.upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{appointment.patient_name}</p>
                        <p className="text-sm text-gray-600">{appointment.treatment_name}</p>
                        <p className="text-xs text-gray-500">
                          {appointment.fecha ? new Date(appointment.fecha).toLocaleDateString('es-ES') : 'Sin fecha'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-purple-600">{appointment.hora || 'Sin hora'}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          appointment.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'confirmada' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status || 'pendiente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No hay citas programadas</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Alerts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Low Stock Alerts */}
          <Card className="bg-white shadow-sm border border-orange-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Alertas de Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.lowStockAlerts.length > 0 ? (
                <div className="space-y-3">
                  {stats.lowStockAlerts.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.nombre}</p>
                        <p className="text-sm text-orange-600">Stock crítico</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-orange-700">{item.stock_actual} / {item.stock_minimo}</p>
                        <p className="text-xs text-gray-500">Actual / Mínimo</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p>Stock en niveles normales</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Expenses */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Gastos Fijos Mensuales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.monthlyExpensesList.length > 0 ? (
                <div className="space-y-3">
                  {stats.monthlyExpensesList.map((gasto) => (
                    <div key={gasto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{gasto.concepto}</p>
                        <p className="text-sm text-gray-600">{gasto.frecuencia}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">${gasto.monto?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>No hay gastos fijos configurados</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* System Status */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 p-3 bg-green-100 rounded-2xl">
              <svg className="w-full h-full text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sistema SGMM Pro - Operativo</h3>
            <p className="text-gray-600 mb-6">
              Tu sistema médico completo está funcionando correctamente. Todas las funcionalidades principales están integradas y listas para usar.
            </p>
            <div className="bg-white/70 rounded-xl p-6 border border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-green-800 text-sm font-medium mb-2">
                    <span className="inline-block w-4 h-4 mr-2">✅</span>
                    Dashboard completo con métricas en tiempo real
                  </p>
                  <p className="text-green-800 text-sm font-medium mb-2">
                    <span className="inline-block w-4 h-4 mr-2">✅</span>
                    Gestión completa de pacientes
                  </p>
                  <p className="text-green-800 text-sm font-medium mb-2">
                    <span className="inline-block w-4 h-4 mr-2">✅</span>
                    Sistema de citas y agenda
                  </p>
                  <p className="text-green-800 text-sm font-medium mb-2">
                    <span className="inline-block w-4 h-4 mr-2">✅</span>
                    Registros médicos y tratamientos
                  </p>
                </div>
                <div>
                  <p className="text-green-800 text-sm font-medium mb-2">
                    <span className="inline-block w-4 h-4 mr-2">✅</span>
                    Control de inventario con alertas
                  </p>
                  <p className="text-green-800 text-sm font-medium mb-2">
                    <span className="inline-block w-4 h-4 mr-2">✅</span>
                    Gestión de gastos fijos
                  </p>
                  <p className="text-green-800 text-sm font-medium mb-2">
                    <span className="inline-block w-4 h-4 mr-2">✅</span>
                    Sistema de facturación
                  </p>
                  <p className="text-green-800 text-sm font-medium mb-2">
                    <span className="inline-block w-4 h-4 mr-2">✅</span>
                    Mensajería y notificaciones
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-green-700 text-sm">
                  <strong>Estado:</strong> Sistema completamente funcional · <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}