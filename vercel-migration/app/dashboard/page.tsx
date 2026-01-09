"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import Link from "next/link";
import { Users, Stethoscope, Package, TrendingUp, Calendar, DollarSign, CreditCard, Banknote, ArrowUpRight, ArrowDownRight, Clock, AlertTriangle, TrendingDown, Activity, BarChart3, PieChart, Target, CheckCircle, Settings, UserX, FileText, Receipt } from "lucide-react";
import AppLayout from "@/components/layout/app-layout";
import { MiniAgenda } from "@/components/agenda/mini-agenda";
import BookingsWidget from "@/components/dashboard/BookingsWidget";
import TrialBadge from "@/components/TrialBadge";
import { LocationSelector } from "@/components/locations/location-selector";
import { Doughnut, Line as ChartLine } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import "chart.js/auto";

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

const formatCurrency = (value: number = 0) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value || 0);

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
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');

  const inventoryBadge = inventoryHealth.total_items === 0
    ? { label: 'Sin datos', tone: 'neutral' as const }
    : inventoryHealth.overall_status === 'good'
    ? { label: 'Estado óptimo', tone: 'positive' as const }
    : inventoryHealth.overall_status === 'warning'
    ? { label: 'Requiere atención', tone: 'warning' as const }
    : { label: 'Estado crítico', tone: 'negative' as const };

  const metricCards = [
    {
      id: 'patients',
      title: 'Total Pacientes',
      hint: `${stats.totalPatients === 1 ? 'Paciente' : 'Pacientes'} activos`,
      value: stats.totalPatients.toLocaleString('es-MX'),
      icon: Users,
      variant: 'indigo' as const,
      trendLabel: 'Activos',
      trendTone: 'positive' as const,
    },
    {
      id: 'treatments',
      title: 'Tratamientos',
      hint: 'Disponibles para agenda',
      value: stats.totalTreatments.toLocaleString('es-MX'),
      icon: Stethoscope,
      variant: 'emerald' as const,
      trendLabel: 'Catálogo listo',
      trendTone: 'neutral' as const,
    },
    {
      id: 'inventory',
      title: 'Inventario',
      hint: `${inventoryHealth.low_stock + inventoryHealth.critical_items.length} alertas activas`,
      value: inventoryHealth.total_items.toLocaleString('es-MX'),
      icon: Package,
      variant: 'violet' as const,
      trendLabel: inventoryBadge.label,
      trendTone: inventoryBadge.tone,
      footer:
        inventoryHealth.total_items > 0 ? (
          <Link href="/inventory" className="text-xs text-sky-200 hover:text-white">
            Ver detalles →
          </Link>
        ) : undefined,
    },
    {
      id: 'revenue',
      title: 'Ingresos Totales',
      hint: 'MXN acumulado',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      variant: 'amber' as const,
      trendLabel: 'Acumulado',
      trendTone: 'positive' as const,
    },
    {
      id: 'appointments',
      title: 'Citas Hoy',
      hint: 'Calendario en vivo',
      value: stats.todayAppointments.toLocaleString('es-MX'),
      icon: Calendar,
      variant: 'teal' as const,
      trendLabel:
        stats.weekAppointments > 0
          ? `${stats.weekAppointments} esta semana`
          : 'Sin citas programadas',
      trendTone: stats.weekAppointments > 0 ? 'neutral' as const : 'warning' as const,
    },
    {
      id: 'risk',
      title: 'Pacientes en Riesgo',
      hint: 'Sin cita 90+ días',
      value: stats.patientsAtRisk.toLocaleString('es-MX'),
      icon: UserX,
      variant: 'orange' as const,
      trendLabel: 'Enviar recordatorios',
      trendTone: 'warning' as const,
      footer: (
        <Link href="/patients" className="text-xs text-orange-200 hover:text-white">
          Gestionar pacientes →
        </Link>
      ),
    },
  ];

  // Chart data for payment methods pie chart
  const paymentChartData = useMemo<ChartData<'doughnut'>>(() => ({
    labels: ['Efectivo', 'Tarjeta', 'Transferencia'],
    datasets: [
      {
        data: [
          stats.paymentMethods.efectivo,
          stats.paymentMethods.tarjeta,
          stats.paymentMethods.transferencia
        ],
        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6'],
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  }), [stats.paymentMethods]);

  const paymentChartOptions = useMemo<ChartOptions<'doughnut'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderColor: 'rgba(79, 70, 229, 0.35)',
        borderWidth: 1,
        padding: 12,
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        callbacks: {
          label: (context: any) => {
            const value = context.parsed || 0;
            const total = stats.totalRevenue;
            const percentage = total > 0 ? (value / total) * 100 : 0;
            return `${context.label}: $${value.toLocaleString()} (${percentage.toFixed(1)}%)`;
          }
        }
      }
    }
  }), [stats.totalRevenue]);

  const netPositive = stats.monthlyNetProfit >= 0;
  const financialHighlights = [
    {
      id: 'monthlyRevenue',
      title: 'Ingresos del mes',
      value: stats.monthlyRevenue,
      icon: TrendingUp,
      accent: 'from-emerald-400/30 via-emerald-500/10 to-transparent',
      chip: `${stats.revenueChangePercent >= 0 ? '+' : ''}${stats.revenueChangePercent.toFixed(1)}% vs mes anterior`,
      chipTone: stats.revenueChangePercent >= 0 ? 'text-emerald-200' : 'text-rose-200',
      subtitle: 'Entrada total'
    },
    {
      id: 'grossProfit',
      title: 'Ganancia bruta',
      value: stats.monthlyGrossProfit,
      icon: BarChart3,
      accent: 'from-sky-400/30 via-sky-500/10 to-transparent',
      chip: 'Antes de gastos',
      chipTone: 'text-white/70',
      subtitle: 'Sin gastos'
    },
    {
      id: 'fixedCosts',
      title: 'Gastos fijos',
      value: stats.monthlyFixedCosts,
      icon: Receipt,
      accent: 'from-rose-400/40 via-rose-500/10 to-transparent',
      chip: 'Comprometido',
      chipTone: 'text-rose-200',
      subtitle: 'Recurrentes'
    },
    {
      id: 'variableCosts',
      title: 'Gastos variables',
      value: stats.monthlyVariableCosts,
      icon: FileText,
      accent: 'from-amber-400/40 via-amber-500/10 to-transparent',
      chip: 'Operativos',
      chipTone: 'text-amber-200',
      subtitle: 'Este mes'
    },
    {
      id: 'netProfit',
      title: 'Ganancia neta',
      value: stats.monthlyNetProfit,
      icon: netPositive ? TrendingUp : TrendingDown,
      accent: netPositive
        ? 'from-emerald-400/30 via-emerald-500/10 to-transparent'
        : 'from-rose-400/30 via-rose-500/10 to-transparent',
      chip: `Margen ${stats.monthlyMarginPercentage.toFixed(1)}%`,
      chipTone: netPositive ? 'text-emerald-200' : 'text-rose-200',
      subtitle: netPositive ? 'Rentable' : 'Revisar costos'
    },
  ];

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
  }, [user, loadingAuth, selectedLocationId]);

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
      <div className="dashboard-surface space-y-10 text-white">
        {/* Header Section */}
        <GlassPanel className="p-6 space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">Resumen</p>
                <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
                <p className="text-white/70">Resumen de tu consultorio médico</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:justify-end">
              <LocationSelector
                selectedLocationId={selectedLocationId}
                onLocationChange={setSelectedLocationId}
                allowAll={true}
                className="pill-select w-full sm:w-auto"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <Button
                  variant="outline"
                  onClick={loadDashboardData}
                  disabled={loading}
                  className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/15"
                >
                  <Activity className="h-4 w-4" />
                  <span>{loading ? 'Cargando…' : 'Actualizar'}</span>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/15"
                >
                  <Link href="/dashboard/settings/doctors" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configuración
                  </Link>
                </Button>
                <Button
                  asChild
                  className="rounded-full bg-gradient-to-r from-emerald-300 via-sky-300 to-purple-300 text-slate-900 shadow-[0_20px_60px_rgba(56,189,248,0.35)] hover:-translate-y-0.5"
                >
                  <Link href="/patients/new" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Nuevo Paciente
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </GlassPanel>

      {error && (
        <GlassPanel className="border border-amber-400/40 bg-amber-500/10 p-4 text-amber-100">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">{error}</span>
          </div>
        </GlassPanel>
      )}

      {/* Estadísticas principales */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <MetricCard
            key={card.id}
            title={card.title}
            hint={card.hint}
            value={card.value}
            icon={card.icon}
            variant={card.variant}
            trendLabel={card.trendLabel}
            trendTone={card.trendTone}
            footer={card.footer}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <GlassPanel className="p-6 space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Ingresos del mes</p>
              <div className="mt-2 flex items-baseline gap-3">
                <p className="text-4xl font-semibold text-white">
                  {formatCurrency(stats.monthlyRevenue)}
                </p>
                {stats.revenueChangePercent !== 0 && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    stats.revenueChangePercent > 0
                      ? 'bg-emerald-400/20 text-emerald-200'
                      : 'bg-rose-400/20 text-rose-200'
                  }`}>
                    {stats.revenueChangePercent > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(stats.revenueChangePercent).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-sm text-white/70">Comparado con el mes anterior</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="mt-4 h-24">
            <ChartLine
              data={{
                labels: stats.last30DaysRevenue.map((d) => d.date),
                datasets: [
                  {
                    data: stats.last30DaysRevenue.map((d) => d.revenue),
                    borderColor: '#34d399',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: {
                      target: 'origin',
                      above: 'rgba(52,211,153,0.08)',
                    },
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.92)',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5f5',
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                      label: (context: any) => formatCurrency(context.parsed.y),
                    },
                  },
                },
                scales: {
                  x: { display: false },
                  y: { display: false },
                },
                interaction: { intersect: false, mode: 'index' },
              }}
            />
          </div>
          <p className="text-xs text-white/60">Últimos 30 días</p>
        </GlassPanel>

        <GlassPanel className="p-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">Facturación</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-white/70">Facturado</p>
              <p className="text-3xl font-semibold text-white">{formatCurrency(stats.billingStats.billedRevenue)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/60">No facturado</p>
              <p className="text-xl font-semibold text-white/90">
                {formatCurrency(stats.billingStats.nonBilledRevenue)}
              </p>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-sky-300"
              style={{ width: `${Math.min(100, stats.billingStats.billedPercentage || 0)}%` }}
            />
          </div>
          <p className="text-xs text-white/60">
            {stats.billingStats.billedPercentage.toFixed(1)}% del ingreso ya tiene factura emitida.
          </p>
        </GlassPanel>
      </div>

      {/* === QUICK WIN 5: Widget Próximas 2 Horas === */}
      {stats.upcomingAppointmentsNext2Hours.length > 0 && (
        <GlassPanel className="p-6 space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Próximas 2 horas</h2>
                <p className="text-white/70 text-sm">
                  {stats.upcomingAppointmentsNext2Hours.length} {stats.upcomingAppointmentsNext2Hours.length === 1 ? 'cita' : 'citas'} en camino
                </p>
              </div>
            </div>
            <Button asChild className="rounded-full bg-white/15 text-white hover:bg-white/25">
              <Link href="/appointments" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Ver agenda completa
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stats.upcomingAppointmentsNext2Hours.map((apt) => (
              <div key={apt.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{apt.patient_name}</p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-white/70">
                      <Clock className="h-4 w-4 text-emerald-300" />
                      <span>{apt.scheduled_time.substring(0, 5)} h</span>
                    </div>
                    {apt.appointment_type_name && (
                      <p className="text-xs text-white/60 mt-1 truncate">{apt.appointment_type_name}</p>
                    )}
                    {apt.notes && (
                      <p className="text-xs text-white/50 mt-1 truncate">{apt.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
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
        <GlassPanel className="p-6 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center">
                <PieChart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Métodos de pago</h2>
                <p className="text-sm text-white/70">Distribución de ingresos por canal</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/60">
              <span>Realtime</span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="h-[260px]">
                <Doughnut data={paymentChartData} options={paymentChartOptions} />
              </div>
            </div>
            <div className="grid gap-4">
              {[{
                label: 'Efectivo',
                value: stats.paymentMethods.efectivo,
                icon: Banknote,
                gradient: 'from-emerald-400/30 via-emerald-500/20 to-transparent'
              }, {
                label: 'Tarjeta',
                value: stats.paymentMethods.tarjeta,
                icon: CreditCard,
                gradient: 'from-sky-400/30 via-sky-500/20 to-transparent'
              }, {
                label: 'Transferencia',
                value: stats.paymentMethods.transferencia,
                icon: ArrowUpRight,
                gradient: 'from-purple-400/30 via-purple-500/20 to-transparent'
              }].map(({ label, value, icon: Icon, gradient }) => (
                <div
                  key={label}
                  className={`rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} p-4`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70 flex items-center gap-2">
                        <Icon className="h-4 w-4 text-white" />
                        {label}
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-white">{formatCurrency(value)}</p>
                      <p className="text-xs text-white/60 mt-1">
                        {stats.totalRevenue > 0
                          ? ((value / stats.totalRevenue) * 100).toFixed(1)
                          : 0}% del total
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Estado del Inventario - Solo Alertas Críticas */}
      {(inventoryHealth.low_items.length > 0 || inventoryHealth.critical_items.length > 0) && (
        <GlassPanel className="border border-rose-400/40 p-6 shadow-[0_20px_60px_rgba(244,63,94,0.15)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center animate-pulse">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">Inventario</p>
                <h2 className="text-2xl font-semibold text-white">Alertas activas</h2>
                <p className="text-sm text-white/70">
                  {inventoryHealth.critical_items.length} agotados • {inventoryHealth.low_items.length} bajos
                </p>
              </div>
            </div>
            <Button asChild className="rounded-full bg-white/15 text-white hover:bg-white/25">
              <Link href="/inventory" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Gestionar inventario
              </Link>
            </Button>
          </div>

          {inventoryHealth.critical_items.length > 0 && (
            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {inventoryHealth.critical_items.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-gradient-to-br from-rose-500/20 via-rose-500/5 to-transparent p-4">
                  <p className="font-semibold text-white">{item.nombre}</p>
                  <p className="text-sm text-white/70">Agotado · Min {item.stock_minimo}</p>
                </div>
              ))}
              {inventoryHealth.critical_items.length > 6 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-center">
                  <p className="text-sm text-white/70 font-medium">
                    +{inventoryHealth.critical_items.length - 6} más
                  </p>
                </div>
              )}
            </div>
          )}

          {inventoryHealth.critical_items.length === 0 && inventoryHealth.low_items.length > 0 && (
            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {inventoryHealth.low_items.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">{item.nombre}</p>
                  <p className="text-sm text-white/70">Stock {item.stock_actual} · Min {item.stock_minimo}</p>
                </div>
              ))}
              {inventoryHealth.low_items.length > 6 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-center">
                  <p className="text-sm text-white/70 font-medium">
                    +{inventoryHealth.low_items.length - 6} más
                  </p>
                </div>
              )}
            </div>
          )}
        </GlassPanel>
      )}

      {/* Estadísticas financieras mensuales */}
      <GlassPanel className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-400 flex items-center justify-center">
            <PieChart className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Finanzas</p>
            <h2 className="text-2xl font-semibold text-white">Resumen mensual</h2>
            <p className="text-sm text-white/70">Ingresos, gastos y margen del periodo actual</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {financialHighlights.map(({ id, title, value, icon: Icon, accent, chip, chipTone, subtitle }) => (
            <div key={id} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${accent} p-4`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-white/70">{title}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(value)}</p>
                  <p className={`text-xs ${chipTone} mt-1`}>{chip}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.35em] text-white/50">{subtitle}</p>
            </div>
          ))}
        </div>
      </GlassPanel>



      {/* Mini Agenda */}
      <GlassPanel className="p-0">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Agenda</p>
            <h3 className="text-lg font-semibold text-white">Próximas citas</h3>
          </div>
        </div>
        <div className="p-6">
          <MiniAgenda />
        </div>
      </GlassPanel>

      {/* Registros recientes */}
      <GlassPanel className="p-0">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Actividad</p>
            <h3 className="text-lg font-semibold text-white">Registros recientes</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {stats.recentRecords.length > 0 ? (
              stats.recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{record.patient_name}</p>
                      <p className="text-sm text-white/70">{record.treatment_name}</p>
                      <p className="text-xs text-white/60 flex items-center gap-2">
                        <span>{new Date(record.fecha).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">{record.metodo_pago}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-semibold text-white">{formatCurrency(record.monto_pagado || 0)}</p>
                    <p className="text-sm text-emerald-200 font-medium">
                      +{formatCurrency(record.ganancia || 0)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 py-8 text-center">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-white/70" />
                </div>
                <p className="text-white/60">No hay registros recientes</p>
              </div>
            )}
          </div>
        </div>
      </GlassPanel>
      </div>
    </AppLayout>
  );
}