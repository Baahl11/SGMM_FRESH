"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useConsultationForm } from "./form-state";
import { clampStepIndex, validateStep, type StepErrors } from "./model";
import { STEP_COMPONENTS, STEP_META, type Doctor } from "./steps";

export interface ConsultationWizardProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editingRecord?: any;
}

export function ConsultationWizard(props: ConsultationWizardProps) {
  const { open, onClose } = props;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          "flex h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl",
          "border-white/15 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white",
        )}
      >
        {/* Se monta fresco en cada apertura: el estado del formulario y de
            navegación arranca limpio sin necesidad de efectos de reset. */}
        {open ? <WizardBody {...props} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function WizardBody({
  patientId,
  patientName,
  onSuccess,
  editingRecord,
}: ConsultationWizardProps) {
  const fs = useConsultationForm(editingRecord);
  const { form, steps, setField, resetForm, toPayload } = fs;

  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<StepErrors>({});
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  // El nº de pasos visibles cambia con el tipo de consulta; el índice
  // efectivo se recorta en cada render (no se persiste recortado).
  const safeIndex = clampStepIndex(stepIndex, form);
  const currentStepId = steps[safeIndex];
  const isLast = safeIndex === steps.length - 1;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/doctors");
        if (!res.ok) return;
        const data = await res.json();
        const list: Doctor[] = Array.isArray(data)
          ? data
          : (data?.doctors ?? []);
        if (cancelled) return;
        setDoctors(
          list.map((d) => ({
            ...d,
            id: d?.id != null ? String(d.id) : undefined,
          })),
        );
      } catch {
        /* silencioso: el médico puede capturarse a mano */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDoctorSelect = useCallback(
    (doctorId: string) => {
      setSelectedDoctorId(doctorId);
      const doctor = doctors.find((d) => String(d.id) === doctorId);
      if (doctor) {
        setField("medicoNombre", doctor.nombre || "");
        setField(
          "medicoCedula",
          doctor.cedula_profesional || doctor.cedula || "",
        );
        setField("medicoEspecialidad", doctor.especialidad || "");
      }
    },
    [doctors, setField],
  );

  const goNext = useCallback(() => {
    const stepErrors = validateStep(currentStepId, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStepIndex(Math.min(steps.length - 1, safeIndex + 1));
  }, [currentStepId, form, steps.length, safeIndex]);

  const goPrev = useCallback(() => {
    setErrors({});
    setStepIndex(Math.max(0, safeIndex - 1));
  }, [safeIndex]);

  const handleSubmit = useCallback(async () => {
    const stepErrors = validateStep(currentStepId, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setLoading(true);
    try {
      const url = editingRecord
        ? `/api/medical-records/${editingRecord.id}`
        : "/api/medical-records";
      const method = editingRecord ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(patientId)),
      });
      if (res.ok) {
        toast.success(
          editingRecord
            ? "Consulta actualizada exitosamente"
            : "Consulta registrada exitosamente",
        );
        resetForm();
        onSuccess();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Error al registrar la consulta");
      }
    } catch {
      toast.error("Error al guardar la consulta");
    } finally {
      setLoading(false);
    }
  }, [
    currentStepId,
    form,
    editingRecord,
    toPayload,
    patientId,
    onSuccess,
    resetForm,
  ]);

  const StepComponent = STEP_COMPONENTS[currentStepId];

  const progress = useMemo(
    () =>
      steps.map((id, i) => ({
        id,
        label: STEP_META[id].label,
        done: i <= safeIndex,
      })),
    [steps, safeIndex],
  );

  return (
    <>
      <DialogHeader className="shrink-0 space-y-3 border-b border-white/10 bg-white/5 px-6 py-4 text-left backdrop-blur">
        <DialogTitle className="text-lg font-bold text-white sm:text-xl">
          {editingRecord ? "✏️ Editar consulta" : "📝 Nueva consulta"} —{" "}
          {patientName}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Asistente de {steps.length} pasos para registrar una nota clínica
          conforme a la NOM-004.
        </DialogDescription>
        <div className="flex items-start gap-1.5">
          {progress.map((s) => (
            <div key={s.id} className="flex-1">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors",
                  s.done
                    ? "bg-gradient-to-r from-indigo-400 to-cyan-400"
                    : "bg-white/10",
                )}
              />
              <span className="mt-1 hidden text-[11px] text-white/45 sm:block">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </DialogHeader>

      {/* Única zona con scroll */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <StepComponent
          fs={fs}
          errors={errors}
          doctors={doctors}
          selectedDoctorId={selectedDoctorId}
          onDoctorSelect={handleDoctorSelect}
        />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 bg-slate-900/80 px-6 py-4 backdrop-blur">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={safeIndex === 0}
          className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        <span className="text-sm text-white/60">
          Paso {safeIndex + 1} de {steps.length}
        </span>

        {isLast ? (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400"
          >
            {loading ? "Guardando..." : "Guardar consulta"}
          </Button>
        ) : (
          <Button
            onClick={goNext}
            className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-400 hover:to-cyan-400"
          >
            Siguiente
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  );
}

export default ConsultationWizard;
