// Núcleo puro del wizard de consultas: forma del formulario, pasos,
// validación por paso y armado del payload. Sin React — testeable en node.

import type {
  CreateMedicalRecordDTO,
  Medicamento,
  TipoConsulta,
} from '@/types/medical-record'

export type StepId =
  | 'tipo'
  | 'signos'
  | 'antecedentes'
  | 'diagnostico'
  | 'tratamiento'
  | 'revision'

export const STEP_ORDER: StepId[] = [
  'tipo',
  'signos',
  'antecedentes',
  'diagnostico',
  'tratamiento',
  'revision',
]

export interface FormState {
  tipoConsulta: TipoConsulta
  signosVitales: {
    presion_arterial_sistolica: string
    presion_arterial_diastolica: string
    frecuencia_cardiaca: string
    frecuencia_respiratoria: string
    temperatura: string
    peso: string
    talla: string
    saturacion_oxigeno: string
  }
  antecedentes: {
    heredo_familiares: string
    personales_patologicos: string
    personales_no_patologicos: string
    gineco_obstetricos: string
    alergias: string[]
  }
  padecimientoActual: string
  exploracionFisica: string
  diagnosticoCIE10: string
  diagnosticoDescripcion: string
  pronostico: string
  medicamentos: Medicamento[]
  indicacionesGenerales: string
  notasPrivadas: string
  medicoNombre: string
  medicoCedula: string
  medicoEspecialidad: string
}

export type StepErrors = Record<string, string>

export function emptyFormState(overrides: Partial<FormState> = {}): FormState {
  return {
    tipoConsulta: 'evolucion',
    signosVitales: {
      presion_arterial_sistolica: '',
      presion_arterial_diastolica: '',
      frecuencia_cardiaca: '',
      frecuencia_respiratoria: '',
      temperatura: '',
      peso: '',
      talla: '',
      saturacion_oxigeno: '',
    },
    antecedentes: {
      heredo_familiares: '',
      personales_patologicos: '',
      personales_no_patologicos: '',
      gineco_obstetricos: '',
      alergias: [],
    },
    padecimientoActual: '',
    exploracionFisica: '',
    diagnosticoCIE10: '',
    diagnosticoDescripcion: '',
    pronostico: '',
    medicamentos: [],
    indicacionesGenerales: '',
    notasPrivadas: '',
    medicoNombre: '',
    medicoCedula: '',
    medicoEspecialidad: '',
    ...overrides,
  }
}

// El record proviene de la API sin tipar con rigor; se mapea de forma
// defensiva a FormState (números -> string, nulos -> '').
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formStateFromRecord(record: any): FormState {
  const sv = record?.signos_vitales ?? {}
  const ant = record?.antecedentes ?? {}
  const numToStr = (v: unknown) =>
    v === null || v === undefined || v === '' ? '' : String(v)
  return emptyFormState({
    tipoConsulta: (record?.tipo_consulta as TipoConsulta) || 'evolucion',
    signosVitales: {
      presion_arterial_sistolica: numToStr(sv.presion_arterial_sistolica),
      presion_arterial_diastolica: numToStr(sv.presion_arterial_diastolica),
      frecuencia_cardiaca: numToStr(sv.frecuencia_cardiaca),
      frecuencia_respiratoria: numToStr(sv.frecuencia_respiratoria),
      temperatura: numToStr(sv.temperatura),
      peso: numToStr(sv.peso),
      talla: numToStr(sv.talla),
      saturacion_oxigeno: numToStr(sv.saturacion_oxigeno),
    },
    antecedentes: {
      heredo_familiares: ant.heredo_familiares || '',
      personales_patologicos: ant.personales_patologicos || '',
      personales_no_patologicos: ant.personales_no_patologicos || '',
      gineco_obstetricos: ant.gineco_obstetricos || '',
      alergias: Array.isArray(ant.alergias) ? ant.alergias : [],
    },
    padecimientoActual: record?.padecimiento_actual || '',
    exploracionFisica: record?.exploracion_fisica || '',
    diagnosticoCIE10: record?.diagnostico_cie10 || '',
    diagnosticoDescripcion: record?.diagnostico_descripcion || '',
    pronostico: record?.pronostico || '',
    medicamentos: Array.isArray(record?.tratamiento) ? record.tratamiento : [],
    indicacionesGenerales: record?.indicaciones_generales || '',
    notasPrivadas: record?.notas_privadas || '',
    medicoNombre: record?.medico_nombre || '',
    medicoCedula: record?.medico_cedula || '',
    medicoEspecialidad: record?.medico_especialidad || '',
  })
}

export function isStepVisible(stepId: StepId, form: FormState): boolean {
  if (stepId === 'antecedentes') return form.tipoConsulta === 'primera_vez'
  return true
}

export function visibleSteps(form: FormState): StepId[] {
  return STEP_ORDER.filter((s) => isStepVisible(s, form))
}

export function clampStepIndex(index: number, form: FormState): number {
  const last = visibleSteps(form).length - 1
  if (Number.isNaN(index) || index < 0) return 0
  if (index > last) return last
  return index
}

