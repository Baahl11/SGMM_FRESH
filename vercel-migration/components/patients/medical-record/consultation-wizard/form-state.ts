"use client";

import { useCallback, useMemo, useState } from "react";
import type { Medicamento } from "@/types/medical-record";
import {
  buildPayload,
  emptyFormState,
  formStateFromRecord,
  visibleSteps,
  type FormState,
  type StepId,
} from "./model";

export interface UseConsultationForm {
  form: FormState;
  /** Actualiza un campo de primer nivel del formulario. */
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  /** Actualiza un signo vital por clave. */
  setVital: (key: keyof FormState["signosVitales"], value: string) => void;
  /** Actualiza un campo de antecedentes por clave. */
  setAntecedente: (
    key: Exclude<keyof FormState["antecedentes"], "alergias">,
    value: string,
  ) => void;
  addAlergia: (value: string) => void;
  removeAlergia: (index: number) => void;
  addMedicamento: () => void;
  updateMedicamento: (
    index: number,
    field: keyof Medicamento,
    value: string,
  ) => void;
  removeMedicamento: (index: number) => void;
  resetForm: () => void;
  toPayload: (patientId: string) => ReturnType<typeof buildPayload>;
  steps: StepId[];
}

/**
 * Estado del formulario del wizard. Se inicializa una sola vez desde
 * `editingRecord`; el componente que lo usa se monta fresco en cada
 * apertura del diálogo, así que no hace falta un efecto de sincronización.
 */
export function useConsultationForm(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editingRecord?: any,
): UseConsultationForm {
  const [form, setForm] = useState<FormState>(() =>
    editingRecord ? formStateFromRecord(editingRecord) : emptyFormState(),
  );

  const resetForm = useCallback(() => setForm(emptyFormState()), []);

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setVital = useCallback(
    (key: keyof FormState["signosVitales"], value: string) => {
      setForm((prev) => ({
        ...prev,
        signosVitales: { ...prev.signosVitales, [key]: value },
      }));
    },
    [],
  );

  const setAntecedente = useCallback(
    (key: Exclude<keyof FormState["antecedentes"], "alergias">, value: string) => {
      setForm((prev) => ({
        ...prev,
        antecedentes: { ...prev.antecedentes, [key]: value },
      }));
    },
    [],
  );

  const addAlergia = useCallback((value: string) => {
    const v = value.trim();
    if (!v) return;
    setForm((prev) => ({
      ...prev,
      antecedentes: {
        ...prev.antecedentes,
        alergias: [...prev.antecedentes.alergias, v],
      },
    }));
  }, []);

  const removeAlergia = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      antecedentes: {
        ...prev.antecedentes,
        alergias: prev.antecedentes.alergias.filter((_, i) => i !== index),
      },
    }));
  }, []);

  const addMedicamento = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      medicamentos: [
        ...prev.medicamentos,
        { nombre: "", dosis: "", via: "oral", frecuencia: "", duracion: "" },
      ],
    }));
  }, []);

  const updateMedicamento = useCallback(
    (index: number, field: keyof Medicamento, value: string) => {
      setForm((prev) => ({
        ...prev,
        medicamentos: prev.medicamentos.map((m, i) =>
          i === index ? { ...m, [field]: value } : m,
        ),
      }));
    },
    [],
  );

  const removeMedicamento = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      medicamentos: prev.medicamentos.filter((_, i) => i !== index),
    }));
  }, []);

  const toPayload = useCallback(
    (patientId: string) => buildPayload(form, patientId),
    [form],
  );

  const steps = useMemo(() => visibleSteps(form), [form]);

  return {
    form,
    setField,
    setVital,
    setAntecedente,
    addAlergia,
    removeAlergia,
    addMedicamento,
    updateMedicamento,
    removeMedicamento,
    resetForm,
    toPayload,
    steps,
  };
}
