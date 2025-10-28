"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Stethoscope, Package, TrendingUp, Calendar, DollarSign, CreditCard, Banknote, ArrowUpRight, Clock, AlertTriangle, TrendingDown, Activity, BarChart3, PieChart, Target, CheckCircle, Minus, Settings } from "lucide-react";
import AppLayout from "@/components/layout/app-layout";
import { MiniAgenda } from "@/components/agenda/mini-agenda";

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

      const monthlyNetProfit = monthlyGrossProfit - monthlyFixedCosts;
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
        monthlyNetProfit,
        monthlyMarginPercentage,
        upcomingPayments: 0,
        upcomingAppointments: 0,
        billingStats: { billedRevenue, nonBilledRevenue, billedPercentage },
        paymentMethods,
        recentRecords,
        fixedCostsBreakdown: fixedCostsData
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
            <p className="text-gray-600">Resumen de tu consulorio médico</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <Activity className="h-4 w-4" />
            <span>{loading ? 'Cargando...' : 'Actualizar'}</span>
          </Button>
          <Button asChild variant="outline" className="flex items-center space-x-2">
            <Link href="/dashboard/settings/doctors">
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
            </Link>
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
              <div className="text-2xl font-bold text-red-900">${(stats?.monthlyFixedCosts || 0).toLocaleString()}</div>
              <p className="text-xs text-red-600 mt-1 font-medium">Mensuales</p>
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
                      <p className="font-bold text-lg text-gray-900">${(gasto.monto_mensual || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">por mes</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Total: <span className="font-medium">${(gasto.monto || 0).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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