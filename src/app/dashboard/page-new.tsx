"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Stethoscope, FileText, TrendingUp, Calendar, DollarSign, CreditCard, Banknote, ArrowUpRight, Clock, AlertTriangle, TrendingDown } from "lucide-react";
import ApiService from "@/lib/api-service";
import AuthService from "@/lib/auth-service";
import WeeklyCalendar from "@/components/calendar/weekly-calendar";

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
  monthlyNetProfit: number;
  monthlyMarginPercentage: number;
  upcomingPayments: number;
  upcomingAppointments: number;
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
}

export default function DashboardPage() {
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
    monthlyNetProfit: 0,
    monthlyMarginPercentage: 0,
    upcomingPayments: 0,
    upcomingAppointments: 0,
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
    fixedCostsBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check authentication first
      if (!AuthService.isAuthenticated()) {
        console.error("User not authenticated, redirecting to login");
        AuthService.logout();
        return;
      }
      
      // Cargar datos en paralelo - intentar usar el nuevo endpoint de estadísticas
      const [patientsResponse, treatmentsResponse, recordsResponse, dashboardStatsResponse] = await Promise.all([
        ApiService.getPatients(),
        ApiService.getTreatments(),
        ApiService.getRecordsWithNames(),
        ApiService.getDashboardStats()
      ]);

      if (patientsResponse.error || treatmentsResponse.error || recordsResponse.error) {
        console.error("Error loading basic dashboard data");
        setError("Algunos datos no se pudieron cargar. Mostrando información disponible.");
      }

      const patients = patientsResponse.data || [];
      const treatments = treatmentsResponse.data || [];
      const records = recordsResponse.data || [];
      const dashboardStats = dashboardStatsResponse.data || null;

      // Si tenemos estadísticas del endpoint especializado, usarlas
      let financialStats;
      if (dashboardStats && !dashboardStatsResponse.error) {
        financialStats = {
          totalRevenue: dashboardStats.total_revenue || 0,
          totalCosts: dashboardStats.total_costs || 0,
          totalProfit: dashboardStats.total_profit || 0,
          monthlyRevenue: dashboardStats.monthly_revenue || 0,
          monthlyGrossProfit: dashboardStats.monthly_gross_profit || 0,
          monthlyFixedCosts: dashboardStats.monthly_fixed_costs || 0,
          monthlyNetProfit: dashboardStats.monthly_net_profit || 0,
          monthlyMarginPercentage: dashboardStats.monthly_margin_percentage || 0,
          fixedCostsBreakdown: dashboardStats.fixed_costs_breakdown || []
        };
      } else {
        // Fallback: calcular estadísticas básicas sin gastos fijos
        let totalRevenue = 0;
        let totalCosts = 0;
        let totalProfit = 0;
        let monthlyRevenue = 0;
        let monthlyGrossProfit = 0;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        records
          .filter((record: any) => record.monto_pagado > 0)
          .forEach((record: any) => {
            const recordDate = new Date(record.fecha);
            const revenue = record.monto_pagado || 0;
            const cost = record.costo_unitario || 0;
            const commission = record.comision_monto || 0;
            const netProfit = revenue - cost - commission;

            totalRevenue += revenue;
            totalCosts += cost;
            totalProfit += netProfit;

            if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
              monthlyRevenue += revenue;
              monthlyGrossProfit += netProfit;
            }
          });

        financialStats = {
          totalRevenue,
          totalCosts,
          totalProfit,
          monthlyRevenue,
          monthlyGrossProfit,
          monthlyFixedCosts: 0,
          monthlyNetProfit: monthlyGrossProfit, // Sin gastos fijos
          monthlyMarginPercentage: monthlyRevenue > 0 ? (monthlyGrossProfit / monthlyRevenue) * 100 : 0,
          fixedCostsBreakdown: []
        };
      }

      // Calcular métodos de pago
      const paymentMethods = {
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0
      };

      // Procesar registros recientes
      const processedRecords = records
        .filter((record: any) => record.monto_pagado > 0)
        .map((record: any) => {
          const revenue = record.monto_pagado || 0;
          const paymentMethod = record.metodo_pago?.toLowerCase() || 'efectivo';
          
          if (paymentMethod === 'efectivo') {
            paymentMethods.efectivo += revenue;
          } else if (paymentMethod === 'tarjeta') {
            paymentMethods.tarjeta += revenue;
          } else if (paymentMethod === 'transferencia') {
            paymentMethods.transferencia += revenue;
          }

          return {
            id: record.id,
            patient_name: record.patient_name || 'N/A',
            treatment_name: record.treatment_name || 'N/A',
            monto_pagado: revenue,
            ganancia: record.ganancia || 0,
            metodo_pago: record.metodo_pago || 'efectivo',
            fecha: record.fecha,
            comision_monto: record.comision_monto || 0
          };
        })
        .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 10);

      // Calcular estadísticas de facturación
      let billedRevenue = 0;
      let nonBilledRevenue = 0;

      patients.forEach((patient: any) => {
        const patientRecords = records.filter((r: any) => r.patient_id === patient.id && r.monto_pagado > 0);
        const patientRevenue = patientRecords.reduce((sum: number, r: any) => sum + (r.monto_pagado || 0), 0);
        
        if (patient.requiere_factura) {
          billedRevenue += patientRevenue;
        } else {
          nonBilledRevenue += patientRevenue;
        }
      });

      const totalCalculatedRevenue = billedRevenue + nonBilledRevenue;
      const billedPercentage = totalCalculatedRevenue > 0 ? (billedRevenue / totalCalculatedRevenue) * 100 : 0;

      setStats({
        totalPatients: patients.length,
        totalTreatments: treatments.length,
        totalRecords: records.filter((r: any) => r.monto_pagado > 0).length,
        ...financialStats,
        upcomingPayments: 0,
        upcomingAppointments: 0,
        billingStats: {
          billedRevenue,
          nonBilledRevenue,
          billedPercentage
        },
        paymentMethods,
        recentRecords: processedRecords
      });

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Error al cargar los datos del dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando estadísticas del dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Resumen de tu consulatorio médico</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/patients/new">
              <Users className="h-4 w-4 mr-2" />
              Nuevo Paciente
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">{error}</span>
          </div>
        </div>
      )}

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tratamientos</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTreatments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas financieras mensuales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Bruta</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.monthlyGrossProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Sin gastos fijos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Fijos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${stats.monthlyFixedCosts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Mensuales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
            {stats.monthlyNetProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.monthlyNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${stats.monthlyNetProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Margen: {stats.monthlyMarginPercentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose de gastos fijos */}
      {stats.fixedCostsBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Desglose de Gastos Fijos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.fixedCostsBreakdown.map((gasto, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{gasto.concepto}</span>
                  <div className="text-right">
                    <span className="font-medium">${gasto.monto_mensual.toLocaleString()}/mes</span>
                    <span className="text-xs text-muted-foreground block">
                      ${gasto.monto.toLocaleString()} {gasto.frecuencia}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendario semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendario Semanal de Citas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyCalendar />
        </CardContent>
      </Card>

      {/* Registros recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Registros Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentRecords.length > 0 ? (
              stats.recentRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{record.patient_name}</p>
                    <p className="text-sm text-muted-foreground">{record.treatment_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(record.fecha).toLocaleDateString()} • {record.metodo_pago}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${record.monto_pagado.toLocaleString()}</p>
                    <p className="text-sm text-green-600">
                      +${record.ganancia.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No hay registros recientes</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
