"use client";

import { useState, useEffect } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";
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
    <div className="space-y-6 text-white">
      {facturamaConfigured === false && (
        <Alert className="border border-amber-400/40 bg-amber-500/10 text-amber-100">
          <Settings className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <span>
              <strong>Facturama no configurado.</strong> Configure sus credenciales para generar facturas electrónicas (CFDI).
            </span>
            <Link href="/dashboard/settings/facturacion">
              <Button
                variant="outline"
                size="sm"
                className="border-amber-200/40 text-amber-100 hover:bg-amber-500/20"
              >
                <Settings className="mr-2 h-4 w-4" />
                Ir a Configuración
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="py-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2">
          <Receipt className="h-5 w-5 text-emerald-200" />
          <span className="font-medium">Facturación Electrónica</span>
        </div>
        <p className="mt-2 text-sm text-white/70">
          Gestiona la configuración fiscal y genera facturas electrónicas para {patientName}
        </p>
      </div>

      {error && (
        <Alert className="border border-rose-400/40 bg-rose-500/10 text-rose-100">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border border-emerald-400/40 bg-emerald-500/10 text-emerald-100">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
          <span className="text-white/70">Cargando datos de facturación...</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 rounded-2xl border border-white/10 bg-white/5 p-1 text-white/70">
          <TabsTrigger value="invoices" className="rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-white/10 data-[state=active]:bg-white/15 data-[state=active]:text-white">
            <FileText className="h-4 w-4" />
            Historial de Facturas
          </TabsTrigger>
          <TabsTrigger value="bundles" className="rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-white/10 data-[state=active]:bg-white/15 data-[state=active]:text-white">
            <Plus className="h-4 w-4" />
            Paquetes de Tratamientos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6 space-y-6">
          <GlassPanel className="border-white/10 bg-white/5 p-4">
            <InvoiceHistory patientId={patientId} />
          </GlassPanel>
        </TabsContent>

        <TabsContent value="bundles" className="mt-6 space-y-6">
          <GlassPanel className="border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Plus className="h-5 w-5 text-emerald-200" />
                Paquetes de Tratamientos Personalizados
              </div>
              <Button className="border-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-black hover:from-emerald-300 hover:via-cyan-300 hover:to-blue-400">
                <Plus className="mr-2 h-4 w-4" />
                Crear Nuevo Paquete
              </Button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-lg font-semibold">Crear Paquete Personalizado</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">Nombre del Paquete</label>
                  <input
                    type="text"
                    placeholder="Ej: Consulta + Botox"
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-emerald-300/60 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">Precio Total</label>
                  <input
                    type="number"
                    placeholder="2500"
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-emerald-300/60 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-white/70">Tratamientos Incluidos</label>
                <div className="space-y-2 text-sm text-white/80">
                  {[
                    { id: 'consulta', label: 'Consulta General - $500' },
                    { id: 'botox', label: 'Aplicación Botox - $2000' },
                    { id: 'limpieza', label: 'Limpieza Dental - $800' },
                    { id: 'fluoracion', label: 'Fluorización - $300' },
                  ].map((item) => (
                    <label key={item.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <input type="checkbox" id={item.id} className="accent-emerald-400" />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-white/70">Descripción (Opcional)</label>
                <textarea
                  placeholder="Describe las ventajas de este paquete..."
                  className="w-full rounded-2xl border border-white/20 bg-white/5 px-3 py-3 text-white placeholder-white/40 focus:border-emerald-300/60 focus:outline-none"
                  rows={3}
                ></textarea>
              </div>

              <div className="mt-6 flex justify-end">
                <Button className="border-0 bg-emerald-500 text-black hover:bg-emerald-400">
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Paquete
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
              <Plus className="mx-auto mb-4 h-16 w-16 text-white/20" />
              <h4 className="mb-2 text-lg font-semibold text-white">No has creado paquetes aún</h4>
              <p className="mb-4 text-white/70">
                Crea paquetes personalizados combinando tus tratamientos más comunes. Por ejemplo: "Consulta + Botox", "Limpieza + Fluorización", etc.
              </p>
              <p className="text-sm text-cyan-200">
                💡 Tip: Los paquetes te ayudan a ofrecer precios especiales y agilizar el proceso de facturación.
              </p>
            </div>
          </GlassPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}