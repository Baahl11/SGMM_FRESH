"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Printer, Download } from "lucide-react";
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

  const handleGenerateInvoice = async () => {
    setLoading(true);
    try {
      // TODO: Implementar generación de factura
      toast.success("Funcionalidad de facturación próximamente");
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al generar factura");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6 text-green-600" />
            Crear Factura - {patientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="text-center py-8">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Facturación Electrónica
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Genera facturas con formato oficial (CFDI 4.0) para tus tratamientos
            </p>
            
            <div className="space-y-2 text-xs text-gray-500">
              <p>✓ Cumple con normativa SAT</p>
              <p>✓ Timbrado automático</p>
              <p>✓ Envío por correo electrónico</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Próximamente:</strong> Sistema completo de facturación electrónica integrado
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cerrar
            </Button>
            <Button
              onClick={handleGenerateInvoice}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              <Printer className="h-4 w-4 mr-2" />
              {loading ? "Generando..." : "Generar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
