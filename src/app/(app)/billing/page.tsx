"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Receipt, 
  Settings, 
  BarChart3, 
  Plus,
  Eye,
  Download,
  Mail,
  AlertCircle
} from "lucide-react";

interface Invoice {
  id: number;
  patient_id: number;
  treatment_ids: number[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  notes: string;
  cfdi_uuid?: string;
  created_at: string;
  updated_at: string;
}

interface BillingStats {
  total_invoiced_today: number;
  total_invoiced_month: number;
  pending_amount: number;
  overdue_amount: number;
  total_invoices: number;
  paid_invoices: number;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🧾 Loading billing data...");

      // Load invoices
      const invoicesResponse = await fetch("/api/billing/invoices");
      if (!invoicesResponse.ok) {
        throw new Error(`Failed to load invoices: ${invoicesResponse.status}`);
      }
      const invoicesData = await invoicesResponse.json();
      console.log("✅ Invoices loaded:", invoicesData);

      // Load stats  
      const statsResponse = await fetch("/api/billing/stats");
      if (!statsResponse.ok) {
        throw new Error(`Failed to load stats: ${statsResponse.status}`);
      }
      const statsData = await statsResponse.json();
      console.log("✅ Stats loaded:", statsData);

      setInvoices(Array.isArray(invoicesData) ? invoicesData : [invoicesData]);
      setStats(statsData);

    } catch (err: any) {
      console.error("❌ Error loading billing data:", err);
      setError(err.message || "Error loading billing data");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'timbrada':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos de facturación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>Error: {error}</span>
            </div>
            <Button onClick={loadBillingData} className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🧾 Facturación Electrónica
          </h1>
          <p className="text-gray-600 mt-2">
            Sistema de facturación CFDI 4.0 con Facturama
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Factura
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Facturado Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.total_invoiced_today)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Facturado Este Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.total_invoiced_month)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Facturas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.total_invoices}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Facturas Pagadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.paid_invoices}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Facturas
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Reportes
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Lista de Facturas ({invoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay facturas disponibles</p>
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Factura
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                              Factura #{invoice.id}
                            </h3>
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <p>Paciente ID: {invoice.patient_id}</p>
                            <p>Fecha: {formatDate(invoice.issue_date)}</p>
                            <p>Vencimiento: {formatDate(invoice.due_date)}</p>
                            {invoice.cfdi_uuid && (
                              <p>UUID: {invoice.cfdi_uuid}</p>
                            )}
                          </div>

                          {invoice.notes && (
                            <p className="text-sm text-gray-500">
                              {invoice.notes}
                            </p>
                          )}
                        </div>

                        <div className="text-right space-y-2">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                              Subtotal: {formatCurrency(invoice.subtotal)}
                            </p>
                            <p className="text-sm text-gray-600">
                              IVA: {formatCurrency(invoice.tax_amount)}
                            </p>
                            <p className="text-lg font-bold">
                              Total: {formatCurrency(invoice.total_amount)}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Mail className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuración Fiscal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Configuración Pendiente</span>
                  </div>
                  <p className="text-yellow-700 mt-2">
                    La configuración fiscal aún no está implementada. 
                    Endpoint necesario: GET/PUT /api/billing/settings
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium">Datos del Emisor:</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>RFC del emisor</li>
                      <li>Razón social</li>
                      <li>Régimen fiscal</li>
                      <li>Dirección fiscal</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Configuración Facturama:</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>API Key</li>
                      <li>API Secret</li>
                      <li>Modo sandbox/producción</li>
                      <li>Certificados digitales</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Reportes de Facturación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">Reportes Disponibles</span>
                </div>
                <p className="text-blue-700 mt-2">
                  Los reportes detallados se implementarán en futuras versiones.
                  Por ahora, las estadísticas básicas están disponibles en el dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
