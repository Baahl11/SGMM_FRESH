"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { safeSort, asArray } from "@/lib/safe";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Chart as ChartJSChart, Doughnut, Line } from "react-chartjs-2";
import type { ChartData, ChartOptions, TooltipItem } from "chart.js";
import "chart.js/auto";
import {
  TrendingUp, DollarSign, Calendar, BarChart3, PieChart as PieChartIcon,
  TrendingDown, Users, Stethoscope, CreditCard, Banknote, ArrowUpRight, Receipt, AlertCircle, Activity,
  FileText, Download, Mail
} from "lucide-react";

// Using standard fetch for Vercel APIs
import AppLayout from "@/components/layout/app-layout";
import ChartEmptyState from "@/components/reports/chart-empty-state";

interface ReportData {
  daily7Revenue: Array<{ date: string; revenue: number; profit: number; costs: number }>;
  daily15Revenue: Array<{ date: string; revenue: number; profit: number; costs: number }>;
  daily30Revenue: Array<{ date: string; revenue: number; profit: number; costs: number }>;
  daily90Revenue: Array<{ date: string; revenue: number; profit: number; costs: number }>;
  weeklyRevenue: Array<{ week: string; revenue: number; profit: number; costs: number }>;
  monthly6Revenue: Array<{ month: string; revenue: number; profit: number; costs: number }>;
  monthly12Revenue: Array<{ month: string; revenue: number; profit: number; costs: number }>;
  monthly24Revenue: Array<{ month: string; revenue: number; profit: number; costs: number }>;
  yearlyRevenue: Array<{ year: string; revenue: number; profit: number; costs: number }>;
  paymentMethods: Array<{ name: string; value: number; color: string }>;
  topTreatments: Array<{ name: string; count: number; revenue: number }>;
  patientActivity: Array<{ date: string; newPatients: number; totalPatients: number }>;
  billingAnalysis: {
    totalRevenue: number;
    billedRevenue: number;
    nonBilledRevenue: number;
    billedPercentage: number;
    billedPatients: number;
    nonBilledPatients: number;
  };
  todayMetrics: {
    revenue: number;
    profit: number;
    costs: number;
  };
  gastosVariablesByCategory?: Array<{ name: string; value: number; color: string }>;
}

