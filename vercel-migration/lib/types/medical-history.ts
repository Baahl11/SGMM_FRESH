/**
 * TypeScript Types for Medical History (NOM-004-SSA3-2012)
 * Created: 2024-11-04
 * Purpose: Complete electronic medical record per Mexican standard
 */

// ============================================
// DEMOGRAPHIC DATA (extends patients table)
// ============================================

export type EstadoCivil = 'soltero' | 'casado' | 'viudo' | 'divorciado' | 'union_libre';

export interface PatientDemographics {
  domicilio?: string;
  estado_civil?: EstadoCivil;
  ocupacion?: string;
  lugar_nacimiento?: string;
  religion?: string;
}

// ============================================
// MEDICAL HISTORY
// ============================================

export interface MedicalHistory {
  id: string;
  patient_id: string;
  user_id: string;
  
  // Antecedentes Heredo-Familiares
  antecedentes_heredofamiliares?: string;
  diabetes_familiar: boolean;
  hipertension_familiar: boolean;
  cancer_familiar: boolean;
  cardiopatias_familiar: boolean;
  otros_familiares?: string;
  
  // Antecedentes Personales No Patológicos
  tabaquismo: boolean;
  tabaquismo_detalles?: string;
  alcoholismo: boolean;
  alcoholismo_detalles?: string;
  drogas: boolean;
  drogas_detalles?: string;
  ejercicio?: string;
  alimentacion?: string;
  higiene?: string;
  
  // Antecedentes Personales Patológicos
  antecedentes_patologicos?: string;
  hospitalizaciones_previas?: string;
  cirugias_previas?: string;
  traumatismos?: string;
  transfusiones?: string;
  
  // Antecedentes Gineco-Obstétricos (si aplica)
  menarca?: number;
  gestaciones?: number;
  partos?: number;
  cesareas?: number;
  abortos?: number;
  fum?: string; // Fecha de última menstruación (ISO date string)
  metodo_anticonceptivo?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CreateMedicalHistoryDTO {
  patient_id: string;
  user_id: string;
  
  // Antecedentes Heredo-Familiares
  antecedentes_heredofamiliares?: string;
  diabetes_familiar?: boolean;
  hipertension_familiar?: boolean;
  cancer_familiar?: boolean;
  cardiopatias_familiar?: boolean;
  otros_familiares?: string;
  
  // Antecedentes Personales No Patológicos
  tabaquismo?: boolean;
  tabaquismo_detalles?: string;
  alcoholismo?: boolean;
  alcoholismo_detalles?: string;
  drogas?: boolean;
  drogas_detalles?: string;
  ejercicio?: string;
  alimentacion?: string;
  higiene?: string;
  
  // Antecedentes Personales Patológicos
  antecedentes_patologicos?: string;
  hospitalizaciones_previas?: string;
  cirugias_previas?: string;
  traumatismos?: string;
  transfusiones?: string;
  
  // Antecedentes Gineco-Obstétricos
  menarca?: number;
  gestaciones?: number;
  partos?: number;
  cesareas?: number;
  abortos?: number;
  fum?: string;
  metodo_anticonceptivo?: string;
}

export interface UpdateMedicalHistoryDTO extends Partial<CreateMedicalHistoryDTO> {
  // All fields optional for partial updates
}

// ============================================
// ALLERGIES
// ============================================

export type TipoAlergia = 'medicamento' | 'alimento' | 'ambiental' | 'otro';
export type SeveridadAlergia = 'leve' | 'moderada' | 'severa' | 'anafilaxia';

export interface PatientAllergy {
  id: string;
  patient_id: string;
  user_id: string;
  tipo_alergia: TipoAlergia;
  alergeno: string;
  reaccion?: string;
  severidad?: SeveridadAlergia;
  notas?: string;
  fecha_descubrimiento?: string; // ISO date string
  created_at: string;
  updated_at: string;
}

export interface CreateAllergyDTO {
  patient_id: string;
  user_id: string;
  tipo_alergia: TipoAlergia;
  alergeno: string;
  reaccion?: string;
  severidad?: SeveridadAlergia;
  notas?: string;
  fecha_descubrimiento?: string;
}

export interface UpdateAllergyDTO extends Partial<Omit<CreateAllergyDTO, 'patient_id' | 'user_id'>> {
  // All fields optional except patient_id and user_id
}

// ============================================
// CURRENT MEDICATIONS
// ============================================

export interface CurrentMedication {
  id: string;
  patient_id: string;
  user_id: string;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  via_administracion?: string;
  indicacion?: string;
  fecha_inicio?: string; // ISO date string
  fecha_fin?: string; // ISO date string
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMedicationDTO {
  patient_id: string;
  user_id: string;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  via_administracion?: string;
  indicacion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo?: boolean;
}

export interface UpdateMedicationDTO extends Partial<Omit<CreateMedicationDTO, 'patient_id' | 'user_id'>> {
  // All fields optional except patient_id and user_id
}

// ============================================
// HELPER TYPES & CONFIGS
// ============================================

export const TIPO_ALERGIA_OPTIONS: Array<{ value: TipoAlergia; label: string; icon: string }> = [
  { value: 'medicamento', label: 'Medicamento', icon: '💊' },
  { value: 'alimento', label: 'Alimento', icon: '🍎' },
  { value: 'ambiental', label: 'Ambiental', icon: '🌿' },
  { value: 'otro', label: 'Otro', icon: '⚠️' },
];

export const SEVERIDAD_ALERGIA_OPTIONS: Array<{ value: SeveridadAlergia; label: string; color: string }> = [
  { value: 'leve', label: 'Leve', color: 'text-green-600' },
  { value: 'moderada', label: 'Moderada', color: 'text-yellow-600' },
  { value: 'severa', label: 'Severa', color: 'text-orange-600' },
  { value: 'anafilaxia', label: 'Anafilaxia', color: 'text-red-600' },
];

export const ESTADO_CIVIL_OPTIONS: Array<{ value: EstadoCivil; label: string }> = [
  { value: 'soltero', label: 'Soltero/a' },
  { value: 'casado', label: 'Casado/a' },
  { value: 'union_libre', label: 'Unión Libre' },
  { value: 'divorciado', label: 'Divorciado/a' },
  { value: 'viudo', label: 'Viudo/a' },
];

// ============================================
// VALIDATION HELPERS
// ============================================

export function validateMedicalHistory(data: Partial<CreateMedicalHistoryDTO>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.patient_id) {
    errors.push('patient_id es requerido');
  }
  
