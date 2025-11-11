"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Stethoscope, Package, TrendingUp, Calendar, DollarSign, CreditCard, Banknote, ArrowUpRight, ArrowDownRight, Clock, AlertTriangle, TrendingDown, Activity, BarChart3, PieChart, Target, CheckCircle, Minus, Settings, UserX, FileText, Receipt } from "lucide-react";
import AppLayout from "@/components/layout/app-layout";
import { MiniAgenda } from "@/components/agenda/mini-agenda";
import BookingsWidget from "@/components/dashboard/BookingsWidget";
import TrialBadge from "@/components/TrialBadge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsChart, Pie, Cell, Legend } from 'recharts';

interface DashboardStats {
  totalPatients: number;
  totalTreatments: number;
  totalRecords: number;
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  monthlyRevenue: number;
  monthlyGrossProfit: number;
  monthlyFixedCosts: number;
  monthlyVariableCosts: number;
  monthlyNetProfit: number;
  monthlyMarginPercentage: number;
  upcomingPayments: number;
  upcomingAppointments: number;
  todayAppointments: number;
  weekAppointments: number;
  patientsAtRisk: number;
  previousMonthRevenue: number;
  revenueChangePercent: number;
  last30DaysRevenue: Array<{ date: string; revenue: number }>;
  billingStats: {
    billedRevenue: number;
    nonBilledRevenue: number;
    billedPercentage: number;
  };
  paymentMethods: {
    efectivo: number;
    tarjeta: number;
    transferencia: number;
  };
  recentRecords: Array<{
    id: number;
    patient_name: string;
    treatment_name: string;
    monto_pagado: number;
    ganancia: number;
    metodo_pago: string;
    fecha: string;
    comision_monto?: number;
  }>;
  fixedCostsBreakdown: Array<{
    concepto: string;
    monto: number;
    frecuencia: string;
    monto_mensual: number;
  }>;
  upcomingAppointmentsNext2Hours: Array<{
    id: string;
    patient_name: string;
    scheduled_time: string;
    appointment_type_name?: string;
    notes?: string;
  }>;
}

interface InventoryHealth {
  total_items: number;
  high_stock: number;
  medium_stock: number;
  low_stock: number;
  out_of_stock: number;
  overall_status: string;
  critical_items: Array<{
    id: number;
    nombre: string;
    stock_actual: number;
    stock_minimo: number;
    status: string;
  }>;
  low_items: Array<{
    id: number;
    nombre: string;
    stock_actual: number;
    stock_minimo: number;
    status: string;
  }>;
}

