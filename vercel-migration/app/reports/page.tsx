"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  fixedMonthlyEstimate?: number;
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

const COLORS = ['#38bdf8', '#14b8a6', '#fbbf24', '#f472b6', '#818cf8'];
const PAYMENT_METHOD_COLORS: Record<string, string> = {
  efectivo: '#14b8a6',
  tarjeta: '#38bdf8',
  transferencia: '#fbbf24',
  mercadopago: '#a78bfa',
  stripe: '#60a5fa',
  openpay: '#fb7185',
};
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
    },
    fixedMonthlyEstimate: 0,
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
      // Use Vercel API endpoints with fallback for missing ones
      const fetchWithFallback = async (url: string) => {
        try {
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
        },
        fixedMonthlyEstimate: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (patients: any[], treatments: any[], records: any[], gastosFijos: any[], gastosVariables: any[]): ReportData => {
    const safeRecords = Array.isArray(records) ? records : [];
    const safeTreatments = Array.isArray(treatments) ? treatments : [];
    const safePatients = Array.isArray(patients) ? patients : [];
    const safeGastosFijos = Array.isArray(gastosFijos) ? gastosFijos : [];
    const safeGastosVariables = Array.isArray(gastosVariables) ? gastosVariables : [];

    const pad2 = (value: number) => String(value).padStart(2, '0');
    const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const toDateKey = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    const toMonthKey = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

    const parseDateValue = (value: unknown): Date | null => {
      if (!value) {
        return null;
      }

      if (value instanceof Date && Number.isFinite(value.getTime())) {
        return value;
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
          return null;
        }

        const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateOnlyMatch) {
          const [, year, month, day] = dateOnlyMatch;
          const dateOnly = new Date(Number(year), Number(month) - 1, Number(day));
          return Number.isFinite(dateOnly.getTime()) ? dateOnly : null;
        }

        const parsed = new Date(trimmed);
        return Number.isFinite(parsed.getTime()) ? parsed : null;
      }

      const parsed = new Date(value as any);
      return Number.isFinite(parsed.getTime()) ? parsed : null;
    };

    const calculateDailyFixedCosts = (date: Date): number => {
      if (safeGastosFijos.length === 0) {
        return 0;
      }

      return safeGastosFijos
        .filter((gasto) => {
          const startDate = parseDateValue(gasto?.fecha ?? gasto?.fecha_inicio) ?? new Date(0);
          return startDate <= date;
        })
        .reduce((total, gasto) => {
          const frequency = String(gasto?.frecuencia ?? gasto?.categoria ?? 'mensual').toLowerCase();
          const amount = toNumber(gasto?.monto);

          switch (frequency) {
            case 'quincenal':
              return total + amount / 15;
            case 'mensual':
              return total + amount / 30;
            case 'trimestral':
              return total + amount / 90;
            case 'semestral':
              return total + amount / 180;
            case 'anual':
              return total + amount / 365;
            default:
              return total + amount / 30;
          }
        }, 0);
    };

    const fixedMonthlyEstimate = safeGastosFijos
      .filter((gasto) => gasto?.activo !== false)
      .reduce((total, gasto) => {
        const frequency = String(gasto?.frecuencia ?? 'mensual').toLowerCase();
        const amount = toNumber(gasto?.monto);

        switch (frequency) {
          case 'quincenal':
            return total + amount * 2;
          case 'mensual':
            return total + amount;
          case 'trimestral':
            return total + amount / 3;
          case 'semestral':
            return total + amount / 6;
          case 'anual':
            return total + amount / 12;
          default:
            return total + amount;
        }
      }, 0);

    type NormalizedRecord = {
      treatmentId: string | null;
      paymentMethod: string;
      date: Date;
      dateKey: string;
      monthKey: string;
      revenue: number;
      directCosts: number;
    };

    const normalizedRecords = safeRecords
      .map((record): NormalizedRecord | null => {
        const parsedDate = parseDateValue(record?.fecha);
        if (!parsedDate) {
          return null;
        }

        const day = startOfDay(parsedDate);
        const revenue = toNumber(record?.monto_pagado);
        const directCosts = toNumber(record?.costo_unitario) + toNumber(record?.comision_monto);

        return {
          treatmentId: record?.treatment_id != null ? String(record.treatment_id) : null,
          paymentMethod: String(record?.metodo_pago ?? 'efectivo').trim().toLowerCase() || 'efectivo',
          date: day,
          dateKey: toDateKey(day),
          monthKey: toMonthKey(day),
          revenue,
          directCosts,
        };
      })
      .filter((record): record is NormalizedRecord => record !== null);

    const dailyRecordMetrics = new Map<string, { revenue: number; directCosts: number }>();
    const paymentMethodTotals: Record<string, number> = {};
    const treatmentStats: Record<string, { count: number; revenue: number }> = {};

    for (const record of normalizedRecords) {
      const current = dailyRecordMetrics.get(record.dateKey) ?? { revenue: 0, directCosts: 0 };
      current.revenue += record.revenue;
      current.directCosts += record.directCosts;
      dailyRecordMetrics.set(record.dateKey, current);

      paymentMethodTotals[record.paymentMethod] = (paymentMethodTotals[record.paymentMethod] ?? 0) + record.revenue;

      if (record.treatmentId && record.revenue > 0) {
        if (!treatmentStats[record.treatmentId]) {
          treatmentStats[record.treatmentId] = { count: 0, revenue: 0 };
        }
        treatmentStats[record.treatmentId].count += 1;
        treatmentStats[record.treatmentId].revenue += record.revenue;
      }
    }

    const variableCostsByDay = new Map<string, number>();
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

    const variableCategoryTotals = safeGastosVariables
      .filter((gasto) => !gasto?.deleted_at)
      .reduce((acc: Record<string, number>, gasto) => {
        const parsedDate = parseDateValue(gasto?.fecha);
        if (parsedDate) {
          const key = toDateKey(startOfDay(parsedDate));
          variableCostsByDay.set(key, (variableCostsByDay.get(key) ?? 0) + toNumber(gasto?.monto));
        }

        const category = String(gasto?.categoria ?? 'otros');
        acc[category] = (acc[category] ?? 0) + toNumber(gasto?.monto);
        return acc;
      }, {});

    const gastosVariablesByCategory = Object.entries(variableCategoryTotals)
      .map(([category, total]) => ({
        name: CATEGORY_LABELS[category] || category,
        value: total,
        color: CATEGORY_COLORS[category] || '#6B7280'
      }))
      .sort((a, b) => b.value - a.value);

    const today = startOfDay(new Date());
    const firstMonthInRange = new Date(today.getFullYear(), today.getMonth() - 23, 1);
    const dayMetricsByKey = new Map<string, { revenue: number; costs: number; profit: number }>();
    const monthMetricsByKey = new Map<string, { revenue: number; costs: number; profit: number }>();

    for (let cursor = new Date(firstMonthInRange); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
      const day = startOfDay(cursor);
      const dayKey = toDateKey(day);
      const monthKey = toMonthKey(day);

      const recordMetrics = dailyRecordMetrics.get(dayKey) ?? { revenue: 0, directCosts: 0 };
      const fixedCosts = calculateDailyFixedCosts(day);
      const variableCosts = variableCostsByDay.get(dayKey) ?? 0;
      const costs = recordMetrics.directCosts + fixedCosts + variableCosts;
      const profit = recordMetrics.revenue - costs;

      dayMetricsByKey.set(dayKey, {
        revenue: recordMetrics.revenue,
        costs,
        profit,
      });

      const monthMetrics = monthMetricsByKey.get(monthKey) ?? { revenue: 0, costs: 0, profit: 0 };
      monthMetrics.revenue += recordMetrics.revenue;
      monthMetrics.costs += costs;
      monthMetrics.profit += profit;
      monthMetricsByKey.set(monthKey, monthMetrics);
    }

    const buildDailySeries = (days: number) => {
      const series: Array<{ date: string; revenue: number; costs: number; profit: number }> = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const key = toDateKey(date);
        const metrics = dayMetricsByKey.get(key) ?? { revenue: 0, costs: 0, profit: 0 };
        series.push({
          date: date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
          revenue: metrics.revenue,
          costs: metrics.costs,
          profit: metrics.profit,
        });
      }
      return series;
    };

    const buildMonthlySeries = (months: number) => {
      const series: Array<{ month: string; revenue: number; costs: number; profit: number }> = [];
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = toMonthKey(monthDate);
        const metrics = monthMetricsByKey.get(key) ?? { revenue: 0, costs: 0, profit: 0 };
        series.push({
          month: monthDate.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }),
          revenue: metrics.revenue,
          costs: metrics.costs,
          profit: metrics.profit,
        });
      }
      return series;
    };

    const buildWeeklySeries = (weeks: number) => {
      const series: Array<{ week: string; revenue: number; costs: number; profit: number }> = [];

      for (let i = weeks - 1; i >= 0; i--) {
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 6);

        let revenue = 0;
        let costs = 0;
        let profit = 0;

        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + dayOffset);
          const key = toDateKey(day);
          const metrics = dayMetricsByKey.get(key);

          if (metrics) {
            revenue += metrics.revenue;
            costs += metrics.costs;
            profit += metrics.profit;
          }
        }

        series.push({
          week: `Sem ${weekStart.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}`,
          revenue,
          costs,
          profit,
        });
      }

      return series;
    };

    const buildYearlySeries = (years: number) => {
      const series: Array<{ year: string; revenue: number; costs: number; profit: number }> = [];

      for (let i = years - 1; i >= 0; i--) {
        const year = today.getFullYear() - i;
        let revenue = 0;
        let costs = 0;
        let profit = 0;

        monthMetricsByKey.forEach((metrics, monthKey) => {
          if (monthKey.startsWith(`${year}-`)) {
            revenue += metrics.revenue;
            costs += metrics.costs;
            profit += metrics.profit;
          }
        });

        series.push({ year: String(year), revenue, costs, profit });
      }

      return series;
    };

    const topTreatments = Object.entries(treatmentStats)
      .map(([id, stats]) => {
        const treatment = safeTreatments.find((item: any) => String(item?.id) === String(id));
        return {
          name: treatment?.nombre || `Tratamiento ID ${id}`,
          count: stats.count,
          revenue: stats.revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const paymentMethods = Object.entries(paymentMethodTotals)
      .map(([name, value], index) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: toNumber(value),
        color: PAYMENT_METHOD_COLORS[name] || COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    const totalRevenue = normalizedRecords.reduce((sum, record) => sum + record.revenue, 0);
    const hasRealData = totalRevenue > 0 && normalizedRecords.length > 0;
    const billingAnalysis = hasRealData
      ? {
          totalRevenue,
          billedRevenue: totalRevenue * 0.3,
          nonBilledRevenue: totalRevenue * 0.7,
          billedPercentage: 30,
          billedPatients: Math.floor(safePatients.length * 0.3),
          nonBilledPatients: Math.floor(safePatients.length * 0.7),
        }
      : {
          totalRevenue: 0,
          billedRevenue: 0,
          nonBilledRevenue: 0,
          billedPercentage: 0,
          billedPatients: 0,
          nonBilledPatients: 0,
        };

    const todayKey = toDateKey(today);
    const todayMetrics = dayMetricsByKey.get(todayKey) ?? { revenue: 0, costs: 0, profit: 0 };

    return {
      daily7Revenue: buildDailySeries(7),
      daily15Revenue: buildDailySeries(15),
      daily30Revenue: buildDailySeries(30),
      daily90Revenue: buildDailySeries(90),
      weeklyRevenue: buildWeeklySeries(12),
      monthly6Revenue: buildMonthlySeries(6),
      monthly12Revenue: buildMonthlySeries(12),
      monthly24Revenue: buildMonthlySeries(24),
      yearlyRevenue: buildYearlySeries(5),
      paymentMethods,
      topTreatments,
      patientActivity: [],
      billingAnalysis,
      todayMetrics,
      fixedMonthlyEstimate,
      gastosVariablesByCategory,
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
      case "daily7":
        return reportData.daily7Revenue;
      case "daily30":
        return reportData.daily30Revenue;
      case "monthly6":
        return reportData.monthly6Revenue;
      case "monthly12":
        return reportData.monthly12Revenue;
      case "monthly24":
        return reportData.monthly24Revenue;
      default:
        return reportData.monthly12Revenue;
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "daily7":
        return "Última semana";
      case "daily30":
        return "Últimos 30 días";
      case "monthly6":
        return "Últimos 6 meses";
      case "monthly12":
        return "Últimos 12 meses";
      case "monthly24":
        return "Últimos 24 meses";
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
    labels: currentData.map((item) => (item as any).date || (item as any).month),
    datasets: [
      {
        type: "bar" as const,
        label: revenueLegendLabels.costs,
        data: currentData.map((item) => toNumber(item.costs)),
        backgroundColor: "rgba(249, 115, 22, 0.32)",
        borderColor: "rgba(251, 146, 60, 0.8)",
        borderWidth: 1,
        borderRadius: 14,
        borderSkipped: false,
        maxBarThickness: 30
      },
      {
        type: "line" as const,
        label: revenueLegendLabels.revenue,
        data: currentData.map((item) => toNumber(item.revenue)),
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.26)",
        tension: 0.38,
        pointRadius: 4.5,
        pointHoverRadius: 6,
        pointBackgroundColor: "#6366f1",
        pointBorderColor: "#ffffff",
        pointHoverBackgroundColor: "#818cf8",
        fill: true,
        borderWidth: 3
      },
      {
        type: "line" as const,
        label: revenueLegendLabels.profit,
        data: currentData.map((item) => toNumber(item.profit)),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        tension: 0.38,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#ecfdf5",
        pointHoverBackgroundColor: "#34d399",
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
          color: "rgba(226, 232, 240, 0.85)",
          font: { size: 12, weight: 500 }
        }
      },
      y: {
        grid: { color: "rgba(226, 232, 240, 0.14)" },
        ticks: {
          color: "rgba(226, 232, 240, 0.8)",
          callback: (value: number | string) => formatCurrencyCompact(Number(value))
        }
      }
    } satisfies ChartOptions<MixedBarLineChartType>['scales'];

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      animation: {
        duration: 1100,
        easing: "easeOutQuart"
      },
      animations: {
        x: {
          duration: 600,
          easing: "easeOutCubic"
        },
        y: {
          duration: 1100,
          easing: "easeOutQuart"
        }
      },
      elements: {
        line: {
          cubicInterpolationMode: "monotone"
        },
        point: {
          hitRadius: 14
        }
      },
      scales,
      plugins: {
        legend: {
          labels: {
            color: "rgba(241, 245, 249, 0.9)",
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
        borderColor: "rgba(248, 250, 252, 0.9)",
        borderWidth: 2,
        borderRadius: 10,
        spacing: 4,
        hoverOffset: 16
      }
    ]
  }), [reportData.paymentMethods]);

  const paymentChartOptions = useMemo<ChartOptions<'doughnut'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    rotation: -95,
    layout: {
      padding: 8
    },
    animation: {
      duration: 1200,
      easing: "easeOutQuart"
    },
    elements: {
      arc: {
        borderColor: "rgba(255, 255, 255, 0.8)",
        borderWidth: 2
      }
    },
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
        ticks: { color: "rgba(226, 232, 240, 0.85)" },
        grid: { color: "rgba(226, 232, 240, 0.12)" }
      },
      y: {
        type: "linear",
        position: "left",
        ticks: {
          color: "rgba(226, 232, 240, 0.85)",
          callback: (value: number | string) => formatCurrencyCompact(Number(value))
        },
        grid: { color: "rgba(226, 232, 240, 0.14)" }
      },
      y1: {
        type: "linear",
        position: "right",
        grid: { drawOnChartArea: false },
        ticks: {
          color: "rgba(191, 219, 254, 0.95)",
          callback: (value: number | string) => `${Number(value).toFixed(0)} casos`
        }
      }
    } satisfies ChartOptions<'line'>['scales'];

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      animation: {
        duration: 1100,
        easing: "easeOutQuart"
      },
      scales,
      plugins: {
        legend: {
          labels: {
            color: "rgba(241, 245, 249, 0.9)",
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderColor: "rgba(99, 102, 241, 0.35)",
          borderWidth: 1,
          titleColor: "#f8fafc",
          bodyColor: "#f8fafc",
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

  const renderChartLoading = (
    message = "Cargando visualización…",
    variant: "line" | "donut" = "line"
  ) => (
    <motion.div
      className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-8 backdrop-blur-xl"
      initial={{ opacity: 0.3 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="relative mb-5 w-full max-w-sm">
        {variant === "line" ? (
          <div className="flex h-24 items-end gap-2">
            {[0.38, 0.52, 0.45, 0.68, 0.54, 0.73, 0.48].map((heightFactor, index) => (
              <motion.div
                key={`loader-bar-${index}`}
                className="flex-1 rounded-t-xl bg-gradient-to-t from-indigo-500/35 via-cyan-400/45 to-indigo-200/55"
                style={{ transformOrigin: "bottom", height: "100%" }}
                initial={{ scaleY: 0.24 }}
                animate={{ scaleY: [0.24, heightFactor, 0.3] }}
                transition={{
                  duration: 1.5,
                  delay: index * 0.06,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mx-auto flex h-28 w-28 items-center justify-center">
            <motion.div
              className="h-28 w-28 rounded-full border-[10px] border-indigo-300/20 border-t-indigo-300/80 border-r-cyan-300/70"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute h-12 w-12 rounded-full border border-white/15 bg-[#020617]/85" />
          </div>
        )}
      </div>
      <p className="text-sm text-white/70">{message}</p>
    </motion.div>
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
      <motion.div
        key={`revenue-chart-${selectedPeriod}-${currentData.length}`}
        className="h-full"
        initial={{ opacity: 0, y: 8, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <ChartJSChart type="bar" data={revenueChartData} options={revenueChartOptions} />
      </motion.div>
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
      <motion.div
        key={`payments-chart-${reportData.paymentMethods.length}-${paymentMethodsTotal}`}
        className="grid h-full gap-6 md:grid-cols-[1.2fr_1fr]"
        initial={{ opacity: 0, y: 8, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="relative h-full">
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-full border border-white/15 bg-[#020617]/85 px-5 py-4 text-center shadow-[0_18px_55px_rgba(2,6,23,0.55)] backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Total cobrado</p>
              <p className="mt-1 text-lg font-semibold text-cyan-100">{formatCurrency(paymentMethodsTotal)}</p>
            </div>
          </div>
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
                className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-r from-white/10 via-white/[0.06] to-white/5 px-4 py-3 shadow-inner shadow-black/30 backdrop-blur"
              >
                <span className="absolute bottom-0 left-0 h-[3px] rounded-r-full" style={{ width: `${Math.max(4, percentage)}%`, backgroundColor: method.color }} />
                <div className="flex items-center gap-3">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: method.color }}
                  />
                  <span className="text-sm font-medium text-white/80">{method.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {formatCurrency(method.value)}
                  </p>
                  <p className="text-xs font-medium text-white/70">{percentage.toFixed(1)}%</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
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
      <motion.div
        key={`billing-trend-${billingStats.monthlyTrend.length}`}
        className="h-full"
        initial={{ opacity: 0, y: 8, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <Line data={billingTrendChartData} options={billingTrendChartOptions} />
      </motion.div>
    );
  };


  return (
    <AppLayout>
      <div className="min-h-screen bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero Header */}
        <GlassPanel className="relative overflow-hidden p-8 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-indigo-400/30 blur-[140px]" />
            <div className="absolute -bottom-40 left-0 h-72 w-72 rounded-full bg-purple-400/30 blur-[160px]" />
          </div>
          
          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Analytics</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Reportes Financieros</h1>
                  <p className="mt-1 text-white/80">Análisis detallado del rendimiento financiero</p>
                </div>
              </div>
              
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="min-w-[220px] border-white/20 bg-white/10 text-white shadow-[0_20px_55px_rgba(2,6,23,0.45)]">
                  <SelectValue placeholder="Selecciona período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily7">Última semana</SelectItem>
                  <SelectItem value="daily30">Últimos 30 días</SelectItem>
                  <SelectItem value="monthly6">Últimos 6 meses</SelectItem>
                  <SelectItem value="monthly12">Últimos 12 meses</SelectItem>
                  <SelectItem value="monthly24">Últimos 24 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassPanel>

        {/* Error State */}
        {error && (
          <GlassPanel className="border border-rose-400/30 bg-rose-500/10 p-6 text-rose-50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rose-300/40 bg-rose-500/20">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Error al cargar reportes</h3>
                  <p className="text-sm text-rose-100/80">{error}</p>
                </div>
              </div>
              <button
                onClick={loadReportData}
                className="aura-cta aura-cta--ghost"
              >
                Reintentar carga
              </button>
            </div>
          </GlassPanel>
        )}

        {/* Loading State */}
        {loading && (
          <GlassPanel className="border-white/10 p-12 text-center text-white">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-300"></div>
            <h3 className="text-lg font-semibold">Cargando reportes...</h3>
            <p className="text-sm text-white/70">Procesando datos financieros</p>
          </GlassPanel>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* KPI Cards */}
            <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <GlassPanel className="border-white/10 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-white/50">Ingresos hoy</p>
                    <p className="text-3xl font-semibold">{formatCurrency(reportData.todayMetrics.revenue)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-sky-500/40 to-indigo-500/40 p-3">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel className="border-white/10 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-white/50">Ingresos totales</p>
                    <p className="text-3xl font-semibold text-emerald-200">{formatCurrency(totalRevenueSelected)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-emerald-500/40 to-teal-500/40 p-3">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel className="border-white/10 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-white/50">Ganancia neta</p>
                    <p className="text-3xl font-semibold text-fuchsia-200">{formatCurrency(totalProfitSelected)}</p>
                    <p className="mt-1 text-xs text-white/55">Incluye costos fijos recurrentes + variables</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-fuchsia-500/40 to-purple-500/40 p-3">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel className="border-white/10 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-white/50">Facturación</p>
                    <p className="text-3xl font-semibold text-orange-200">{reportData.billingAnalysis.billedPercentage.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-orange-500/40 to-rose-500/40 p-3">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
              </GlassPanel>
            </div>

            {/* Visualizaciones principales */}
            <div className="mb-8 grid gap-6 md:grid-cols-2">
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
              >
                <GlassPanel className="relative overflow-hidden border-white/10 p-6 text-white">
                  <div className="absolute inset-x-0 -top-16 h-32 bg-gradient-to-br from-indigo-500/30 via-transparent to-transparent blur-3xl" />
                  <div className="relative mb-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">Rendimiento consolidado</p>
                      <h3 className="text-2xl font-semibold">Ingresos — {getPeriodLabel()}</h3>
                      <p className="text-sm text-white/70">Comparativa de ingresos, costos y utilidad neta</p>
                      <p className="mt-2 text-xs text-white/55">
                        Costos consideran fijos recurrentes (~{formatCurrency(reportData.fixedMonthlyEstimate ?? 0)} / mes) + variables.
                      </p>
                    </div>
                    {hasRevenueData && (
                      <div className="grid gap-2 text-right text-xs font-medium text-white/70">
                        <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">
                          <span className="block text-xs font-semibold uppercase tracking-widest text-indigo-100">Ingresos</span>
                          <span className="text-sm font-bold text-indigo-200">{formatCurrencyCompact(totalRevenueSelected)}</span>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">
                          <span className="block text-xs font-semibold uppercase tracking-widest text-rose-100">Costos</span>
                          <span className="text-sm font-bold text-rose-100">{formatCurrencyCompact(totalCostsSelected)}</span>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">
                          <span className="block text-xs font-semibold uppercase tracking-widest text-emerald-100">Utilidad</span>
                          <span className="text-sm font-bold text-emerald-100">{formatCurrencyCompact(totalProfitSelected)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative h-72">
                    {isClient ? renderRevenueChart() : renderChartLoading("Preparando serie de ingresos…", "line")}
                  </div>
                </GlassPanel>
              </motion.div>

              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.12 }}
              >
                <GlassPanel className="relative overflow-hidden border-white/10 p-6 text-white">
                  <div className="absolute inset-x-0 -top-16 h-32 bg-gradient-to-br from-purple-500/30 via-transparent to-transparent blur-3xl" />
                  <div className="relative mb-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Mix de pagos</p>
                    <h3 className="text-2xl font-semibold">Métodos de pago</h3>
                    <p className="text-sm text-white/70">Distribución y pesos relativos por canal de cobro</p>
                  </div>
                  <div className="relative h-72">
                    {isClient ? renderPaymentMethodsChart() : renderChartLoading("Construyendo mix de pagos…", "donut")}
                  </div>
                </GlassPanel>
              </motion.div>
            </div>

            {/* Variable Expenses by Category */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.18 }}
            >
              <GlassPanel className="border-white/10 p-6 text-white">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-gradient-to-br from-orange-500/40 to-amber-400/40 text-white">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold">Gastos variables por categoría</h3>
                      <p className="text-sm text-white/70">Visualiza dónde se concentran los gastos extraordinarios</p>
                    </div>
                  </div>
                  {hasVariableExpensesData && (
                    <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
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
                          className="rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              <span
                                className="h-3.5 w-3.5 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="font-medium text-white">{category.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-white">{formatCurrency(category.value)}</p>
                              <p className="text-xs text-white/60">{clampedPercentage.toFixed(1)}%</p>
                            </div>
                          </div>
                          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
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
              </GlassPanel>
            </motion.div>

            {/* Top Treatments */}
            <GlassPanel className="border-white/10 p-6 text-white">
              <h3 className="mb-4 text-xl font-semibold">Tratamientos más rentables</h3>
              <div className="space-y-4">
                {reportData.topTreatments.length > 0 ? (
                  reportData.topTreatments.map((treatment, index) => (
                    <div key={index} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-blue-500/40 to-purple-500/40 text-white font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{treatment.name}</p>
                          <p className="text-sm text-white/60">
                            {treatment.count} {treatment.count === 1 ? 'aplicación' : 'aplicaciones'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-emerald-200">{formatCurrency(treatment.revenue)}</p>
                        <p className="text-xs text-white/60">
                          {formatCurrency(treatment.revenue / treatment.count)} promedio
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/20 px-6 py-12 text-center text-white/70">
                    <Stethoscope className="mx-auto mb-4 h-10 w-10 text-white/60" />
                    No hay datos de tratamientos
                  </div>
                )}
              </div>
            </GlassPanel>
          </>
        )}

        {/* Facturación Electrónica (CFDI) Section */}
        {!loading && !error && billingStats && (
          <div className="mt-12 space-y-8">
            <GlassPanel className="relative overflow-hidden border-white/10 p-6 text-white">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-purple-600/30 to-indigo-600/20" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Facturación electrónica (CFDI 4.0)</h2>
                  <p className="text-sm text-white/70">Análisis de facturas emitidas con validez fiscal ante el SAT</p>
                </div>
              </div>
            </GlassPanel>

            {/* Billing KPIs */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <GlassPanel className="border-white/10 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-white/50">Total facturado</p>
                    <p className="text-3xl font-semibold text-purple-200">{formatCurrency(billingStats.summary.totalAmount)}</p>
                    <p className="text-xs text-white/60">
                      {billingStats.summary.totalCount} {billingStats.summary.totalCount === 1 ? 'factura' : 'facturas'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-purple-500/40 to-pink-500/40 p-3">
                    <Receipt className="w-6 h-6" />
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel className="border-white/10 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-white/50">Este mes</p>
                    <p className="text-3xl font-semibold text-sky-200">{formatCurrency(billingStats.summary.currentMonthTotal)}</p>
                    <p className="text-xs text-white/60">{billingStats.summary.currentMonthCount} facturas</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-sky-500/40 to-cyan-500/40 p-3">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel className="border-white/10 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-white/50">Promedio</p>
                    <p className="text-3xl font-semibold text-emerald-200">{formatCurrency(billingStats.summary.averageAmount)}</p>
                    <p className="text-xs text-white/60">por factura</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-emerald-500/40 to-teal-500/40 p-3">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel className="border-white/10 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-white/50">Enviadas</p>
                    <p className="text-3xl font-semibold text-indigo-200">{billingStats.statusBreakdown.sent}</p>
                    <p className="text-xs text-white/60">de {billingStats.summary.totalCount} total</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-indigo-500/40 to-purple-500/40 p-3">
                    <Mail className="w-6 h-6" />
                  </div>
                </div>
              </GlassPanel>
            </div>

            {/* Billing Trend Chart */}
            <GlassPanel className="border-white/10 p-6 text-white">
              <h3 className="text-xl font-semibold">Tendencia de facturación (últimos 6 meses)</h3>
              <div className="mt-4 h-80">
                {isClient ? renderBillingTrendChart() : renderChartLoading("Cargando tendencia de facturación…", "line")}
              </div>
            </GlassPanel>

            {/* Top Patients by Billing */}
            <GlassPanel className="border-white/10 p-6 text-white">
              <h3 className="mb-4 text-xl font-semibold">Top 10 pacientes por facturación</h3>
              <div className="space-y-4">
                {billingStats.topPatients.map((patient, index) => (
                  <div key={patient.patient_id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-purple-500/40 to-indigo-500/40 text-white font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-white/60">
                          {patient.count} {patient.count === 1 ? 'factura' : 'facturas'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-purple-200">{formatCurrency(patient.total)}</p>
                      <p className="text-xs text-white/60">
                        {formatCurrency(patient.total / patient.count)} promedio
                      </p>
                    </div>
                  </div>
                ))}
                {billingStats.topPatients.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/20 px-6 py-12 text-center text-white/70">
                    <FileText className="mx-auto mb-4 h-10 w-10 text-white/60" />
                    No hay facturas emitidas
                  </div>
                )}
              </div>
            </GlassPanel>
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
}