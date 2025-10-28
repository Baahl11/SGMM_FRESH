"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface QuickAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
}

export function QuickAppointmentModal({
  open,
  onClose,
  patientId,
  patientName,
  onSuccess
}: QuickAppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState<Date>();
  const [hora, setHora] = useState("");
  const [duracion, setDuracion] = useState("60");
  const [motivo, setMotivo] = useState("");
  const [notas, setNotas] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fecha || !hora) {
      toast.error("Selecciona fecha y hora");
      return;
    }

    setLoading(true);
    try {
      // Combinar fecha y hora
      const [hours, minutes] = hora.split(":");
      const fechaHora = new Date(fecha);
      fechaHora.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          fecha_hora: fechaHora.toISOString(),
          duracion_minutos: parseInt(duracion),
          motivo,
          notas,
          estado: "programada"
        }),
      });

      if (response.ok) {
        toast.success("Cita programada exitosamente");
        onSuccess?.();
        onClose();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al programar cita");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al programar la cita");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFecha(undefined);
    setHora("");
    setDuracion("60");
    setMotivo("");
    setNotas("");
  };

  // Generar opciones de hora (8:00 AM - 8:00 PM cada 30 min)
  const horarios = [];
  for (let h = 8; h <= 20; h++) {
    horarios.push(`${h.toString().padStart(2, "0")}:00`);
    if (h < 20) horarios.push(`${h.toString().padStart(2, "0")}:30`);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            Programar Cita - {patientName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Fecha de la Cita *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fecha ? format(fecha, "PPP", { locale: es }) : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={setFecha}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Hora *</Label>
              <Select value={hora} onValueChange={setHora}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona hora..." />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {horarios.map((h) => (
                    <SelectItem key={h} value={h}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {h}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duración */}
          <div>
            <Label>Duración</Label>
            <Select value={duracion} onValueChange={setDuracion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1.5 horas</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Motivo */}
          <div>
            <Label>Motivo de la Consulta</Label>
            <Input
              placeholder="Ej: Consulta de seguimiento, Control de tratamiento..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          {/* Notas */}
          <div>
            <Label>Notas Adicionales</Label>
            <Textarea
              placeholder="Instrucciones especiales, preparación, etc..."
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          {/* Vista previa */}
          {fecha && hora && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">
                📅 Resumen de la Cita
              </p>
              <div className="text-sm text-blue-700 space-y-1">
                <p>
                  <strong>Fecha:</strong> {format(fecha, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <p>
                  <strong>Hora:</strong> {hora} hrs
                </p>
                <p>
                  <strong>Duración:</strong> {duracion} minutos
                </p>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading || !fecha || !hora}
            >
              {loading ? "Programando..." : "Programar Cita"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