// Rangos de plausibilidad: solo marcan valores físicamente imposibles o
// claramente tecleados mal, no "anormales" (un médico registra lecturas reales).
const VITAL_RANGES: Record<
  keyof FormState['signosVitales'],
  { min: number; max: number; label: string }
> = {
  presion_arterial_sistolica: { min: 40, max: 300, label: 'Presión sistólica' },
  presion_arterial_diastolica: { min: 20, max: 200, label: 'Presión diastólica' },
  frecuencia_cardiaca: { min: 20, max: 300, label: 'Frecuencia cardíaca' },
  frecuencia_respiratoria: { min: 4, max: 80, label: 'Frecuencia respiratoria' },
  temperatura: { min: 30, max: 45, label: 'Temperatura' },
  peso: { min: 0.3, max: 500, label: 'Peso' },
  talla: { min: 20, max: 260, label: 'Talla' },
  saturacion_oxigeno: { min: 40, max: 100, label: 'Saturación O₂' },
}

function validateSignos(form: FormState): StepErrors {
  const errors: StepErrors = {}
  ;(Object.keys(VITAL_RANGES) as Array<keyof FormState['signosVitales']>).forEach((key) => {
    const raw = form.signosVitales[key]
    if (raw === '' || raw === null || raw === undefined) return
    const n = Number(raw)
    const { min, max, label } = VITAL_RANGES[key]
    if (Number.isNaN(n) || n < min || n > max) {
      errors[key] = `${label} fuera de rango (${min}–${max})`
    }
  })
  return errors
}

function validateDiagnostico(form: FormState): StepErrors {
  const errors: StepErrors = {}
  if (!form.padecimientoActual.trim()) {
    errors.padecimiento_actual = 'El padecimiento actual es obligatorio'
  }
  if (!form.diagnosticoCIE10.trim() && !form.diagnosticoDescripcion.trim()) {
    errors.diagnostico = 'Selecciona un código CIE-10 o escribe una descripción'
  }
  return errors
}

function validateTratamiento(form: FormState): StepErrors {
  const errors: StepErrors = {}
  form.medicamentos.forEach((med, i) => {
    if (!med.nombre.trim()) {
      errors[`med_nombre_${i}`] = 'El nombre del medicamento es obligatorio'
    }
  })
  return errors
}

function validateRevision(form: FormState): StepErrors {
  const errors: StepErrors = {}
  if (!form.medicoNombre.trim()) {
    errors.medico_nombre = 'El nombre del médico tratante es obligatorio'
  }
  return errors
}

export function validateStep(stepId: StepId, form: FormState): StepErrors {
  switch (stepId) {
    case 'signos':
      return validateSignos(form)
    case 'diagnostico':
      return validateDiagnostico(form)
    case 'tratamiento':
      return validateTratamiento(form)
    case 'revision':
      return validateRevision(form)
    case 'tipo':
    case 'antecedentes':
    default:
      return {}
  }
}

export function isStepValid(stepId: StepId, form: FormState): boolean {
  return Object.keys(validateStep(stepId, form)).length === 0
}

/** Errores de todos los pasos visibles, agrupados por paso. */
export function validateAll(form: FormState): Partial<Record<StepId, StepErrors>> {
  const out: Partial<Record<StepId, StepErrors>> = {}
  visibleSteps(form).forEach((s) => {
    const errs = validateStep(s, form)
    if (Object.keys(errs).length > 0) out[s] = errs
  })
  return out
}

function toNumberOrNull(raw: string): number | null {
  if (raw === '' || raw === null || raw === undefined) return null
  const n = parseFloat(raw)
  return Number.isNaN(n) ? null : n
}

export function buildPayload(form: FormState, patientId: string): CreateMedicalRecordDTO {
  return {
    patient_id: patientId,
    tipo_consulta: form.tipoConsulta,
    signos_vitales: {
      presion_arterial_sistolica: toNumberOrNull(form.signosVitales.presion_arterial_sistolica),
      presion_arterial_diastolica: toNumberOrNull(form.signosVitales.presion_arterial_diastolica),
      frecuencia_cardiaca: toNumberOrNull(form.signosVitales.frecuencia_cardiaca),
      frecuencia_respiratoria: toNumberOrNull(form.signosVitales.frecuencia_respiratoria),
      temperatura: toNumberOrNull(form.signosVitales.temperatura),
      peso: toNumberOrNull(form.signosVitales.peso),
      talla: toNumberOrNull(form.signosVitales.talla),
      saturacion_oxigeno: toNumberOrNull(form.signosVitales.saturacion_oxigeno),
    },
    antecedentes: form.tipoConsulta === 'primera_vez' ? form.antecedentes : undefined,
    padecimiento_actual: form.padecimientoActual,
    exploracion_fisica: form.exploracionFisica,
    diagnostico_cie10: form.diagnosticoCIE10,
    diagnostico_descripcion: form.diagnosticoDescripcion,
    pronostico: form.pronostico,
    tratamiento: form.medicamentos,
    indicaciones_generales: form.indicacionesGenerales,
    notas_privadas: form.notasPrivadas,
    medico_nombre: form.medicoNombre,
    medico_cedula: form.medicoCedula,
    medico_especialidad: form.medicoEspecialidad,
  }
}