  if (!data.user_id) {
    errors.push('user_id es requerido');
  }
  
  if (data.menarca && (data.menarca < 8 || data.menarca > 20)) {
    errors.push('Menarca debe estar entre 8 y 20 años');
  }
  
  if (data.gestaciones && data.gestaciones < 0) {
    errors.push('Gestaciones no puede ser negativo');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAllergy(data: Partial<CreateAllergyDTO>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.patient_id) {
    errors.push('patient_id es requerido');
  }
  
  if (!data.user_id) {
    errors.push('user_id es requerido');
  }
  
  if (!data.tipo_alergia) {
    errors.push('tipo_alergia es requerido');
  }
  
  if (!data.alergeno || data.alergeno.trim().length === 0) {
    errors.push('alergeno es requerido');
  }
  
  if (data.alergeno && data.alergeno.length > 200) {
    errors.push('alergeno no puede exceder 200 caracteres');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateMedication(data: Partial<CreateMedicationDTO>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.patient_id) {
    errors.push('patient_id es requerido');
  }
  
  if (!data.user_id) {
    errors.push('user_id es requerido');
  }
  
  if (!data.medicamento || data.medicamento.trim().length === 0) {
    errors.push('medicamento es requerido');
  }
  
  if (!data.dosis || data.dosis.trim().length === 0) {
    errors.push('dosis es requerida');
  }
  
  if (!data.frecuencia || data.frecuencia.trim().length === 0) {
    errors.push('frecuencia es requerida');
  }
  
  if (data.medicamento && data.medicamento.length > 200) {
    errors.push('medicamento no puede exceder 200 caracteres');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// DISPLAY HELPERS
// ============================================

export function getTipoAlergiaLabel(tipo: TipoAlergia): string {
  return TIPO_ALERGIA_OPTIONS.find(opt => opt.value === tipo)?.label || tipo;
}

export function getSeveridadAlergiaColor(severidad?: SeveridadAlergia): string {
  if (!severidad) return 'text-gray-600';
  return SEVERIDAD_ALERGIA_OPTIONS.find(opt => opt.value === severidad)?.color || 'text-gray-600';
}

export function getEstadoCivilLabel(estado?: EstadoCivil): string {
  if (!estado) return 'No especificado';
  return ESTADO_CIVIL_OPTIONS.find(opt => opt.value === estado)?.label || estado;
}
