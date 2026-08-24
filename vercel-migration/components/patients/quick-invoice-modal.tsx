"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Receipt, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface QuickInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
}

export function QuickInvoiceModal({
  open,
  onClose,
  patientId,
  patientName,
  onSuccess
}: QuickInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Array<{
    id: string;
    fecha: string;
    monto_pagado: number;
    metodo_pago: string;
    treatment_name?: string;
    pendiente_facturar?: boolean;
  }>>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;

    const loadPendingRecords = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/records/patient/${patientId}?limit=150`);
        if (!response.ok) {
          throw new Error("No se pudieron cargar los tratamientos");
        }

        const data = await response.json();
        const pending = (Array.isArray(data) ? data : []).filter((record: any) => (
          (record.metodo_pago === "tarjeta" || record.metodo_pago === "transferencia")
          && record.pendiente_facturar !== false
          && Number(record.monto_pagado || 0) > 0
        ));

        setRecords(pending);
        setSelectedIds(new Set(pending.slice(0, 3).map((record: any) => record.id)));
      } catch (error) {
        console.error("Error loading pending invoice records:", error);
        toast.error("Error al cargar tratamientos pendientes");
      } finally {
        setLoading(false);
      }
    };

    loadPendingRecords();
  }, [open, patientId]);

  const selectedRecords = useMemo(
    () => records.filter((record) => selectedIds.has(record.id)),
    [records, selectedIds]
  );

  const total = useMemo(
    () => selectedRecords.reduce((sum, record) => sum + Number(record.monto_pagado || 0), 0),
    [selectedRecords]
  );

  const toggleRecord = (recordId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(recordId)) next.delete(recordId);
      else next.add(recordId);
      return next;
    });
  };

  const selectAllRecords = () => {
    setSelectedIds(new Set(records.map((record) => record.id)));
  };

  const selectSuggestedRecords = () => {
    setSelectedIds(new Set(records.slice(0, 3).map((record) => record.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const ensureFiscalData = async () => {
    const fiscalResponse = await fetch(`/api/patients/${patientId}/fiscal-data`);
    if (!fiscalResponse.ok) {
      throw new Error("No se pudieron consultar los datos fiscales del paciente");
    }

    const fiscalData = await fiscalResponse.json();
    const existing = fiscalData?.fiscal_data || [];

    if (existing.length > 0) {
      const defaultFiscal = existing.find((row: any) => row.is_default) || existing[0];
      return defaultFiscal.id as string;
    }

    const createResponse = await fetch(`/api/patients/${patientId}/fiscal-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: patientId,
        rfc: "XAXX010101000",
        razon_social: patientName,
        regimen_fiscal: "612",
        codigo_postal: "01000",
        uso_cfdi: "D01",
        is_default: true,
      }),
    });

    const createdPayload = await createResponse.json();
    if (!createResponse.ok || !createdPayload?.fiscal_data?.id) {
      throw new Error(createdPayload?.error || "No se pudieron crear datos fiscales demo");
    }

    return createdPayload.fiscal_data.id as string;
  };

  const handleGenerateInvoice = async () => {
    if (selectedRecords.length === 0) {
      toast.error("Selecciona al menos un tratamiento");
      return;
    }

    setLoading(true);
    try {
      const fiscalDataId = await ensureFiscalData();
      const firstPaymentMethod = selectedRecords[0]?.metodo_pago;
      const formaPago = firstPaymentMethod === "transferencia"
        ? "03"
        : firstPaymentMethod === "tarjeta"
          ? "04"
          : "99";

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          fiscal_data_id: fiscalDataId,
          record_ids: selectedRecords.map((record) => record.id),
          forma_pago: formaPago,
          metodo_pago: "PUE",
          notas: "Factura creada desde atajo rápido de paciente",
          send_email: false,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "No se pudo generar la factura");
      }

      toast.success(payload.demo_mode ? "Factura demo generada" : "Factura generada correctamente");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error al generar factura");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border border-white/15 bg-[#061025]/95 text-white backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-white">
            <Receipt className="h-6 w-6 text-emerald-300" />
            Crear Factura - {patientName}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            <p className="font-medium text-white">Facturación rápida inteligente</p>
            <p className="mt-1 text-white/70">
              Selecciona tratamientos pendientes y genera una factura demo en segundos. Ideal para simulaciones comerciales.
            </p>
          </div>

          {loading && records.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-white/70">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Cargando tratamientos pendientes...
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
              <Sparkles className="mx-auto mb-3 h-10 w-10 text-cyan-200" />
              <h3 className="text-lg font-semibold text-white">No hay cargos pendientes</h3>
              <p className="mt-2 text-sm text-white/70">
                Este paciente no tiene tratamientos por facturar con tarjeta o transferencia.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectSuggestedRecords}
                  className="border-white/25 bg-white/5 text-white hover:bg-white/10"
                >
                  Sugeridos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllRecords}
                  className="border-white/25 bg-white/5 text-white hover:bg-white/10"
                >
                  Seleccionar todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="border-white/25 bg-white/5 text-white hover:bg-white/10"
                >
                  Limpiar selección
                </Button>
              </div>

              {records.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => toggleRecord(record.id)}
                  className={`flex w-full items-start justify-between rounded-2xl border p-4 text-left transition ${selectedIds.has(record.id)
                    ? "border-emerald-300/50 bg-emerald-400/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {record.treatment_name || "Tratamiento"}
                    </p>
                    <p className="text-xs text-white/60">
                      {new Date(record.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                      {" · "}
                      {record.metodo_pago}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-200">
                      ${Number(record.monto_pagado || 0).toLocaleString("es-MX")}
                    </p>
                    <p className="text-xs text-white/60">
                      {selectedIds.has(record.id) ? "Seleccionado" : "Toca para seleccionar"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {records.length > 0 && (
            <div className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4">
              <div className="flex items-center justify-between text-sm text-white/80">
                <span>Tratamientos seleccionados</span>
                <span className="font-semibold text-white">{selectedRecords.length}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm text-white/80">
                <span>Total estimado</span>
                <span className="text-lg font-bold text-cyan-200">${total.toLocaleString("es-MX")}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              Cerrar
            </Button>
            <Button
              onClick={handleGenerateInvoice}
              className="flex-1 border-0 bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 text-black hover:from-emerald-200 hover:via-cyan-200 hover:to-sky-200"
              disabled={loading || selectedRecords.length === 0}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Receipt className="mr-2 h-4 w-4" />}
              {loading ? "Generando..." : "Generar factura demo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
