"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Stethoscope, Package, TrendingUp, Calendar, DollarSign, CreditCard, Banknote, ArrowUpRight, Clock, AlertTriangle, TrendingDown, Activity, BarChart3, PieChart, Target, CheckCircle, Minus } from "lucide-react";
import ApiService from "@/lib/api-service";
import { apiGet, asArray, safeSort } from "@/lib/api";
import { asArray as safeAsArray, safeSort as ultraSafeSort } from "@/lib/safe";
import AuthService from "@/lib/auth-service";
import { useAuth } from "@/hooks/use-auth";
import WeeklyCalendar from "@/components/calendar/weekly-calendar";
import { AgendaWidget } from "@/components/agenda/agenda-widget";
import { safeGet, sortBy } from "@/lib/safeFetch";
// Force reload - fixed 404s


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
  id: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  costo_unitario: number;
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
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

  useEffect(() => {
    // Wait for auth loading to complete
    if (authLoading) return;
    
    // Check if user is authenticated (handles both traditional and OAuth)
    if (!isAuthenticated && process.env.NEXT_PUBLIC_BYPASS_AUTH !== "1") {
      console.error("User not authenticated, redirecting to login");
      router.push("/login");
      return;
    }
    
    // Only load data if authenticated
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, authLoading, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading dashboard data...');
      
      // Check authentication first - check both traditional and OAuth
      const traditionalAuth = AuthService.isAuthenticated();
      const storedToken = AuthService.getToken();
      const oauthToken = typeof window !== "undefined" ? localStorage.getItem('auth_token') : null;
      const hasValidAuth = traditionalAuth || oauthToken || isAuthenticated;
      
      console.log('Dashboard auth debugging:', {
        traditionalAuth,
        storedToken: !!storedToken,
        oauthToken: !!oauthToken,
        isAuthenticated,
        hasValidAuth
      });
      if (!hasValidAuth && process.env.NEXT_PUBLIC_BYPASS_AUTH !== "1") {
        console.error("User not authenticated, redirecting to login");
        router.push('/login');
        return;
      }
      
      // Cargar datos en paralelo - usando SOLO apiGet para todo
      const [patientsResponse, treatmentsResponse, dashboardStatsResponse, recordsResult, inventoryResult] = await Promise.all([
        ApiService.getPatients(),
        ApiService.getTreatments(),
        ApiService.getDashboardStats(),
        // CAMBIO CLAVE: usar apiGet en lugar de safeGet
        apiGet<any>('records/').catch(() => ({ count: 0, records: [] })),
        // CAMBIO CLAVE: usar apiGet en lugar de safeGet
        apiGet<any>('inventory/items').catch(() => ({ success: false, data: [] }))
      ]);

      console.log('🔍 Dashboard API responses received:', {
        patientsResponse,
        treatmentsResponse,
        dashboardStatsResponse,
        recordsResult,
        inventoryResult
      });

      // Procesar records de forma ultra segura
      const recordsData = safeAsArray(recordsResult?.records || recordsResult?.data || recordsResult);

      // Procesar inventory de forma segura  
      let inventoryHealthData: InventoryHealth & { stock_value: number } = {
        total_items: 0,
        high_stock: 0,
        medium_stock: 0,
        low_stock: 0,
        out_of_stock: 0,
        overall_status: 'good',
        critical_items: [],
        low_items: [],
        stock_value: 0
      };

      const inventoryData = inventoryResult?.data || inventoryResult;
      if (inventoryData && (inventoryData.success || inventoryData.items)) {
        // Intentar extraer items de diferentes estructuras posibles
        const items = safeAsArray(inventoryData.data || inventoryData.items || inventoryData) as InventoryItem[];
        const totalItems = items.length;
        
        // Calculate stock levels de forma segura
        const highStockItems = items.filter((item: InventoryItem) => {
          const percentage = (item.stock_maximo || 0) > 0 ? ((item.stock_actual || 0) / item.stock_maximo) * 100 : 0;
          return percentage >= 80;
        }).length;
            
        const mediumStockItems = items.filter((item: InventoryItem) => {
          const percentage = (item.stock_maximo || 0) > 0 ? ((item.stock_actual || 0) / item.stock_maximo) * 100 : 0;
          return percentage >= 40 && percentage < 80;
        }).length;
        
        const lowStockItems = items.filter((item: InventoryItem) => 
          (item.stock_actual || 0) > 0 && (item.stock_actual || 0) <= (item.stock_minimo || 0)
        );
        
        const outOfStockItems = items.filter((item: InventoryItem) => (item.stock_actual || 0) === 0);
        
        // Determine overall status
        let overallStatus = 'good';
        if (outOfStockItems.length > 0) {
          overallStatus = 'critical';
        } else if (lowStockItems.length > 0) {
          overallStatus = 'warning';
        }
        
        inventoryHealthData = {
          total_items: totalItems,
          high_stock: highStockItems,
          medium_stock: mediumStockItems,
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
          })),
          stock_value: items.reduce((total: number, item: InventoryItem) => total + ((item.stock_actual || 0) * (item.costo_unitario || 0)), 0)
        };
        
        console.log('Dashboard: Calculated inventory health:', inventoryHealthData);
      }

      if (patientsResponse.error || treatmentsResponse.error) {
        if (patientsResponse.error) {
          console.error("Error loading patients:", patientsResponse.error);
        }
        if (treatmentsResponse.error) {
          console.error("Error loading treatments:", treatmentsResponse.error);
        }
        setError("Algunos datos no se pudieron cargar. Mostrando información disponible.");
      }

      const patients = patientsResponse.data || [];
      const treatments = treatmentsResponse.data || [];
      const dashboardStats = dashboardStatsResponse.data || null;
      const rawRecords = recordsData;

      console.log('🔍 Dashboard data loaded:', {
        patientsCount: patients.length,
        treatmentsCount: treatments.length,
        rawRecordsCount: rawRecords.length,
        recordsResult: recordsResult
      });

      // Enriquecer registros con nombres de pacientes y tratamientos
      let recentRecordsData: any[] = [];
      try {
        // Verificar que rawRecords sea un array válido
        if (Array.isArray(rawRecords) && rawRecords.length > 0) {
          recentRecordsData = ultraSafeSort(rawRecords, (a: any, b: any) => {
            const dateA = new Date(String(a.fecha || a.created_at || '')).getTime();
            const dateB = new Date(String(b.fecha || b.created_at || '')).getTime();
            return dateB - dateA;
          })
            .slice(0, 5)
            .map((record: any) => {
              const patient = patients.find((p: any) => p.id === record.patient_id);
              const treatment = treatments.find((t: any) => t.id === record.treatment_id);
              return {
                ...record,
                patient_name: patient?.nombre || 'Paciente desconocido',
                treatment_name: treatment?.nombre || 'Tratamiento desconocido'
              };
            });
        } else {
          console.warn('⚠️ rawRecords is not a valid array:', rawRecords);
          recentRecordsData = [];
        }
      } catch (error) {
        console.error('❌ Error enriching records:', error);
        recentRecordsData = [];
      }

      console.log('📋 Recent records loaded:', {
        rawCount: rawRecords.length,
        enrichedCount: recentRecordsData.length,
        records: recentRecordsData,
        patients: patients.map(p => ({id: p.id, name: p.nombre})),
        treatments: treatments.map(t => ({id: t.id, name: t.nombre}))
      });

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
        // REMOVED: fallback stats calculation using legacy records
      }

      // All legacy records logic removed. Dashboard now uses only dashboardStats and valid endpoints.
      setStats({
        totalPatients: patients.length,
        totalTreatments: treatments.length,
        totalRecords: dashboardStats?.total_records ?? 0,
        totalRevenue: dashboardStats?.total_revenue ?? 0,
        totalCosts: dashboardStats?.total_costs ?? 0,
        totalProfit: dashboardStats?.total_profit ?? 0,
        monthlyRevenue: dashboardStats?.monthly_revenue ?? 0,
        monthlyGrossProfit: dashboardStats?.monthly_gross_profit ?? 0,
        monthlyFixedCosts: dashboardStats?.monthly_fixed_costs ?? 0,
        monthlyNetProfit: dashboardStats?.monthly_net_profit ?? 0,
        monthlyMarginPercentage: dashboardStats?.monthly_margin_percentage ?? 0,
        upcomingPayments: 0,
        upcomingAppointments: 0,
        billingStats: dashboardStats?.billingStats ?? { billedRevenue: 0, nonBilledRevenue: 0, billedPercentage: 0 },
        paymentMethods: dashboardStats?.paymentMethods ?? { efectivo: 0, tarjeta: 0, transferencia: 0 },
        recentRecords: recentRecordsData,
        fixedCostsBreakdown: dashboardStats?.fixedCostsBreakdown ?? []
      });

      // Actualizar estado del inventario - ULTRA SEGURO
      const finalInventoryData = inventoryResult?.data || inventoryResult;
      if (finalInventoryData && (finalInventoryData.success || finalInventoryData.items || Array.isArray(finalInventoryData))) {
        const items = safeAsArray(finalInventoryData.data || finalInventoryData.items || finalInventoryData);
        const totalItems = items.length;
        
        // Calculate stock levels de forma segura
        const highStockItems = items.filter((item: any) => {
          const percentage = (item.stock_maximo || 0) > 0 ? ((item.stock_actual || 0) / item.stock_maximo) * 100 : 0;
          return percentage >= 80;
        }).length;
            
        const mediumStockItems = items.filter((item: any) => {
          const percentage = (item.stock_maximo || 0) > 0 ? ((item.stock_actual || 0) / item.stock_maximo) * 100 : 0;
          return percentage >= 40 && percentage < 80;
        }).length;
        
        const lowStockItems = items.filter((item: any) => 
          (item.stock_actual || 0) > 0 && (item.stock_actual || 0) <= (item.stock_minimo || 0)
        );
        
        const outOfStockItems = items.filter((item: any) => (item.stock_actual || 0) === 0);
        
        // Determine overall status
        let overallStatus = 'good';
        if (outOfStockItems.length > 0) {
          overallStatus = 'critical';
        } else if (lowStockItems.length > 0) {
          overallStatus = 'warning';
        }
        
        const healthData = {
          total_items: totalItems,
          high_stock: highStockItems,
          medium_stock: mediumStockItems,
          low_stock: lowStockItems.length,
          out_of_stock: outOfStockItems.length,
          overall_status: overallStatus,
          critical_items: outOfStockItems.map((item: any) => ({
            id: item.id,
            nombre: item.nombre,
            stock_actual: item.stock_actual || 0,
            stock_minimo: item.stock_minimo || 0,
            status: 'out_of_stock'
          })),
          low_items: lowStockItems.map((item: any) => ({
            id: item.id,
            nombre: item.nombre,
            stock_actual: item.stock_actual || 0,
            stock_minimo: item.stock_minimo || 0,
            status: 'low_stock'
          })),
          stock_value: items.reduce((total: number, item: any) => total + ((item.stock_actual || 0) * (item.costo_unitario || 0)), 0)
        };
        
        console.log('✅ Dashboard: Inventory health calculated:', healthData);
        setInventoryHealth(healthData);
      } else {
        console.error('❌ Dashboard: Inventory health error: no data');
        // Set default empty state if no data
        setInventoryHealth({
          total_items: 0,
          high_stock: 0,
          medium_stock: 0,
          low_stock: 0,
          out_of_stock: 0,
          overall_status: 'good',
          critical_items: [],
          low_items: []
        });
      }

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

  // Mensaje visual de autenticación - check both traditional and OAuth
  const hasOAuthToken = typeof window !== "undefined" ? localStorage.getItem('auth_token') : null;
  const isActuallyAuthenticated = AuthService.isAuthenticated() || hasOAuthToken || isAuthenticated;
  
  if (!isActuallyAuthenticated && !authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded shadow">
          Debes iniciar sesión para ver el dashboard. Redirigiendo a login...
        </div>
      </div>
    );
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated (this should be handled by useEffect but adding as fallback)
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600">Resumen de tu consulatorio médico</p>
          </div>
        </div>        <div className="flex gap-3">          <Button 
            variant="outline" 
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <Activity className="h-4 w-4" />
            <span>{loading ? 'Cargando...' : 'Actualizar'}</span>
          </Button>
          <Button asChild className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-sm">
            <Link href="/patients/new">
              <Users className="h-4 w-4 mr-2" />
              Nuevo Paciente
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
        </Card>        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-indigo-700">Inventario</CardTitle>
            <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>            <div className="text-3xl font-bold text-indigo-900">
              {inventoryHealth.total_items || 0}
            </div>
            <div className="flex items-center mt-2">
              {inventoryHealth.total_items === 0 && (
                <>
                  <AlertTriangle className="h-3 w-3 text-gray-500 mr-1" />
                  <span className="text-xs text-gray-500 font-medium">Cargando datos...</span>
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
            <div className="text-3xl font-bold text-amber-900">${stats.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600 font-medium">Acumulado</span>
            </div>
          </CardContent>        </Card>
      </div>

      {/* Estado del Inventario */}
      {(inventoryHealth.low_items.length > 0 || inventoryHealth.critical_items.length > 0) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              inventoryHealth.overall_status === 'critical' ? 'bg-gradient-to-br from-red-500 to-red-600' :
              inventoryHealth.overall_status === 'warning' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
              'bg-gradient-to-br from-green-500 to-green-600'
            }`}>
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Estado del Inventario</h2>
              <p className="text-gray-600 text-sm">Items que requieren atención inmediata</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Stock Alto</p>
                  <p className="text-2xl font-bold text-green-800">{inventoryHealth.high_stock}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Stock Medio</p>
                  <p className="text-2xl font-bold text-yellow-800">{inventoryHealth.medium_stock}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Stock Bajo</p>
                  <p className="text-2xl font-bold text-orange-800">{inventoryHealth.low_stock}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Agotado</p>
                  <p className="text-2xl font-bold text-red-800">{inventoryHealth.out_of_stock}</p>
                </div>
                <Minus className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Items críticos */}
          {inventoryHealth.critical_items.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-medium text-red-800 mb-3 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Items Críticos (Agotados)
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {inventoryHealth.critical_items.map((item) => (
                  <div key={item.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="font-medium text-red-800">{item.nombre}</p>
                    <p className="text-sm text-red-600">Stock: {item.stock_actual} (Min: {item.stock_minimo})</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items con stock bajo */}
          {inventoryHealth.low_items.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-orange-800 mb-3 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Items con Stock Bajo
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {inventoryHealth.low_items.map((item) => (
                  <div key={item.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="font-medium text-orange-800">{item.nombre}</p>
                    <p className="text-sm text-orange-600">Stock: {item.stock_actual} (Min: {item.stock_minimo})</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link href="/inventory">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Package className="h-4 w-4 mr-2" />
                Gestionar Inventario
              </Button>
            </Link>
          </div>
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
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-green-700">Ingresos Mes</CardTitle>
              <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">${stats.monthlyRevenue.toLocaleString()}</div>
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
              <div className="text-2xl font-bold text-blue-900">${stats.monthlyGrossProfit.toLocaleString()}</div>
              <p className="text-xs text-blue-600 mt-1 font-medium">Sin gastos fijos</p>
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
              <div className="text-2xl font-bold text-red-900">${stats.monthlyFixedCosts.toLocaleString()}</div>
              <p className="text-xs text-red-600 mt-1 font-medium">Mensuales</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${stats.monthlyNetProfit >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'} shadow-sm`}>
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
              <div className={`text-2xl font-bold ${stats.monthlyNetProfit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                ${stats.monthlyNetProfit.toLocaleString()}
              </div>
              <p className={`text-xs mt-1 font-medium ${stats.monthlyNetProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                Margen: {stats.monthlyMarginPercentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Desglose de gastos fijos */}
      {stats.fixedCostsBreakdown.length > 0 && (
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">Desglose de Gastos Fijos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.fixedCostsBreakdown.map((gasto: {
                concepto: string;
                monto: number;
                frecuencia: string;
                monto_mensual: number;
              }, index: number) => (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{gasto.concepto}</h4>
                      <p className="text-sm text-gray-600 mt-1">{gasto.frecuencia}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">${gasto.monto_mensual.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">por mes</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Total: <span className="font-medium">${gasto.monto.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendario semanal */}
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
          <AgendaWidget />
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
                    <p className="font-bold text-lg text-gray-900">${record.monto_pagado.toLocaleString()}</p>
                    <p className="text-sm text-green-600 font-medium">
                      +${record.ganancia.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500">No hay registros recientes</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