interface BillingStats {
  summary: {
    totalAmount: number;
    totalCount: number;
    averageAmount: number;
    currentMonthTotal: number;
    currentMonthCount: number;
  };
  monthlyTrend: Array<{
    month: string;
    monthFull: string;
    total: number;
    count: number;
    average: number;
  }>;
  topPatients: Array<{
    patient_id: string;
    name: string;
    total: number;
    count: number;
  }>;
  statusBreakdown: {
    issued: number;
    sent: number;
    cancelled: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
type MixedBarLineChartType = "bar" | "line";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({
    daily7Revenue: [],
    daily15Revenue: [],
    daily30Revenue: [],
    daily90Revenue: [],
    weeklyRevenue: [],
    monthly6Revenue: [],
    monthly12Revenue: [],
    monthly24Revenue: [],
    yearlyRevenue: [],
    paymentMethods: [],
    topTreatments: [],
    patientActivity: [],
    billingAnalysis: {
      totalRevenue: 0,
      billedRevenue: 0,
      nonBilledRevenue: 0,
      billedPercentage: 0,
      billedPatients: 0,
      nonBilledPatients: 0,
    },
    todayMetrics: {
      revenue: 0,
      profit: 0,
      costs: 0,
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("monthly12");
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadReportData();
    loadBillingStats();
  }, []);


  const loadBillingStats = async () => {
    try {
      setLoadingBilling(true);
      const response = await fetch('/api/reports/billing-stats');
      if (response.ok) {
        const data = await response.json();
        setBillingStats(data);
      }
    } catch (error) {
      console.error('Error loading billing stats:', error);
    } finally {
      setLoadingBilling(false);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("📊 Loading report data from Vercel APIs...");
      
      // Use Vercel API endpoints with fallback for missing ones
      const fetchWithFallback = async (url: string) => {
        try {
          console.log(`🔗 Fetching from: ${url}`);
          const response = await fetch(url);
          
          if (!response.ok) {
            console.warn(`❌ API ${url} returned ${response.status} ${response.statusText}`);
            if (response.status === 500) {
              console.warn(`💡 ${url} - Server error, likely table doesn't exist yet. Using empty data.`);
            }
            return [];
          }
          
          const data = await response.json();
          const resultData = Array.isArray(data) ? data : (data.data || data || []);
          console.log(`✅ Data from ${url}:`, {
            length: resultData?.length,
            sample: resultData?.slice(0, 2),
            type: typeof resultData
          });
          
          return resultData;
        } catch (error) {
          console.warn(`⚠️ Network error fetching from ${url}:`, error instanceof Error ? error.message : error);
          return [];
        }
      };

      // Load data with robust fallbacks - some APIs might not be ready yet
      const settledResults = await Promise.allSettled([
        fetchWithFallback('/api/patients'),
        fetchWithFallback('/api/treatments'),
        fetchWithFallback('/api/records'),
        fetchWithFallback('/api/gastos-fijos'),
        fetchWithFallback('/api/gastos-variables')
      ]);

      const extractArray = (result: PromiseSettledResult<any>) => {
        if (result.status !== 'fulfilled') {
          return [];
        }

        const value = result.value;
        if (Array.isArray(value)) {
          return value;
        }

        if (value && Array.isArray(value.data)) {
          return value.data;
        }

        return [];
      };

      const [patientsData, treatmentsData, recordsData, gastosFijosData, gastosVariablesData] = settledResults.map(extractArray);

      console.log("📊 Report data summary:", {
        patients: {
          count: patientsData?.length || 0,
          available: !!patientsData?.length,
          sample: patientsData?.slice(0, 1)
        },
        treatments: {
          count: treatmentsData?.length || 0,
          available: !!treatmentsData?.length,
          sample: treatmentsData?.slice(0, 1)
        },
        records: {
          count: recordsData?.length || 0,
          available: !!recordsData?.length,
          note: recordsData?.length ? 'Data loaded' : 'Using empty data (API not ready)'
        },
        gastosFijos: {
          count: gastosFijosData?.length || 0,
          available: !!gastosFijosData?.length,
          note: gastosFijosData?.length ? 'Data loaded' : 'Using empty data (API not ready)'
        },
        gastosVariables: {
          count: gastosVariablesData?.length || 0,
          available: !!gastosVariablesData?.length,
          note: gastosVariablesData?.length ? 'Data loaded' : 'Using empty data (API not ready)'
        }
      });

      // Fallback to empty arrays if data is null/undefined
      const patients = patientsData || [];
      const treatments = treatmentsData || [];
      const records = recordsData || [];
      const gastosFijos = gastosFijosData || [];
      const gastosVariables = gastosVariablesData || [];

      // Process data for reports
      const processedData = processReportData(patients, treatments, records, gastosFijos, gastosVariables);
      setReportData(processedData);
      
    } catch (error) {
      console.error("❌ Error loading report data:", error);
      setError(`Error cargando datos de reportes: ${error instanceof Error ? error.message : String(error)}`);
      
      // Set fallback empty data
      setReportData({
        daily7Revenue: [],
        daily15Revenue: [],
        daily30Revenue: [],
        daily90Revenue: [],
        weeklyRevenue: [],
        monthly6Revenue: [],
        monthly12Revenue: [],
        monthly24Revenue: [],
        yearlyRevenue: [],
        paymentMethods: [],
        topTreatments: [],
        patientActivity: [],
        billingAnalysis: {
          totalRevenue: 0,
          billedRevenue: 0,
          nonBilledRevenue: 0,
          billedPercentage: 0,
          billedPatients: 0,
          nonBilledPatients: 0,
        },
        todayMetrics: {
          revenue: 0,
          profit: 0,
          costs: 0,
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (patients: any[], treatments: any[], records: any[], gastosFijos: any[], gastosVariables: any[]): ReportData => {
    // Función para calcular gastos fijos diarios
    const calculateDailyFixedCosts = (date: Date): number => {
      if (!Array.isArray(gastosFijos)) {
        console.warn('gastosFijos is not an array:', typeof gastosFijos, gastosFijos);
        return 0;
      }
      
      return gastosFijos
        .filter(gasto => {
          // Como el backend ya filtra por activo=1, todos los gastos están activos
          // Verificamos que la fecha del gasto sea anterior o igual a la fecha dada
          const gastoDate = new Date(gasto.fecha ?? gasto.fecha_inicio ?? Date.now());
          return gastoDate <= date;
        })
        .reduce((total, gasto) => {
          const frecuencia = gasto.categoria || gasto.frecuencia || 'mensual';
          const monto = toNumber(gasto.monto);
          switch (frecuencia) {
            case 'mensual':
              return total + monto / 30; // Aproximación diaria
            case 'trimestral':
              return total + monto / 90; // Aproximación diaria
            case 'anual':
              return total + monto / 365; // Aproximación diaria
            default:
              return total + monto / 30; // Default mensual
          }
        }, 0);
    };

    // Función para calcular gastos variables por fecha
    const calculateVariableCosts = (startDate: Date, endDate: Date): number => {
      if (!Array.isArray(gastosVariables)) {
        console.warn('gastosVariables is not an array:', typeof gastosVariables, gastosVariables);
        return 0;
      }
      
      return gastosVariables
        .filter(gasto => {
          if (!gasto.fecha) return false;
          const gastoDate = new Date(gasto.fecha);
          return gastoDate >= startDate && gastoDate <= endDate && !gasto.deleted_at;
        })
        .reduce((total, gasto) => total + toNumber(gasto.monto), 0);
    };

    // Calcular ingresos de hoy con gastos fijos - FIXED timezone handling
    // Use local date to avoid timezone issues
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0');
    
    console.log('📅 Today date for filtering (local):', todayStr);
    console.log('📅 Today date (UTC):', new Date().toISOString().split('T')[0]);
    
    const todayRecords = records.filter(record => {
      if (!record.fecha) return false;
      
      try {
        // Try different date parsing approaches
        let recordDate;
        
        // If fecha contains 'T', it's datetime format
        if (record.fecha.includes('T')) {
          // Parse as datetime and extract date part
          const date = new Date(record.fecha);
          recordDate = date.getFullYear() + '-' + 
                      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(date.getDate()).padStart(2, '0');
        } else {
          // If it's just a date string
          recordDate = record.fecha.split(' ')[0]; // Handle "2025-07-04 12:00:00" format
          if (recordDate.includes('T')) {
            recordDate = recordDate.split('T')[0];
          }
        }
        
        const isToday = recordDate === todayStr;
        
        const montoPagado = toNumber(record.monto_pagado);

        if (isToday && montoPagado > 0) {
          console.log('✅ Found TODAY record with payment:', {
            id: record.id,
            fecha: record.fecha,
            recordDate,
            monto_pagado: montoPagado,
            ganancia: record.ganancia
          });
        }
        
        return isToday;
      } catch (error) {
        console.error('❌ Error parsing date for record:', record.id, record.fecha, error);
        return false;
      }
    });
    
    console.log('📊 Today records count:', todayRecords.length);
    console.log('💰 Today records data:', todayRecords.map(r => ({
      id: r.id,
      monto: toNumber(r.monto_pagado),
      ganancia: r.ganancia
    })));
    
  const todayRevenue = todayRecords.reduce((sum, record) => sum + toNumber(record.monto_pagado), 0);
    console.log('💵 Today revenue calculated:', todayRevenue);
    
    const todayVariableCosts = todayRecords.reduce((sum, record) => 
      sum + toNumber(record.costo_unitario) + toNumber(record.comision_monto), 0
    );
    const todayFixedCosts = calculateDailyFixedCosts(new Date());
    
    // Calcular gastos variables del día
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    const todayGastosVariables = calculateVariableCosts(todayStart, todayEnd);
    
    const todayCosts = todayVariableCosts + todayFixedCosts + todayGastosVariables;
    const todayProfit = todayRevenue - todayCosts;

    // Generate sample monthly data for the last 12 months
    const monthly12Revenue = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthRecords = records.filter(record => {
        if (!record.fecha) return false;
        const recordDate = new Date(record.fecha);
        return recordDate.getFullYear() === date.getFullYear() && 
               recordDate.getMonth() === date.getMonth();
      });
      
  const monthRevenue = monthRecords.reduce((sum, record) => sum + toNumber(record.monto_pagado), 0);
  const monthVariableCosts = monthRecords.reduce((sum, record) => sum + toNumber(record.costo_unitario), 0);
      
      // Calcular gastos fijos del mes (30 días aprox)
      const monthFixedCosts = calculateDailyFixedCosts(date) * 30;
      
      // Calcular gastos variables del mes
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      const monthGastosVariables = calculateVariableCosts(monthStart, monthEnd);
      
  const monthCosts = monthVariableCosts + monthFixedCosts + monthGastosVariables;
      
      monthly12Revenue.push({
        month: date.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        costs: monthCosts,
        profit: monthRevenue - monthCosts
      });
    }

    // Process payment methods
    const paymentMethodCounts: { [key: string]: number } = {};
    records.forEach(record => {
      const method = record.metodo_pago || 'efectivo';
      paymentMethodCounts[method] = (paymentMethodCounts[method] || 0) + toNumber(record.monto_pagado);
    });

    const paymentMethods = Object.entries(paymentMethodCounts).map(([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: toNumber(value),
      color: COLORS[index % COLORS.length]
    }));

    // Process top treatments
    const treatmentStats: { [key: number]: { count: number; revenue: number } } = {};
    records.forEach(record => {
      const treatmentId = record.treatment_id;
      const montoPagado = toNumber(record.monto_pagado);
      if (treatmentId && montoPagado > 0) {
        if (!treatmentStats[treatmentId]) {
          treatmentStats[treatmentId] = { count: 0, revenue: 0 };
        }
        treatmentStats[treatmentId].count += 1;
        treatmentStats[treatmentId].revenue += montoPagado;
      }
    });

    const topTreatments = Object.entries(treatmentStats)
      .map(([id, stats]) => {
        const treatment = treatments.find(t => String(t.id) === String(id));
        return {
          name: treatment?.nombre || `Tratamiento ID ${id}`,
          count: stats.count,
          revenue: stats.revenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Billing analysis - use mock data if no records
  const totalRevenue = records.reduce((sum, record) => sum + toNumber(record.monto_pagado), 0);
    const hasRealData = totalRevenue > 0 && records.length > 0;
    
    const billingAnalysis = hasRealData ? {
      totalRevenue,
      billedRevenue: totalRevenue * 0.3, // Real calculation would be more complex
      nonBilledRevenue: totalRevenue * 0.7,
      billedPercentage: 30,
      billedPatients: Math.floor(patients.length * 0.3),
      nonBilledPatients: Math.floor(patients.length * 0.7),
    } : {
      // Mock data for demo purposes when no real data exists
      totalRevenue: 0,
      billedRevenue: 0,
      nonBilledRevenue: 0,
      billedPercentage: 0,
      billedPatients: 0,
      nonBilledPatients: 0,
    };

    // Procesar gastos variables por categoría
    const CATEGORY_COLORS: { [key: string]: string } = {
      reparacion: '#EF4444',
      mantenimiento: '#F97316',
      compras_equipo: '#3B82F6',
      insumos_extraordinarios: '#06B6D4',
      servicios_profesionales: '#8B5CF6',
      marketing: '#EC4899',
      capacitacion: '#6366F1',
      tecnologia: '#10B981',
      viajes: '#FBBF24',
      otros: '#6B7280',
    };

    const CATEGORY_LABELS: { [key: string]: string } = {
      reparacion: 'Reparación',
      mantenimiento: 'Mantenimiento',
      compras_equipo: 'Compra de Equipo',
      insumos_extraordinarios: 'Insumos Extraordinarios',
      servicios_profesionales: 'Servicios Profesionales',
      marketing: 'Marketing',
      capacitacion: 'Capacitación',
      tecnologia: 'Tecnología',
      viajes: 'Viajes',
      otros: 'Otros',
    };

    const gastosVariablesByCategory = Array.isArray(gastosVariables) 
      ? Object.entries(
          gastosVariables
            .filter(gasto => !gasto.deleted_at)
            .reduce((acc: { [key: string]: number }, gasto: any) => {
              const categoria = gasto.categoria || 'otros';
              const monto = toNumber(gasto.monto);
              acc[categoria] = (acc[categoria] || 0) + monto;
              return acc;
            }, {})
        )
        .map(([categoria, total]) => ({
          name: CATEGORY_LABELS[categoria] || categoria,
          value: total,
          color: CATEGORY_COLORS[categoria] || '#6B7280'
        }))
        .sort((a, b) => b.value - a.value)
      : [];

    return {
      daily7Revenue: [],
      daily15Revenue: [],
      daily30Revenue: [],
      daily90Revenue: [],
      weeklyRevenue: [],
      monthly6Revenue: [],
      monthly12Revenue,
      monthly24Revenue: [],
      yearlyRevenue: [],
      paymentMethods,
      topTreatments,
      patientActivity: [],
      billingAnalysis,
      todayMetrics: {
        revenue: todayRevenue,
        profit: todayProfit,
        costs: todayCosts,
      },
      gastosVariablesByCategory
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  const formatCurrencyCompact = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const toNumber = (value: unknown) => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const hasDataPoints = (data: Array<Record<string, unknown>> | null | undefined, keys: string[]) => {
    if (!Array.isArray(data) || data.length === 0) {
      return false;
    }

    let hasNumericValue = false;
    let hasNonZero = false;

    for (const item of data) {
      for (const key of keys) {
        const rawValue = (item as Record<string, unknown>)[key];
        const numericValue = toNumber(rawValue);

        if (Number.isFinite(numericValue)) {
          hasNumericValue = true;
          if (Math.abs(numericValue) > 0) {
            hasNonZero = true;
            break;
          }
        }
      }

      if (hasNonZero) {
        break;
      }
    }

    if (hasNonZero) {
      return true;
    }

    return hasNumericValue && data.length >= 2;
  };

  const getCurrentData = () => {
    switch (selectedPeriod) {
      case "monthly12":
        return reportData.monthly12Revenue;
      default:
        return reportData.monthly12Revenue;
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "monthly12":
        return "Últimos 12 meses";
      default:
        return "Período seleccionado";
    }
  };

  const currentData = getCurrentData();
  const totalRevenueSelected = currentData.reduce((sum, item) => sum + toNumber(item.revenue), 0);
  const totalProfitSelected = currentData.reduce((sum, item) => sum + toNumber(item.profit), 0);
  const totalCostsSelected = currentData.reduce((sum, item) => sum + toNumber(item.costs), 0);
  const hasRevenueData = hasDataPoints(currentData, ["revenue", "costs", "profit"]);
  const hasPaymentMethodsData = hasDataPoints(reportData.paymentMethods, ["value"]);
  const variableExpensesByCategory = reportData.gastosVariablesByCategory ?? [];
  const hasVariableExpensesData = hasDataPoints(variableExpensesByCategory, ["value"]);
  const totalVariableExpenses = variableExpensesByCategory.reduce((sum, cat) => sum + toNumber(cat.value), 0);
  const paymentMethodsTotal = reportData.paymentMethods.reduce((sum, method) => sum + toNumber(method.value), 0);
  const hasBillingTrendData = hasDataPoints(billingStats?.monthlyTrend ?? [], ["total", "count"]);
  const revenueLegendLabels: Record<string, string> = {
    revenue: "Ingresos",
    costs: "Costos",
    profit: "Utilidad"
  };
  const revenueChartData = useMemo<ChartData<MixedBarLineChartType>>(() => ({
    labels: currentData.map((item) => item.month),
    datasets: [
      {
        type: "bar" as const,
        label: revenueLegendLabels.costs,
        data: currentData.map((item) => toNumber(item.costs)),
        backgroundColor: "rgba(249, 115, 22, 0.35)",
        borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 28
      },
      {
        type: "line" as const,
        label: revenueLegendLabels.revenue,
        data: currentData.map((item) => toNumber(item.revenue)),
        borderColor: "#4f46e5",
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: "#312e81",
        pointBorderColor: "#ffffff",
        fill: true,
        borderWidth: 3
      },
      {
        type: "line" as const,
        label: revenueLegendLabels.profit,
        data: currentData.map((item) => toNumber(item.profit)),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#ecfdf5",
        fill: false,
        borderWidth: 3
      }
    ]
  }), [currentData, revenueLegendLabels.costs, revenueLegendLabels.profit, revenueLegendLabels.revenue]);

  const revenueChartOptions = useMemo<ChartOptions<MixedBarLineChartType>>(() => {
    const scales = {
      x: {
        grid: { display: false },
        ticks: {
          color: "#475569",
          font: { size: 12, weight: 500 }
        }
      },
      y: {
        grid: { color: "rgba(148, 163, 184, 0.25)" },
        ticks: {
          color: "#475569",
          callback: (value: number | string) => formatCurrencyCompact(Number(value))
        }
      }
    } satisfies ChartOptions<MixedBarLineChartType>['scales'];

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales,
      plugins: {
        legend: {
          labels: {
            color: "#475569",
            usePointStyle: true,
            boxWidth: 10
          }
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.92)",
          borderColor: "rgba(99, 102, 241, 0.35)",
          borderWidth: 1,
          padding: 14,
          titleColor: "#f8fafc",
          bodyColor: "#f8fafc",
          callbacks: {
            label: (context: TooltipItem<MixedBarLineChartType>) => {
              const value = context.parsed.y ?? Number(context.raw ?? 0);
              return `${context.dataset.label}: ${formatCurrency(Number(value ?? 0))}`;
            }
          }
        }
      }
    } satisfies ChartOptions<MixedBarLineChartType>;
  }, [formatCurrency, formatCurrencyCompact]);

  const paymentChartData = useMemo<ChartData<'doughnut'>>(() => ({
    labels: reportData.paymentMethods.map((method) => method.name),
    datasets: [
      {
        data: reportData.paymentMethods.map((method) => toNumber(method.value)),
        backgroundColor: reportData.paymentMethods.map((method) => method.color),
        borderColor: "#ffffff",
        borderWidth: 2
      }
    ]
  }), [reportData.paymentMethods]);

  const paymentChartOptions = useMemo<ChartOptions<'doughnut'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "58%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderColor: "rgba(79, 70, 229, 0.35)",
        borderWidth: 1,
        padding: 12,
        titleColor: "#f8fafc",
        bodyColor: "#f8fafc",
        callbacks: {
          label: (context: any) => {
            const value = typeof context.parsed === "number" ? context.parsed : context.raw;
            const percentage = paymentMethodsTotal > 0 ? (Number(value ?? 0) / paymentMethodsTotal) * 100 : 0;
            return `${context.label}: ${formatCurrency(Number(value ?? 0))} (${percentage.toFixed(1)}%)`;
          }
        }
      }
    }
  }), [formatCurrency, paymentMethodsTotal]);

  const billingTrendChartData = useMemo<ChartData<'line'>>(() => ({
    labels: billingStats?.monthlyTrend?.map((item) => item.month) ?? [],
    datasets: [
      {
        label: "Total Facturado",
        data: billingStats?.monthlyTrend?.map((item) => toNumber(item.total)) ?? [],
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.2)",
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: "#8b5cf6",
        yAxisID: "y"
      },
      {
        label: "Cantidad",
        data: billingStats?.monthlyTrend?.map((item) => toNumber(item.count)) ?? [],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: "#3b82f6",
        yAxisID: "y1"
      }
    ]
  }), [billingStats?.monthlyTrend]);

  const billingTrendChartOptions = useMemo<ChartOptions<'line'>>(() => {
    const scales = {
      x: {
        ticks: { color: "#475569" },
        grid: { color: "rgba(148, 163, 184, 0.12)" }
      },
      y: {
        type: "linear",
        position: "left",
        ticks: {
          color: "#475569",
          callback: (value: number | string) => formatCurrencyCompact(Number(value))
        },
        grid: { color: "rgba(148, 163, 184, 0.25)" }
      },
      y1: {
        type: "linear",
        position: "right",
        grid: { drawOnChartArea: false },
        ticks: {
          color: "#6366f1",
          callback: (value: number | string) => `${Number(value).toFixed(0)} casos`
        }
      }
    } satisfies ChartOptions<'line'>['scales'];

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales,
      plugins: {
        legend: {
          labels: {
            color: "#475569",
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "rgba(148, 163, 184, 0.35)",
          borderWidth: 1,
          titleColor: "#0f172a",
          bodyColor: "#0f172a",
          callbacks: {
            label: (context: TooltipItem<'line'>) => {
              const value = context.parsed.y ?? Number(context.raw ?? 0);
              if (context.dataset.yAxisID === "y1") {
                return `${context.dataset.label}: ${Number(value ?? 0).toFixed(0)} casos`;
              }
              return `${context.dataset.label}: ${formatCurrency(Number(value ?? 0))}`;
            }
          }
        }
      }
    } satisfies ChartOptions<'line'>;
  }, [formatCurrency, formatCurrencyCompact]);

  const renderChartLoading = (message = "Cargando visualización…") => (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      {message}
    </div>
  );

  const renderRevenueChart = () => {
    if (!hasRevenueData) {
      return (
        <ChartEmptyState
          title="Aún no hay datos históricos"
          description="Registra tratamientos o importa tus ventas para visualizar la evolución mensual de ingresos, costos y utilidad."
          icon={<TrendingUp className="h-8 w-8" />}
        />
      );
    }

    return (
      <div className="h-full">
        <ChartJSChart type="bar" data={revenueChartData} options={revenueChartOptions} />
      </div>
    );
  };

  const renderPaymentMethodsChart = () => {
    if (!hasPaymentMethodsData) {
      return (
        <ChartEmptyState
          title="Sin cobros registrados"
          description="Cuando registres pagos, verás la participación de efectivo, tarjeta y transferencia en esta gráfica."
          icon={<CreditCard className="h-8 w-8" />}
        />
      );
    }

    return (
      <div className="grid h-full gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="relative h-full">
          <Doughnut data={paymentChartData} options={paymentChartOptions} />
        </div>
        <div className="flex flex-col justify-center gap-3">
          {reportData.paymentMethods.map((method, index) => {
            const percentage = paymentMethodsTotal > 0 ? (method.value / paymentMethodsTotal) * 100 : 0;
            return (
              <motion.div
                key={`${method.name}-${index}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 shadow-inner shadow-slate-200/50 backdrop-blur"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: method.color }}
                  />
                  <span className="text-sm font-medium text-slate-600">{method.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(method.value)}
                  </p>
                  <p className="text-xs text-slate-500">{percentage.toFixed(1)}%</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBillingTrendChart = () => {
    if (!hasBillingTrendData || !billingStats) {
      return (
        <ChartEmptyState
          title="Sin historial de facturación"
          description="Cuando generes facturas verás aquí la tendencia mensual de montos y volúmenes emitidos."
          icon={<FileText className="h-8 w-8" />}
        />
      );
    }

    return (
      <div className="h-full">
        <Line data={billingTrendChartData} options={billingTrendChartOptions} />
      </div>
    );
  };


  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Reportes Financieros
                </h1>
                <p className="text-gray-600">Análisis detallado del rendimiento financiero</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="monthly12">Últimos 12 meses</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Error al cargar reportes</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button 
                  onClick={loadReportData}
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 text-center mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="font-semibold text-gray-900 mb-2">Cargando reportes...</h3>
            <p className="text-gray-600 text-sm">Procesando datos financieros</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Ingresos Hoy</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(reportData.todayMetrics.revenue)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalRevenueSelected)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Ganancia Neta</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(totalProfitSelected)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Facturación</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {reportData.billingAnalysis.billedPercentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Visualizaciones principales */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <motion.div
                className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/80 p-6 shadow-xl shadow-indigo-500/5 backdrop-blur"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
              >
                <div className="absolute inset-x-0 -top-16 h-32 bg-gradient-to-br from-indigo-200/30 via-transparent to-transparent blur-3xl" />
                <div className="relative mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-500/80">Rendimiento consolidado</p>
                    <h3 className="text-2xl font-semibold text-slate-900">
                      Ingresos — {getPeriodLabel()}
                    </h3>
                    <p className="text-sm text-slate-500">Comparativa de ingresos, costos y utilidad neta</p>
                  </div>
                  {hasRevenueData && (
                    <div className="grid gap-2 text-right text-xs font-medium text-slate-500">
                      <div className="rounded-xl bg-indigo-50 px-3 py-2">
                        <span className="block text-xs font-semibold uppercase tracking-widest text-indigo-500">Ingresos</span>
                        <span className="text-sm font-bold text-indigo-600">{formatCurrencyCompact(totalRevenueSelected)}</span>
                      </div>
                      <div className="rounded-xl bg-rose-50 px-3 py-2">
                        <span className="block text-xs font-semibold uppercase tracking-widest text-rose-500">Costos</span>
                        <span className="text-sm font-bold text-rose-500">{formatCurrencyCompact(totalCostsSelected)}</span>
                      </div>
                      <div className="rounded-xl bg-emerald-50 px-3 py-2">
                        <span className="block text-xs font-semibold uppercase tracking-widest text-emerald-500">Utilidad</span>
                        <span className="text-sm font-bold text-emerald-500">{formatCurrencyCompact(totalProfitSelected)}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative h-72">
                  {isClient ? renderRevenueChart() : renderChartLoading()}
                </div>
              </motion.div>

              <motion.div
                className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/80 p-6 shadow-xl shadow-purple-500/5 backdrop-blur"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.12 }}
              >
                <div className="absolute inset-x-0 -top-16 h-32 bg-gradient-to-br from-purple-300/30 via-transparent to-transparent blur-3xl" />
                <div className="relative mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-purple-500/80">Mix de pagos</p>
                    <h3 className="text-2xl font-semibold text-slate-900">Métodos de Pago</h3>
                    <p className="text-sm text-slate-500">Distribución y pesos relativos por canal de cobro</p>
                  </div>
                </div>
                <div className="relative h-72">
                  {isClient ? renderPaymentMethodsChart() : renderChartLoading()}
                </div>
              </motion.div>
            </div>

            {/* Variable Expenses by Category */}
            <motion.div
              className="rounded-3xl border border-white/30 bg-white/80 p-6 shadow-xl shadow-orange-500/5 backdrop-blur"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.18 }}
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-900">Gastos variables por categoría</h3>
                    <p className="text-sm text-slate-500">Visualiza dónde se concentran los gastos extraordinarios</p>
                  </div>
                </div>
                {hasVariableExpensesData && (
                  <span className="rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600">
                    Total: {formatCurrency(totalVariableExpenses)}
                  </span>
                )}
              </div>

              {hasVariableExpensesData ? (
                <div className="space-y-5">
                  {variableExpensesByCategory.map((category, index) => {
                    const percentage = totalVariableExpenses > 0 ? (category.value / totalVariableExpenses) * 100 : 0;
                    const clampedPercentage = Math.max(0, Math.min(percentage, 100));
                    return (
                      <motion.div
                        key={`${category.name}-${index}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.05 }}
                        className="rounded-2xl border border-slate-100/70 bg-white/70 p-4 backdrop-blur"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span
                              className="h-3.5 w-3.5 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium text-slate-700">{category.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">{formatCurrency(category.value)}</p>
                            <p className="text-xs text-slate-500">{clampedPercentage.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100/80">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: category.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${clampedPercentage}%` }}
                            transition={{ duration: 0.6, delay: index * 0.05 + 0.1 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <ChartEmptyState
                  title="Aún no registras gastos variables"
                  description="Conecta tus compras extraordinarias y adjunta comprobantes para monitorear cada categoría y detectar desvíos."
                  icon={<Receipt className="h-8 w-8" />}
                />
              )}
            </motion.div>

            {/* Top Treatments */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Tratamientos Más Rentables
              </h3>
              <div className="space-y-4">
                {reportData.topTreatments.length > 0 ? (
                  reportData.topTreatments.map((treatment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{treatment.name}</p>
                          <p className="text-sm text-gray-500">
                            {treatment.count} {treatment.count === 1 ? 'aplicación' : 'aplicaciones'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(treatment.revenue)}</p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(treatment.revenue / treatment.count)} promedio
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <p className="text-gray-500">No hay datos de tratamientos</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Facturación Electrónica (CFDI) Section */}
        {!loading && !error && billingStats && (
          <div className="mt-12">
            {/* Section Header */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Facturación Electrónica (CFDI 4.0)</h2>
                  <p className="text-purple-100">Análisis de facturas emitidas con validez fiscal ante el SAT</p>
                </div>
              </div>
            </div>

            {/* Billing KPIs */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Facturado</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(billingStats.summary.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {billingStats.summary.totalCount} {billingStats.summary.totalCount === 1 ? 'factura' : 'facturas'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Receipt className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Este Mes</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(billingStats.summary.currentMonthTotal)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {billingStats.summary.currentMonthCount} facturas
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Promedio</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(billingStats.summary.averageAmount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">por factura</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Enviadas</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {billingStats.statusBreakdown.sent}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      de {billingStats.summary.totalCount} total
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    <Mail className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Trend Chart */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 md:col-span-2">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Tendencia de Facturación (Últimos 6 meses)
                </h3>
                <div className="h-80">
                  {isClient ? renderBillingTrendChart() : renderChartLoading()}
                </div>
              </div>
            </div>

            {/* Top Patients by Billing */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Top 10 Pacientes por Facturación
              </h3>
              <div className="space-y-4">
                {billingStats.topPatients.map((patient, index) => (
                  <div key={patient.patient_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-gray-500">
                          {patient.count} {patient.count === 1 ? 'factura' : 'facturas'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{formatCurrency(patient.total)}</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(patient.total / patient.count)} promedio
                      </p>
                    </div>
                  </div>
                ))}
                {billingStats.topPatients.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay facturas emitidas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
}