interface InventoryItem {
  id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  costo_unitario: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalTreatments: 0,
    totalRecords: 0,
    totalRevenue: 0,
    totalCosts: 0,
    totalProfit: 0,
    monthlyRevenue: 0,
    monthlyGrossProfit: 0,
    monthlyFixedCosts: 0,
    monthlyVariableCosts: 0,
    monthlyNetProfit: 0,
    monthlyMarginPercentage: 0,
    upcomingPayments: 0,
    upcomingAppointments: 0,
    todayAppointments: 0,
    weekAppointments: 0,
    patientsAtRisk: 0,
    previousMonthRevenue: 0,
    revenueChangePercent: 0,
    last30DaysRevenue: [],
    billingStats: {
      billedRevenue: 0,
      nonBilledRevenue: 0,
      billedPercentage: 0,
    },
    paymentMethods: {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0
    },
    recentRecords: [],
    fixedCostsBreakdown: [],
    upcomingAppointmentsNext2Hours: []
  });

  const [inventoryHealth, setInventoryHealth] = useState<InventoryHealth>({
    total_items: 0,
    high_stock: 0,
    medium_stock: 0,
    low_stock: 0,
    out_of_stock: 0,
    overall_status: 'good',
    critical_items: [],
    low_items: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticación con Supabase
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/auth/signin');
        return;
      }
      
      setUser(user);
      setLoadingAuth(false);
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (loadingAuth) return;
    if (!user) return;
    
    loadDashboardData();
  }, [user, loadingAuth]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading dashboard data...');
      
      // Cargar datos básicos
      const [patientsResponse, treatmentsResponse, recordsResponse] = await Promise.all([
        fetch('/api/patients').then(r => r.json()).catch(() => []),
        fetch('/api/treatments').then(r => r.json()).catch(() => []),
        fetch('/api/records').then(r => r.json()).catch(() => [])
      ]);

      const patients = Array.isArray(patientsResponse) ? patientsResponse : [];
      const treatments = Array.isArray(treatmentsResponse) ? treatmentsResponse : [];
      const records = Array.isArray(recordsResponse) ? recordsResponse : [];

      console.log('🔍 Dashboard data loaded:', {
        patientsCount: patients.length,
        treatmentsCount: treatments.length,
        recordsCount: records.length,
      });

      // Calcular estadísticas financieras
      const totalRevenue = records
        .filter((r: any) => r.monto_pagado > 0)
        .reduce((sum: number, r: any) => sum + (r.monto_pagado || 0), 0);

      const totalCosts = records
        .reduce((sum: number, r: any) => sum + (r.costo_tratamiento || 0), 0);

      const totalProfit = totalRevenue - totalCosts;

      // Estadísticas mensuales (mes actual)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyRecords = records.filter((r: any) => {
        const recordDate = new Date(r.fecha);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
      });

      const monthlyRevenue = monthlyRecords
        .filter((r: any) => r.monto_pagado > 0)
        .reduce((sum: number, r: any) => sum + (r.monto_pagado || 0), 0);

      const monthlyGrossProfit = monthlyRecords
        .reduce((sum: number, r: any) => sum + ((r.monto_pagado || 0) - (r.costo_tratamiento || 0)), 0);

      // Obtener gastos fijos
      let fixedCostsData: any[] = [];
      let monthlyFixedCosts = 0;
      try {
        const gastosFijosResponse = await fetch('/api/gastos-fijos').then(r => r.json()).catch(() => []);
        const gastosFijos = Array.isArray(gastosFijosResponse) ? gastosFijosResponse : [];
        
        fixedCostsData = gastosFijos.map((gasto: any) => ({
          concepto: gasto.concepto,
          monto: gasto.monto,
          frecuencia: gasto.frecuencia,
          monto_mensual: gasto.frecuencia === 'mensual' ? gasto.monto : 
                        gasto.frecuencia === 'anual' ? gasto.monto / 12 : gasto.monto
        }));

        monthlyFixedCosts = fixedCostsData.reduce((sum: number, gasto: any) => sum + gasto.monto_mensual, 0);
      } catch (error) {
        console.warn('No se pudieron cargar los gastos fijos:', error);
      }

      // Obtener gastos variables del mes actual
      let monthlyVariableCosts = 0;
      try {
        const currentDate = new Date();
        const mes = currentDate.getMonth() + 1;
        const año = currentDate.getFullYear();
        
        const gastosVariablesResponse = await fetch(
          `/api/gastos-variables/stats?mes=${mes}&año=${año}`
        ).then(r => r.json()).catch(() => null);
        
        if (gastosVariablesResponse && gastosVariablesResponse.total) {
          monthlyVariableCosts = gastosVariablesResponse.total;
        }
      } catch (error) {
        console.warn('No se pudieron cargar los gastos variables:', error);
      }

      const monthlyNetProfit = monthlyGrossProfit - monthlyFixedCosts - monthlyVariableCosts;
      const monthlyMarginPercentage = monthlyRevenue > 0 ? (monthlyNetProfit / monthlyRevenue) * 100 : 0;

      // Registros recientes
      const recentRecords = records
        .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 5)
        .map((record: any) => ({
          ...record,
          patient_name: record.patient_name || 'Paciente desconocido',
          treatment_name: record.treatment_name || 'Tratamiento desconocido'
        }));

      // Métodos de pago
      const paymentMethods = records
        .filter((r: any) => r.monto_pagado > 0)
        .reduce((acc: any, r: any) => {
          const method = r.metodo_pago || 'efectivo';
          acc[method] = (acc[method] || 0) + r.monto_pagado;
          return acc;
        }, { efectivo: 0, tarjeta: 0, transferencia: 0 });

      // Estadísticas de facturación
      const billedRecords = records.filter((r: any) => r.requiere_factura);
      const billedRevenue = billedRecords.reduce((sum: number, r: any) => sum + (r.monto_pagado || 0), 0);
      const nonBilledRevenue = totalRevenue - billedRevenue;
      const billedPercentage = totalRevenue > 0 ? (billedRevenue / totalRevenue) * 100 : 0;

      // === QUICK WIN 1: Appointment counts (today/week) ===
      let todayAppointments = 0;
      let weekAppointments = 0;
      try {
        const today = new Date().toISOString().split('T')[0];
        const appointmentsResponse = await fetch(`/api/appointments?date=${today}`).then(r => r.json()).catch(() => []);
        const appointments = Array.isArray(appointmentsResponse) ? appointmentsResponse : [];
        
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        todayAppointments = appointments.filter((apt: any) => {
          const aptDate = new Date(apt.fecha);
          return aptDate >= todayStart && aptDate <= todayEnd;
        }).length;
        
        weekAppointments = appointments.filter((apt: any) => {
          const aptDate = new Date(apt.fecha);
          return aptDate >= weekStart && aptDate <= weekEnd;
        }).length;
      } catch (err) {
        console.warn('No se pudieron cargar las citas:', err);
      }

      // === QUICK WIN 2: Patients at risk (90+ days without appointment) ===
      let patientsAtRisk = 0;
      try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        // Get all appointments to find last appointment per patient
        const allAppointmentsResponse = await fetch('/api/appointments').then(r => r.json()).catch(() => []);
        const allAppointments = Array.isArray(allAppointmentsResponse) ? allAppointmentsResponse : [];
        
        const patientLastAppointment = new Map<number, Date>();
        allAppointments.forEach((apt: any) => {
          const aptDate = new Date(apt.fecha);
          const patientId = apt.patient_id;
          if (!patientLastAppointment.has(patientId) || aptDate > patientLastAppointment.get(patientId)!) {
            patientLastAppointment.set(patientId, aptDate);
          }
        });
        
        patientsAtRisk = Array.from(patientLastAppointment.values()).filter(lastDate => 
          lastDate < ninetyDaysAgo
        ).length;
        
        // Also count patients with no appointments ever
        const patientsWithoutAppointments = patients.filter((p: any) => 
          !patientLastAppointment.has(p.id)
        ).length;
        
        patientsAtRisk += patientsWithoutAppointments;
      } catch (err) {
        console.warn('No se pudo calcular pacientes en riesgo:', err);
      }

      // === QUICK WIN 3: Last 30 days revenue trend ===
      const last30DaysRevenue: Array<{ date: string; revenue: number }> = [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentRecordsForTrend = records.filter((r: any) => {
        const recordDate = new Date(r.fecha);
        return recordDate >= thirtyDaysAgo && r.monto_pagado > 0;
      });
      
      // Group by date
      const revenueByDate = recentRecordsForTrend.reduce((acc: any, r: any) => {
        const dateKey = new Date(r.fecha).toISOString().split('T')[0];
        acc[dateKey] = (acc[dateKey] || 0) + r.monto_pagado;
        return acc;
      }, {});
      
      // Fill missing dates with 0 and create array
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        last30DaysRevenue.push({
          date: dateKey,
          revenue: revenueByDate[dateKey] || 0
        });
      }

      // === QUICK WIN 4: Month-over-month revenue change % ===
      const previousMonth = new Date().getMonth() - 1;
      const previousYear = previousMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedPreviousMonth = previousMonth < 0 ? 11 : previousMonth;
      
      const previousMonthRecords = records.filter((r: any) => {
        const recordDate = new Date(r.fecha);
        return recordDate.getMonth() === adjustedPreviousMonth && recordDate.getFullYear() === previousYear;
      });
      
      const previousMonthRevenue = previousMonthRecords
        .filter((r: any) => r.monto_pagado > 0)
        .reduce((sum: number, r: any) => sum + (r.monto_pagado || 0), 0);
      
      const revenueChangePercent = previousMonthRevenue > 0 
        ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : 0;

      // === QUICK WIN 5: Próximas 2 horas ===
      let upcomingAppointmentsNext2Hours: Array<{
        id: string;
        patient_name: string;
        scheduled_time: string;
        appointment_type_name?: string;
        notes?: string;
      }> = [];
      
      try {
        const now = new Date();
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        
        const today = now.toISOString().split('T')[0];
        const appointmentsResponse = await fetch(`/api/appointments?date=${today}`).then(r => r.json()).catch(() => []);
        const appointments = Array.isArray(appointmentsResponse) ? appointmentsResponse : [];
        
        upcomingAppointmentsNext2Hours = appointments
          .filter((apt: any) => {
            // Combine date and time
            const aptDateTime = new Date(`${apt.scheduled_date}T${apt.scheduled_time}`);
            return aptDateTime >= now && aptDateTime <= twoHoursLater && apt.status !== 'cancelada';
          })
          .sort((a: any, b: any) => {
            const timeA = new Date(`${a.scheduled_date}T${a.scheduled_time}`).getTime();
            const timeB = new Date(`${b.scheduled_date}T${b.scheduled_time}`).getTime();
            return timeA - timeB;
          })
          .slice(0, 5) // Only show first 5
          .map((apt: any) => ({
            id: apt.id,
            patient_name: apt.patient_name || 'Paciente',
            scheduled_time: apt.scheduled_time,
            appointment_type_name: apt.appointment_type_name,
            notes: apt.notes
          }));
      } catch (err) {
        console.warn('No se pudieron cargar las citas próximas:', err);
      }

      setStats({
        totalPatients: patients.length,
        totalTreatments: treatments.length,
        totalRecords: records.length,
        totalRevenue,
        totalCosts,
        totalProfit,
        monthlyRevenue,
        monthlyGrossProfit,
        monthlyFixedCosts,
        monthlyVariableCosts,
        monthlyNetProfit,
        monthlyMarginPercentage,
        upcomingPayments: 0,
        upcomingAppointments: 0,
        todayAppointments,
        weekAppointments,
        patientsAtRisk,
        previousMonthRevenue,
        revenueChangePercent,
        last30DaysRevenue,
        billingStats: { billedRevenue, nonBilledRevenue, billedPercentage },
        paymentMethods,
        recentRecords,
        fixedCostsBreakdown: fixedCostsData,
        upcomingAppointmentsNext2Hours
      });

      // Cargar salud del inventario
      try {
        const inventoryResponse = await fetch('/api/inventory').then(r => r.json()).catch(() => ({ data: [] }));
        const items = Array.isArray(inventoryResponse.data) ? inventoryResponse.data : [];
        
        if (items.length > 0) {
          const highStockItems = items.filter((item: InventoryItem) => {
            const stock = item.stock_actual || 0;
            const maxStock = item.stock_maximo || 0;
            const minStock = item.stock_minimo || 0;
            
            if (maxStock === 0) {
              return stock > (minStock * 3);
            }
            
            const percentage = (stock / maxStock) * 100;
            return percentage >= 70;
          });
              
          const mediumStockItems = items.filter((item: InventoryItem) => {
            const stock = item.stock_actual || 0;
            const maxStock = item.stock_maximo || 0;
            const minStock = item.stock_minimo || 0;
            
            if (maxStock === 0) {
              return stock > minStock && stock <= (minStock * 3);
            }
            
            const percentage = (stock / maxStock) * 100;
            return percentage >= 30 && percentage < 70;
          });
          
          const lowStockItems = items.filter((item: InventoryItem) => {
            const stock = item.stock_actual || 0;
            const minStock = item.stock_minimo || 0;
            
            if (stock === 0) return false;
            
            return stock <= minStock;
          });
          
          const outOfStockItems = items.filter((item: InventoryItem) => (item.stock_actual || 0) === 0);
          
          let overallStatus = 'good';
          if (outOfStockItems.length > 0) {
            overallStatus = 'critical';
          } else if (lowStockItems.length > 0) {
            overallStatus = 'warning';
          }
          
          setInventoryHealth({
            total_items: items.length,
            high_stock: highStockItems.length,
            medium_stock: mediumStockItems.length,
            low_stock: lowStockItems.length,
            out_of_stock: outOfStockItems.length,
            overall_status: overallStatus,
            critical_items: outOfStockItems.map((item: InventoryItem) => ({
              id: item.id,
              nombre: item.nombre,
              stock_actual: item.stock_actual || 0,
              stock_minimo: item.stock_minimo || 0,
              status: 'out_of_stock'
            })),
            low_items: lowStockItems.map((item: InventoryItem) => ({
              id: item.id,
              nombre: item.nombre,
              stock_actual: item.stock_actual || 0,
              stock_minimo: item.stock_minimo || 0,
              status: 'low_stock'
            }))
          });
        }
      } catch (error) {
        console.warn('No se pudo cargar la salud del inventario:', error);
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Error al cargar los datos del dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando estadísticas del dashboard...</div>
      </div>
    );
  }

  return (
    <AppLayout>
      <TrialBadge />
      <div className="space-y-8 p-4 md:p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 min-h-screen w-full overflow-x-hidden">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white rounded-xl p-4 md:p-6 shadow-sm border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-sm md:text-base text-gray-600 truncate">Resumen de tu consulorio médico</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center space-x-2 flex-1 md:flex-initial"
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">{loading ? 'Cargando...' : 'Actualizar'}</span>
            <span className="sm:hidden">{loading ? '...' : '↻'}</span>
          </Button>
          <Button asChild variant="outline" className="flex items-center space-x-2 flex-1 md:flex-initial">
            <Link href="/dashboard/settings/doctors">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configuración</span>
            </Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-sm w-full md:w-auto">
            <Link href="/patients/new" className="flex items-center justify-center">
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nuevo Paciente</span>
              <span className="sm:hidden">Nuevo</span>
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            <span className="text-yellow-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Estadísticas principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">Total Pacientes</CardTitle>
            <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.totalPatients}</div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600 font-medium">Activos</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-emerald-700">Tratamientos</CardTitle>
            <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{stats.totalTreatments}</div>
            <div className="flex items-center mt-2">
              <Target className="h-3 w-3 text-emerald-500 mr-1" />
              <span className="text-xs text-emerald-600 font-medium">Disponibles</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-indigo-700">Inventario</CardTitle>
            <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-900">
              {inventoryHealth.total_items || 0}
            </div>
            <div className="flex items-center mt-2">
              {inventoryHealth.total_items === 0 && (
                <>
                  <AlertTriangle className="h-3 w-3 text-gray-500 mr-1" />
                  <span className="text-xs text-gray-500 font-medium">Sin datos</span>
                </>
              )}
              {inventoryHealth.total_items > 0 && inventoryHealth.overall_status === 'good' && (
                <>
                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600 font-medium">Estado Bueno</span>
                </>
              )}
              {inventoryHealth.total_items > 0 && inventoryHealth.overall_status === 'warning' && (
                <>
                  <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1" />
                  <span className="text-xs text-yellow-600 font-medium">Requiere Atención</span>
                </>
              )}
              {inventoryHealth.total_items > 0 && inventoryHealth.overall_status === 'critical' && (
                <>
                  <Minus className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-xs text-red-600 font-medium">Estado Crítico</span>
                </>
              )}
            </div>
            <Link href="/inventory">
              <Button variant="link" className="p-0 h-auto text-xs mt-2 text-indigo-600">
                Ver detalles →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-amber-700">Ingresos Total</CardTitle>
            <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">${(stats?.totalRevenue || 0).toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600 font-medium">Acumulado</span>
            </div>
          </CardContent>
        </Card>

        {/* === QUICK WIN 1: Citas Hoy/Semana === */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-700">Citas Hoy</CardTitle>
            <div className="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{stats.todayAppointments}</div>
            <div className="flex items-center mt-2">
              <Clock className="h-3 w-3 text-purple-500 mr-1" />
              <span className="text-xs text-purple-600 font-medium">{stats.weekAppointments} esta semana</span>
            </div>
          </CardContent>
        </Card>

        {/* === QUICK WIN 2: Pacientes en Riesgo === */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-orange-700">Pacientes en Riesgo</CardTitle>
            <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <UserX className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{stats.patientsAtRisk}</div>
            <div className="flex items-center mt-2">
              <AlertTriangle className="h-3 w-3 text-orange-500 mr-1" />
              <span className="text-xs text-orange-600 font-medium">Sin cita 90+ días</span>
            </div>
            <Link href="/patients">
              <Button variant="link" className="p-0 h-auto text-xs mt-2 text-orange-600">
                Enviar recordatorio →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* === QUICK WIN 3 & 4: Ingresos del Mes con Trend + % Change === */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-700">Ingresos del Mes</CardTitle>
            <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <div className="text-3xl font-bold text-green-900">
                ${(stats?.monthlyRevenue || 0).toLocaleString()}
              </div>
              {stats.revenueChangePercent !== 0 && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                  stats.revenueChangePercent > 0 
                    ? 'bg-green-200 text-green-700' 
                    : 'bg-red-200 text-red-700'
                }`}>
                  {stats.revenueChangePercent > 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  <span className="text-xs font-semibold">
                    {Math.abs(stats.revenueChangePercent).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            
            {/* Mini trend chart - last 30 days */}
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.last30DaysRevenue}>
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    dot={false}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white px-2 py-1 rounded shadow-lg border border-gray-200">
                            <p className="text-xs text-gray-600">
                              ${payload[0].value?.toLocaleString()}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600 font-medium">Últimos 30 días</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === QUICK WIN 5: Widget Próximas 2 Horas === */}
      {stats.upcomingAppointmentsNext2Hours.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm border-2 border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center animate-pulse">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-indigo-900">Próximas 2 Horas</h2>
                <p className="text-indigo-600 text-sm font-medium">
                  {stats.upcomingAppointmentsNext2Hours.length} {stats.upcomingAppointmentsNext2Hours.length === 1 ? 'cita llegando' : 'citas llegando'}
                </p>
              </div>
            </div>
            <Link href="/appointments">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md">
                <Calendar className="h-4 w-4 mr-2" />
                Ver Agenda Completa
              </Button>
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {stats.upcomingAppointmentsNext2Hours.map((apt) => (
              <div 
                key={apt.id} 
                className="bg-white rounded-lg p-4 border-2 border-indigo-200 shadow-sm hover:shadow-md transition-all hover:border-indigo-400"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{apt.patient_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-indigo-500" />
                      <p className="text-sm font-semibold text-indigo-600">
                        {apt.scheduled_time.substring(0, 5)}
                      </p>
                    </div>
                    {apt.appointment_type_name && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {apt.appointment_type_name}
                      </p>
                    )}
                    {apt.notes && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {apt.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Widget de Reservas Online */}
      <BookingsWidget />

      {/* === Analytics & Logs Cards === */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Analytics Dashboard Card */}
        <Link href="/dashboard/analytics/notifications" className="block group">
          <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Analytics de Notificaciones</h3>
              <p className="text-purple-100 text-sm mb-4">
                Métricas detalladas, gráficas interactivas y estadísticas de tus notificaciones por email y WhatsApp
              </p>
              <div className="flex items-center gap-4 text-white/90 text-sm">
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  <span>Tendencias</span>
                </div>
                <div className="flex items-center gap-1">
                  <PieChart className="h-4 w-4" />
                  <span>Distribución</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>Conversión</span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Notification Logs Card */}
        <Link href="/dashboard/notification-logs" className="block group">
          <div className="bg-gradient-to-br from-teal-500 via-emerald-600 to-green-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Historial de Notificaciones</h3>
              <p className="text-emerald-100 text-sm mb-4">
                Registro completo de todas las notificaciones enviadas con filtros avanzados y exportación a CSV
              </p>
              <div className="flex items-center gap-4 text-white/90 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Filtros</span>
                </div>
                <div className="flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  <span>Búsqueda</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Exportar</span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Intake Forms Card - NEW */}
        <Link href="/dashboard/settings/forms" className="block group">
          <div className="bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <ArrowUpRight className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Formularios de Admisión</h3>
              <p className="text-indigo-100 text-sm mb-4">
                Crea formularios personalizados y envíalos a tus pacientes por WhatsApp o Email
              </p>
              <div className="flex items-center gap-4 text-white/90 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Form Builder</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>Templates</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  <span>Tracking</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* === QUICK WIN 6: Gráfico Métodos de Pago === */}
      {(stats.paymentMethods.efectivo > 0 || stats.paymentMethods.tarjeta > 0 || stats.paymentMethods.transferencia > 0) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <PieChart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Métodos de Pago</h2>
                <p className="text-gray-600 text-sm">Distribución de ingresos por método</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <RechartsChart>
                  <Pie
                    data={[
                      { name: 'Efectivo', value: stats.paymentMethods.efectivo, color: '#10b981' },
                      { name: 'Tarjeta', value: stats.paymentMethods.tarjeta, color: '#3b82f6' },
                      { name: 'Transferencia', value: stats.paymentMethods.transferencia, color: '#8b5cf6' }
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => {
                      const { name, percent } = props;
                      return `${name} ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Efectivo', value: stats.paymentMethods.efectivo, color: '#10b981' },
                      { name: 'Tarjeta', value: stats.paymentMethods.tarjeta, color: '#3b82f6' },
                      { name: 'Transferencia', value: stats.paymentMethods.transferencia, color: '#8b5cf6' }
                    ].filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => `$${value.toLocaleString()}`}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                  />
                </RechartsChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Efectivo
                    </p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      ${stats.paymentMethods.efectivo.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {stats.totalRevenue > 0 
                        ? ((stats.paymentMethods.efectivo / stats.totalRevenue) * 100).toFixed(1) 
                        : 0}% del total
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <Banknote className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Tarjeta
                    </p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      ${stats.paymentMethods.tarjeta.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {stats.totalRevenue > 0 
                        ? ((stats.paymentMethods.tarjeta / stats.totalRevenue) * 100).toFixed(1) 
                        : 0}% del total
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 font-medium flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4" />
                      Transferencia
                    </p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      ${stats.paymentMethods.transferencia.toLocaleString()}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      {stats.totalRevenue > 0 
                        ? ((stats.paymentMethods.transferencia / stats.totalRevenue) * 100).toFixed(1) 
                        : 0}% del total
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <ArrowUpRight className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado del Inventario - Solo Alertas Críticas */}
      {(inventoryHealth.low_items.length > 0 || inventoryHealth.critical_items.length > 0) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">⚠️ Alertas de Inventario</h2>
                <p className="text-red-600 text-sm font-medium">
                  {inventoryHealth.critical_items.length} agotados • {inventoryHealth.low_items.length} bajos
                </p>
              </div>
            </div>
            <Link href="/inventory">
              <Button className="bg-red-600 hover:bg-red-700">
                <Package className="h-4 w-4 mr-2" />
                Gestionar
              </Button>
            </Link>
          </div>

          {/* Solo mostrar items críticos (agotados) */}
          {inventoryHealth.critical_items.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {inventoryHealth.critical_items.slice(0, 6).map((item) => (
                <div key={item.id} className="bg-red-50 border border-red-300 rounded-lg p-3">
                  <p className="font-medium text-red-900">{item.nombre}</p>
                  <p className="text-sm text-red-600">Agotado (Min: {item.stock_minimo})</p>
                </div>
              ))}
              {inventoryHealth.critical_items.length > 6 && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-center justify-center">
                  <p className="text-sm text-red-700 font-medium">
                    +{inventoryHealth.critical_items.length - 6} más
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Si no hay críticos, mostrar solo los low items */}
          {inventoryHealth.critical_items.length === 0 && inventoryHealth.low_items.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {inventoryHealth.low_items.slice(0, 6).map((item) => (
                <div key={item.id} className="bg-orange-50 border border-orange-300 rounded-lg p-3">
                  <p className="font-medium text-orange-900">{item.nombre}</p>
                  <p className="text-sm text-orange-600">Stock: {item.stock_actual} (Min: {item.stock_minimo})</p>
                </div>
              ))}
              {inventoryHealth.low_items.length > 6 && (
                <div className="bg-orange-50 border border-orange-300 rounded-lg p-3 flex items-center justify-center">
                  <p className="text-sm text-orange-700 font-medium">
                    +{inventoryHealth.low_items.length - 6} más
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Estadísticas financieras mensuales */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <PieChart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Resumen Financiero Mensual</h2>
            <p className="text-gray-600 text-sm">Análisis de ingresos y gastos del mes actual</p>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-green-700">Ingresos Mes</CardTitle>
              <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">${(stats?.monthlyRevenue || 0).toLocaleString()}</div>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600 font-medium">Este mes</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-blue-700">Ganancia Bruta</CardTitle>
              <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">${(stats?.monthlyGrossProfit || 0).toLocaleString()}</div>
              <p className="text-xs text-blue-600 mt-1 font-medium">Sin gastos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-red-700">Gastos Fijos</CardTitle>
              <div className="h-8 w-8 bg-red-500 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">${(stats?.monthlyFixedCosts || 0).toLocaleString()}</div>
              <p className="text-xs text-red-600 mt-1 font-medium">Recurrentes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-orange-700">Gastos Variables</CardTitle>
              <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Receipt className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">${(stats?.monthlyVariableCosts || 0).toLocaleString()}</div>
              <p className="text-xs text-orange-600 mt-1 font-medium">Este mes</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${(stats?.monthlyNetProfit || 0) >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'} shadow-sm`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className={`text-sm font-medium ${stats.monthlyNetProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                Ganancia Neta
              </CardTitle>
              <div className={`h-8 w-8 ${stats.monthlyNetProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'} rounded-lg flex items-center justify-center`}>
                {stats.monthlyNetProfit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-white" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-white" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(stats?.monthlyNetProfit || 0) >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                ${(stats?.monthlyNetProfit || 0).toLocaleString()}
              </div>
              <p className={`text-xs mt-1 font-medium ${(stats?.monthlyNetProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                Margen: {(stats?.monthlyMarginPercentage || 0).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      </div>



      {/* Mini Agenda */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">Próximas Citas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <MiniAgenda />
        </CardContent>
      </Card>

      {/* Registros recientes */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">Registros Recientes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {stats.recentRecords.length > 0 ? (
              stats.recentRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Stethoscope className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{record.patient_name}</p>
                      <p className="text-sm text-gray-600">{record.treatment_name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-2">
                        <span>{new Date(record.fecha).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">{record.metodo_pago}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">${(record.monto_pagado || 0).toLocaleString()}</p>
                    <p className="text-sm text-green-600 font-medium">
                      +${(record.ganancia || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500">No hay registros recientes</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  );
}