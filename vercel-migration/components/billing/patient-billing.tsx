"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  FileText, 
  Download, 
  Eye, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  CreditCard,
  Receipt,
  Save,
  Plus,
  Building2,
  Mail,
  ExternalLink
} from "lucide-react";
import InvoiceHistory from "./invoice-history";
import Link from "next/link";

interface PatientBillingProps {
  patientId: string; // Changed to string (UUID)
  patientName: string;
}

export default function PatientBilling({ patientId, patientName }: PatientBillingProps) {
  const [activeTab, setActiveTab] = useState("invoices"); // Changed from "pending" to "invoices"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [facturamaConfigured, setFacturamaConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    checkFacturamaConfig();
  }, []);

  const checkFacturamaConfig = async () => {
    try {
      const response = await fetch('/api/facturama/config');
      if (response.ok) {
        const data = await response.json();
        setFacturamaConfigured(data.config?.is_configured || false);
      }
    } catch (error) {
      console.error('Error checking Facturama config:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Warning Banner */}
      {facturamaConfigured === false && (
        <Alert className="border-amber-200 bg-amber-50">
          <Settings className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-700">
              <strong>Facturama no configurado.</strong> Configure sus credenciales para generar facturas electrónicas (CFDI).
            </span>
            <Link href="/settings/facturacion">
              <Button variant="outline" size="sm" className="ml-4">
                <Settings className="h-4 w-4 mr-2" />
                Ir a Configuración
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
          <Receipt className="w-5 h-5" />
          <span className="font-medium">Facturación Electrónica</span>
        </div>
        <p className="text-gray-600 mt-2">
          Gestiona la configuración fiscal y genera facturas electrónicas para {patientName}
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
          <span className="text-gray-600">Cargando datos de facturación...</span>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Historial de Facturas
          </TabsTrigger>
          <TabsTrigger value="bundles" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Paquetes de Tratamientos
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <InvoiceHistory patientId={patientId} />
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Paquetes de Tratamientos Personalizados
                </div>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Crear Nuevo Paquete
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Formulario para crear nuevo bundle */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-4">Crear Paquete Personalizado</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nombre del Paquete</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Consulta + Botox"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Precio Total</label>
                    <input 
                      type="number" 
                      placeholder="2500"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Tratamientos Incluidos</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="consulta" />
                      <label htmlFor="consulta">Consulta General - $500</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="botox" />
                      <label htmlFor="botox">Aplicación Botox - $2000</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="limpieza" />
                      <label htmlFor="limpieza">Limpieza Dental - $800</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="fluoracion" />
                      <label htmlFor="fluoracion">Fluorización - $300</label>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Descripción (Opcional)</label>
                  <textarea 
                    placeholder="Describe las ventajas de este paquete..."
                    className="w-full p-2 border rounded-md"
                    rows={3}
                  ></textarea>
                </div>

                <div className="flex justify-end mt-4">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Paquete
                  </Button>
                </div>
              </div>

              {/* Lista de paquetes creados por el usuario */}
              <div>
                <h3 className="font-semibold mb-4">Tus Paquetes Creados</h3>
                <div className="text-center py-12 text-gray-500">
                  <Plus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-semibold mb-2">No has creado paquetes aún</h4>
                  <p className="mb-4">
                    Crea paquetes personalizados combinando tus tratamientos más comunes.<br/>
                    Por ejemplo: "Consulta + Botox", "Limpieza + Fluorización", etc.
                  </p>
                  <p className="text-sm text-blue-600">
                    💡 Tip: Los paquetes te ayudan a ofrecer precios especiales y agilizar el proceso de facturación
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}