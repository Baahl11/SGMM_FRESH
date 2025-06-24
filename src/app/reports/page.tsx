"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";
import { 
  TrendingUp, DollarSign, Calendar, BarChart3, PieChart as PieChartIcon, 
  TrendingDown, Users, Stethoscope, CreditCard, Banknote, ArrowUpRight, Receipt, AlertCircle, Activity
} from "lucide-react";
import ApiService from "@/lib/api-service";

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
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportsPage() {  const [reportData, setReportData] = useState<ReportData>({
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
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("monthly12");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  useEffect(() => {
    loadReportData();
  }, []);  const loadReportData = async () => {
    try {
      setLoading(true);
      
      const [patientsResponse, treatmentsResponse, recordsResponse, gastosFijosResponse] = await Promise.all([
        ApiService.getPatients(),
        ApiService.getTreatments(),
        ApiService.getRecords(),
        ApiService.getGastosFijos()
      ]);      if (patientsResponse.error || treatmentsResponse.error || recordsResponse.error || gastosFijosResponse.error) {
        const errorDetails = {
          patientsError: patientsResponse.error,
          treatmentsError: treatmentsResponse.error,
          recordsError: recordsResponse.error,
          gastosFijosError: gastosFijosResponse.error
        };
        
        console.error("Error loading report data:", errorDetails);
        setError(`Error cargando datos: ${JSON.stringify(errorDetails, null, 2)}`);
        return;
      }

      const patients = patientsResponse.data || [];
      const treatments = treatmentsResponse.data || [];
      const records = recordsResponse.data || [];
      const gastosFijos = gastosFijosResponse.data || [];

      // Procesar datos para reportes
      const processedData = processReportData(patients, treatments, records, gastosFijos);
      setReportData(processedData);    } catch (error) {
      console.error("Error loading report data:", error);
      setError(`Error inesperado: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };const processReportData = (patients: any[], treatments: any[], records: any[], gastosFijos: any[]): ReportData => {
    // Función para calcular gastos fijos diarios
    const calculateDailyFixedCosts = (date: Date): number => {
      return gastosFijos
        .filter(gasto => gasto.activo && new Date(gasto.fecha_inicio) <= date)
        .reduce((total, gasto) => {
          switch (gasto.frecuencia) {
            case 'mensual':
              return total + (gasto.monto / 30); // Aproximación diaria
            case 'trimestral':
              return total + (gasto.monto / 90); // Aproximación diaria
            case 'anual':
              return total + (gasto.monto / 365); // Aproximación diaria
            default:
              return total + (gasto.monto / 30); // Default mensual
          }
        }, 0);
    };

    // Función helper para crear datos diarios
    const createDailyData = (days: number) => {
      const dailyData: { [key: string]: { revenue: number; profit: number; costs: number; fixedCosts: number } } = {};
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dailyFixedCosts = calculateDailyFixedCosts(date);
        dailyData[dateStr] = { revenue: 0, profit: 0, costs: 0, fixedCosts: dailyFixedCosts };
      }

      // Procesar registros por día
      records.forEach(record => {
        const recordDate = new Date(record.fecha).toISOString().split('T')[0];
        if (dailyData[recordDate]) {
          const revenue = record.monto_pagado || 0;
          const cost = record.costo_unitario || 0;
          const commission = record.comision_monto || 0;
          const variableCosts = cost + commission;
          const totalCosts = variableCosts + dailyData[recordDate].fixedCosts;
          const profit = revenue - totalCosts;

          dailyData[recordDate].revenue += revenue;
          dailyData[recordDate].costs += variableCosts; // Solo costos variables
          dailyData[recordDate].profit = (dailyData[recordDate].revenue) - (dailyData[recordDate].costs + dailyData[recordDate].fixedCosts);
        }
      });

      return Object.entries(dailyData).map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('es-MX', { 
          month: 'short', 
          day: 'numeric',
          ...(days > 15 ? {} : { weekday: 'short' })
        }),
        revenue: data.revenue,
        costs: data.costs + data.fixedCosts, // Incluir gastos fijos en costos totales
        profit: data.profit
      }));
    };    // Generar datos para diferentes períodos diarios
    const daily7Revenue = createDailyData(7);
    const daily15Revenue = createDailyData(15);
    const daily30Revenue = createDailyData(30);
    const daily90Revenue = createDailyData(90);// Calcular ingresos de hoy con gastos fijos
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(record => 
      new Date(record.fecha).toISOString().split('T')[0] === today
    );
    
    const todayRevenue = todayRecords.reduce((sum, record) => sum + (record.monto_pagado || 0), 0);
    const todayVariableCosts = todayRecords.reduce((sum, record) => 
      sum + (record.costo_unitario || 0) + (record.comision_monto || 0), 0
    );
    const todayFixedCosts = calculateDailyFixedCosts(new Date());
    const todayCosts = todayVariableCosts + todayFixedCosts;
    const todayProfit = todayRevenue - todayCosts;

    // Función para calcular gastos fijos mensuales
    const calculateMonthlyFixedCosts = (year: number, month: number): number => {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      
      return gastosFijos
        .filter(gasto => {
          if (!gasto.activo) return false;
          const startDate = new Date(gasto.fecha_inicio);
          return startDate <= monthEnd;
        })
        .reduce((total, gasto) => {
          const startDate = new Date(gasto.fecha_inicio);
          // Solo contar si el gasto empezó antes o durante este mes
          if (startDate <= monthEnd) {
            switch (gasto.frecuencia) {
              case 'mensual':
                return total + gasto.monto;
              case 'trimestral':
                // Si es el mes correcto del trimestre
                const monthsSinceStart = (year - startDate.getFullYear()) * 12 + (month - 1) - startDate.getMonth();
                return monthsSinceStart % 3 === 0 ? total + gasto.monto : total;
              case 'anual':
                // Si es el mes correcto del año
                return (month - 1) === startDate.getMonth() ? total + gasto.monto : total;
              default:
                return total + gasto.monto; // Default mensual
            }
          }
          return total;
        }, 0);
    };    // Función para generar datos mensuales con rango variable
    const createMonthlyData = (months: number) => {
      const monthlyData: { [key: string]: { revenue: number; profit: number; costs: number; fixedCosts: number } } = {};
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthlyFixedCosts = calculateMonthlyFixedCosts(date.getFullYear(), date.getMonth() + 1);
        monthlyData[monthKey] = { revenue: 0, profit: 0, costs: 0, fixedCosts: monthlyFixedCosts };
      }

      records.forEach(record => {
        const recordDate = new Date(record.fecha);
        const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[monthKey]) {
          const revenue = record.monto_pagado || 0;
          const cost = record.costo_unitario || 0;
          const commission = record.comision_monto || 0;
          const variableCosts = cost + commission;

          monthlyData[monthKey].revenue += revenue;
          monthlyData[monthKey].costs += variableCosts;
        }
      });

      // Calcular ganancia mensual incluyendo gastos fijos
      Object.keys(monthlyData).forEach(monthKey => {
        const data = monthlyData[monthKey];
        data.profit = data.revenue - (data.costs + data.fixedCosts);
        data.costs += data.fixedCosts; // Incluir gastos fijos en costos totales
      });

      return Object.entries(monthlyData).map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('es-MX', { 
          month: 'short', 
          year: months > 12 ? 'numeric' : 'numeric' 
        }),
        revenue: data.revenue,
        costs: data.costs,
        profit: data.profit
      }));
    };

    // Datos mensuales (6, 12, y 24 meses)
    const monthly6Revenue = createMonthlyData(6);
    const monthly12Revenue = createMonthlyData(12);
    const monthly24Revenue = createMonthlyData(24);

    // Datos mensuales (últimos 6 meses) - mantenemos para compatibilidad
    const monthlyData: { [key: string]: { revenue: number; profit: number; costs: number; fixedCosts: number } } = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthlyFixedCosts = calculateMonthlyFixedCosts(date.getFullYear(), date.getMonth() + 1);
      monthlyData[monthKey] = { revenue: 0, profit: 0, costs: 0, fixedCosts: monthlyFixedCosts };
    }

    records.forEach(record => {
      const recordDate = new Date(record.fecha);
      const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[monthKey]) {
        const revenue = record.monto_pagado || 0;
        const cost = record.costo_unitario || 0;
        const commission = record.comision_monto || 0;
        const variableCosts = cost + commission;

        monthlyData[monthKey].revenue += revenue;
        monthlyData[monthKey].costs += variableCosts;
      }
    });

    // Calcular ganancia mensual incluyendo gastos fijos
    Object.keys(monthlyData).forEach(monthKey => {
      const data = monthlyData[monthKey];
      data.profit = data.revenue - (data.costs + data.fixedCosts);
      data.costs += data.fixedCosts; // Incluir gastos fijos en costos totales
    });

    const monthlyRevenue = Object.entries(monthlyData).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }),
      revenue: data.revenue,
      costs: data.costs,
      profit: data.profit
    }));

    // Métodos de pago
    const paymentMethodCounts: { [key: string]: number } = {};
    records.forEach(record => {
      const method = record.metodo_pago || 'efectivo';
      paymentMethodCounts[method] = (paymentMethodCounts[method] || 0) + (record.monto_pagado || 0);
    });

    const paymentMethods = Object.entries(paymentMethodCounts).map(([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[index % COLORS.length]
    }));    // Tratamientos más populares
    const treatmentStats: { [key: number]: { count: number; revenue: number } } = {};
    records.forEach(record => {
      const treatmentId = record.treatment_id;
      if (treatmentId && record.monto_pagado > 0) { // Solo registros con pago
        if (!treatmentStats[treatmentId]) {
          treatmentStats[treatmentId] = { count: 0, revenue: 0 };
        }
        treatmentStats[treatmentId].count += 1;
        treatmentStats[treatmentId].revenue += record.monto_pagado || 0;
      }
    });    const topTreatments = Object.entries(treatmentStats)
      .map(([id, stats]) => {
        const treatment = treatments.find(t => t.id === parseInt(id));
        return {
          name: treatment?.nombre || `Tratamiento ID ${id}`,
          count: stats.count,
          revenue: stats.revenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);// Actividad de pacientes (últimos 30 días)
    const patientActivity = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
        const newPatients = patients.filter(p => {
        if (!p.created_at) return false;
        try {
          return new Date(p.created_at).toISOString().split('T')[0] === dateStr;
        } catch {
          return false;
        }
      }).length;
      
      const totalPatients = patients.filter(p => {
        if (!p.created_at) return false;
        try {
          return new Date(p.created_at) <= date;
        } catch {
          return false;
        }
      }).length;

      if (i % 5 === 0) { // Solo mostrar cada 5 días para no saturar el gráfico
        patientActivity.push({
          date: date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
          newPatients,
          totalPatients
        });
      }
    }// Análisis de facturación
    let billedRevenue = 0;
    let nonBilledRevenue = 0;
    let billedPatients = 0;
    let nonBilledPatients = 0;

    // Agrupar registros por paciente para analizar facturación
    const patientRecords: { [key: number]: { patient: any; records: any[]; totalRevenue: number } } = {};
    
    records.forEach(record => {
      const patientId = record.patient_id;
      if (!patientRecords[patientId]) {
        const patient = patients.find(p => p.id === patientId);
        patientRecords[patientId] = {
          patient,
          records: [],
          totalRevenue: 0
        };
      }
      patientRecords[patientId].records.push(record);
      patientRecords[patientId].totalRevenue += record.monto_pagado || 0;
    });

    // Calcular estadísticas de facturación
    Object.values(patientRecords).forEach(({ patient, totalRevenue }) => {
      if (patient?.requiere_factura) {
        billedRevenue += totalRevenue;
        billedPatients++;
      } else {
        nonBilledRevenue += totalRevenue;
        nonBilledPatients++;
      }
    });

    const totalRevenue = billedRevenue + nonBilledRevenue;
    const billedPercentage = totalRevenue > 0 ? (billedRevenue / totalRevenue) * 100 : 0;

    const billingAnalysis = {
      totalRevenue,
      billedRevenue,
      nonBilledRevenue,
      billedPercentage,
      billedPatients,
      nonBilledPatients,
    };    // Función para calcular gastos fijos anuales
    const calculateYearlyFixedCosts = (year: number): number => {
      return gastosFijos
        .filter(gasto => {
          if (!gasto.activo) return false;
          const startDate = new Date(gasto.fecha_inicio);
          return startDate.getFullYear() <= year;
        })
        .reduce((total, gasto) => {
          const startDate = new Date(gasto.fecha_inicio);
          if (startDate.getFullYear() <= year) {
            switch (gasto.frecuencia) {
              case 'mensual':
                // Calcular cuántos meses del año están cubiertos
                const monthsInYear = startDate.getFullYear() === year 
                  ? 12 - startDate.getMonth() 
                  : 12;
                return total + (gasto.monto * monthsInYear);
              case 'trimestral':
                // Calcular cuántos trimestres del año están cubiertos
                const quartersInYear = startDate.getFullYear() === year 
                  ? Math.floor((12 - startDate.getMonth()) / 3) + 1
                  : 4;
                return total + (gasto.monto * quartersInYear);
              case 'anual':
                return total + gasto.monto;
              default:
                return total + (gasto.monto * 12); // Default mensual
            }
          }
          return total;
        }, 0);
    };

    // Datos anuales (últimos 3 años)
    const yearlyData: { [key: number]: { revenue: number; profit: number; costs: number; fixedCosts: number } } = {};
    const currentYear = new Date().getFullYear();
    
    for (let i = 2; i >= 0; i--) {
      const year = currentYear - i;
      const yearlyFixedCosts = calculateYearlyFixedCosts(year);
      yearlyData[year] = { revenue: 0, profit: 0, costs: 0, fixedCosts: yearlyFixedCosts };
    }

    records.forEach(record => {
      const recordYear = new Date(record.fecha).getFullYear();
      if (yearlyData[recordYear]) {
        const revenue = record.monto_pagado || 0;
        const cost = record.costo_unitario || 0;
        const commission = record.comision_monto || 0;
        const variableCosts = cost + commission;

        yearlyData[recordYear].revenue += revenue;
        yearlyData[recordYear].costs += variableCosts;
      }
    });

    // Calcular ganancia anual incluyendo gastos fijos
    Object.keys(yearlyData).forEach(yearKey => {
      const year = parseInt(yearKey);
      const data = yearlyData[year];
      data.profit = data.revenue - (data.costs + data.fixedCosts);
      data.costs += data.fixedCosts; // Incluir gastos fijos en costos totales
    });

    const yearlyRevenue = Object.entries(yearlyData).map(([year, data]) => ({
      year: year,
      revenue: data.revenue,
      costs: data.costs,
      profit: data.profit
    }));    return {
      daily7Revenue,
      daily15Revenue,
      daily30Revenue,
      daily90Revenue,
      weeklyRevenue: [], // Por ahora vacío
      monthly6Revenue,
      monthly12Revenue,
      monthly24Revenue,
      yearlyRevenue,
      paymentMethods,
      topTreatments,
      patientActivity,
      billingAnalysis
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'revenue' && 'Ingresos: '}
              {entry.dataKey === 'profit' && 'Ganancia: '}
              {entry.dataKey === 'costs' && 'Costos: '}
              {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Generando reportes...</p>
        </div>
      </div>
    );
  }  const getCurrentData = () => {
    switch (selectedPeriod) {
      case "daily7":
        return reportData.daily7Revenue;
      case "daily15":
        return reportData.daily15Revenue;
      case "daily30":
        return reportData.daily30Revenue;
      case "daily90":
        return reportData.daily90Revenue;
      case "monthly6":
        return reportData.monthly6Revenue;
      case "monthly12":
        return reportData.monthly12Revenue;
      case "monthly24":
        return reportData.monthly24Revenue;
      default:
        return reportData.daily7Revenue;
    }
  };
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "daily7":
        return "Últimos 7 días";
      case "daily15":
        return "Últimos 15 días";
      case "daily30":
        return "Últimos 30 días";
      case "daily90":
        return "Últimos 90 días";
      case "monthly6":
        return "Últimos 6 meses";
      case "monthly12":
        return "Últimos 12 meses";
      case "monthly24":
        return "Últimos 24 meses";
      default:
        return "Período seleccionado";
    }
  };return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Reportes Financieros
            </h1>
            <p className="text-gray-600">
              Análisis detallado del rendimiento financiero del consultorio
            </p>
          </div>
        </div>        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-52 bg-white border-gray-200">
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily7">Últimos 7 días</SelectItem>
            <SelectItem value="daily15">Últimos 15 días</SelectItem>
            <SelectItem value="daily30">Últimos 30 días</SelectItem>
            <SelectItem value="daily90">Últimos 90 días</SelectItem>
            <SelectItem value="monthly6">Últimos 6 meses</SelectItem>
            <SelectItem value="monthly12">Últimos 12 meses</SelectItem>
            <SelectItem value="monthly24">Últimos 24 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Error al cargar reportes</h3>
                <p className="text-red-700 text-sm mt-1">
                  No se pudieron cargar los datos de reportes. Verifica tu conexión e intenta nuevamente.
                </p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-red-600 text-sm">Ver detalles del error</summary>
                  <pre className="text-xs bg-red-100 p-2 rounded mt-2 overflow-auto max-h-32">
                    {error}
                  </pre>
                </details>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadReportData}
                  className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="font-semibold text-gray-900 mb-2">Cargando reportes...</h3>
            <p className="text-gray-600 text-sm">
              Procesando datos financieros y calculando métricas
            </p>
          </CardContent>
        </Card>
      )}

      {/* Content - Only show if not loading and no error */}
      {!loading && !error && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(
                (() => {
                  const today = new Date().toISOString().split('T')[0];
                  const todayData = reportData.daily7Revenue.find(item => 
                    new Date().toLocaleDateString('es-MX', { month: 'short', day: 'numeric', weekday: 'short' }) === item.date ||
                    new Date().toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }) === item.date
                  );
                  return todayData?.revenue || 0;
                })()
              )}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-blue-500" />
              Ingresos de hoy
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(getCurrentData().reduce((sum, item) => sum + item.revenue, 0))}
            </div>            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              {getPeriodLabel()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(getCurrentData().reduce((sum, item) => sum + item.profit, 0))}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              Después de costos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costos Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(getCurrentData().reduce((sum, item) => sum + item.costs, 0))}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-orange-500" />
              Incluye comisiones
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen de Ganancia</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getCurrentData().reduce((sum, item) => sum + item.revenue, 0) > 0 
                ? ((getCurrentData().reduce((sum, item) => sum + item.profit, 0) / 
                   getCurrentData().reduce((sum, item) => sum + item.revenue, 0)) * 100).toFixed(1)
                : 0}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-blue-500" />
              Rentabilidad
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturación</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {reportData.billingAnalysis.billedPercentage.toFixed(1)}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-purple-500" />
              {formatCurrency(reportData.billingAnalysis.billedRevenue)} facturado
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-6">        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="billing">Facturación</TabsTrigger>
          <TabsTrigger value="payments">Métodos de Pago</TabsTrigger>
          <TabsTrigger value="treatments">Tratamientos</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
        </TabsList><TabsContent value="revenue">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análisis de Ingresos y Ganancias - {getPeriodLabel()}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={chartType === "bar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("bar")}
                  >
                    Barras
                  </Button>
                  <Button
                    variant={chartType === "line" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("line")}
                  >
                    Líneas
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>              <ResponsiveContainer width="100%" height={400}>
                {chartType === "bar" ? (
                  <BarChart data={getCurrentData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey={selectedPeriod.startsWith("daily") ? "date" : "month"}
                      angle={selectedPeriod === "daily30" ? -45 : 0}
                      textAnchor={selectedPeriod === "daily30" ? "end" : "middle"}
                      height={selectedPeriod === "daily30" ? 60 : 40}
                    />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#0088FE" name="Ingresos" />
                    <Bar dataKey="costs" fill="#FF8042" name="Costos" />
                    <Bar dataKey="profit" fill="#00C49F" name="Ganancia" />
                  </BarChart>
                ) : (
                  <LineChart data={getCurrentData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey={selectedPeriod.startsWith("daily") ? "date" : "month"}
                      angle={selectedPeriod === "daily30" ? -45 : 0}
                      textAnchor={selectedPeriod === "daily30" ? "end" : "middle"}
                      height={selectedPeriod === "daily30" ? 60 : 40}
                    />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#0088FE" 
                      strokeWidth={3}
                      name="Ingresos"
                      dot={{ fill: "#0088FE", strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="costs" 
                      stroke="#FF8042" 
                      strokeWidth={2}
                      name="Costos"
                      dot={{ fill: "#FF8042", strokeWidth: 2, r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#00C49F" 
                      strokeWidth={3}
                      name="Ganancia"
                      dot={{ fill: "#00C49F", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Distribución por Método de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.paymentMethods}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalle de Métodos de Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportData.paymentMethods.map((method, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {method.name === 'Efectivo' && <Banknote className="h-4 w-4" />}
                      {method.name === 'Tarjeta' && <CreditCard className="h-4 w-4" />}
                      {method.name === 'Transferencia' && <ArrowUpRight className="h-4 w-4" />}
                      <span className="font-medium">{method.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(method.value)}</p>
                      <p className="text-xs text-muted-foreground">
                        {((method.value / reportData.paymentMethods.reduce((sum, m) => sum + m.value, 0)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="treatments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Tratamientos Más Rentables
              </CardTitle>
            </CardHeader>            <CardContent>
              <div className="space-y-4">
                {reportData.topTreatments.length > 0 ? (
                  reportData.topTreatments.map((treatment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{treatment.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {treatment.count} {treatment.count === 1 ? 'aplicación' : 'aplicaciones'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(treatment.revenue)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(treatment.revenue / treatment.count)} promedio
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay datos de tratamientos disponibles</p>
                    <p className="text-sm text-gray-400">Los tratamientos aparecerán aquí una vez que registres pagos</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Actividad de Pacientes
              </CardTitle>
            </CardHeader>            <CardContent>
              {reportData.patientActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={reportData.patientActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="totalPatients" 
                      stackId="1" 
                      stroke="#0088FE" 
                      fill="#0088FE" 
                      name="Total Pacientes"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="newPatients" 
                      stackId="2" 
                      stroke="#00C49F" 
                      fill="#00C49F" 
                      name="Nuevos Pacientes"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay datos de actividad de pacientes</p>
                  <p className="text-sm text-gray-400">La actividad aparecerá aquí una vez que registres pacientes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Análisis de Facturación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { 
                          name: "Facturado", 
                          value: reportData.billingAnalysis.billedRevenue, 
                          color: "#00C49F" 
                        },
                        { 
                          name: "Sin Facturar", 
                          value: reportData.billingAnalysis.nonBilledRevenue, 
                          color: "#FF8042" 
                        }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#00C49F" />
                      <Cell fill="#FF8042" />
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Facturación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center gap-3">
                      <Receipt className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Ingresos Facturados</p>
                        <p className="text-sm text-green-600">
                          {reportData.billingAnalysis.billedPatients} pacientes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-lg">
                        {formatCurrency(reportData.billingAnalysis.billedRevenue)}
                      </p>
                      <p className="text-sm text-green-600">
                        {reportData.billingAnalysis.billedPercentage.toFixed(1)}% del total
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-800">Ingresos Sin Facturar</p>
                        <p className="text-sm text-orange-600">
                          {reportData.billingAnalysis.nonBilledPatients} pacientes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600 text-lg">
                        {formatCurrency(reportData.billingAnalysis.nonBilledRevenue)}
                      </p>
                      <p className="text-sm text-orange-600">
                        {(100 - reportData.billingAnalysis.billedPercentage).toFixed(1)}% del total
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800">Total de Ingresos</p>
                        <p className="text-sm text-blue-600">
                          {reportData.billingAnalysis.billedPatients + reportData.billingAnalysis.nonBilledPatients} pacientes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600 text-lg">
                        {formatCurrency(reportData.billingAnalysis.totalRevenue)}
                      </p>
                      <p className="text-sm text-blue-600">
                        100% del total
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recomendaciones */}
                {reportData.billingAnalysis.billedPercentage < 50 && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">💡 Recomendación</h4>
                    <p className="text-sm text-yellow-700">
                      Menos del 50% de tus ingresos están siendo facturados. 
                      Considera promover la facturación para cumplir mejor con obligaciones fiscales 
                      y tener un mejor control contable.
                    </p>
                  </div>
                )}
                
                {reportData.billingAnalysis.billedPercentage >= 80 && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">✅ Excelente</h4>
                    <p className="text-sm text-green-700">
                      Tienes un excelente nivel de facturación. Esto te ayuda a mantener 
                      un control fiscal adecuado y mayor transparencia en tus ingresos.
                    </p>
                  </div>
                )}              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}
