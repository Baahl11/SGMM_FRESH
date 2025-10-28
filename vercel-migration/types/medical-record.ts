// Tipos para expediente clínico según NOM-004-SSA3-2012

export type TipoConsulta = 'primera_vez' | 'evolucion' | 'interconsulta';

export interface SignosVitales {
  presion_arterial_sistolica: number | null;
  presion_arterial_diastolica: number | null;
  frecuencia_cardiaca: number | null;
  frecuencia_respiratoria: number | null;
  temperatura: number | null;
  peso: number | null;
  talla: number | null;
  saturacion_oxigeno: number | null;
}

export interface Antecedentes {
  heredo_familiares: string | null;
  personales_patologicos: string | null;
  personales_no_patologicos: string | null;
  gineco_obstetricos: string | null;
  alergias: string[];
}

export interface Medicamento {
  nombre: string;
  dosis: string;
  via: string; // oral, intravenosa, intramuscular, subcutánea, tópica
  frecuencia: string; // cada 8 hrs, cada 12 hrs, cada 24 hrs
  duracion: string; // 7 días, 14 días, continuo
}

export interface ArchivoAdjunto {
  url: string;
  nombre: string;
  tipo: 'laboratorio' | 'imagen' | 'estudio' | 'otro';
  fecha: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  user_id: string;
  tipo_consulta: TipoConsulta;
  fecha_consulta: string;
  signos_vitales: SignosVitales;
  antecedentes: Antecedentes;
  padecimiento_actual: string | null;
  exploracion_fisica: string | null;
  diagnostico_cie10: string | null;
  diagnostico_descripcion: string | null;
  pronostico: string | null;
  tratamiento: Medicamento[];
  indicaciones_generales: string | null;
  medico_nombre: string;
  medico_cedula: string | null;
  medico_especialidad: string | null;
  archivos_adjuntos: ArchivoAdjunto[];
  notas_privadas: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMedicalRecordDTO {
  patient_id: string;
  tipo_consulta: TipoConsulta;
  fecha_consulta?: string;
  signos_vitales: Partial<SignosVitales>;
  antecedentes?: Partial<Antecedentes>;
  padecimiento_actual?: string;
  exploracion_fisica?: string;
  diagnostico_cie10?: string;
  diagnostico_descripcion?: string;
  pronostico?: string;
  tratamiento?: Medicamento[];
  indicaciones_generales?: string;
  medico_nombre: string;
  medico_cedula?: string;
  medico_especialidad?: string;
  archivos_adjuntos?: ArchivoAdjunto[];
  notas_privadas?: string;
}

// Códigos CIE-10 más comunes (para autocompletado)
export interface DiagnosticoCIE10 {
  codigo: string;
  descripcion: string;
  categoria: string;
}

export const diagnosticosComunes: DiagnosticoCIE10[] = [
  { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)', categoria: 'Cardiovascular' },
  { codigo: 'E11', descripcion: 'Diabetes mellitus tipo 2', categoria: 'Endocrino' },
  { codigo: 'E78.5', descripcion: 'Hiperlipidemia no especificada', categoria: 'Endocrino' },
  { codigo: 'J06.9', descripcion: 'Infección aguda de las vías respiratorias superiores', categoria: 'Respiratorio' },
  { codigo: 'K29.7', descripcion: 'Gastritis no especificada', categoria: 'Digestivo' },
  { codigo: 'M79.3', descripcion: 'Paniculitis no especificada', categoria: 'Musculoesquelético' },
  { codigo: 'R51', descripcion: 'Cefalea', categoria: 'Síntomas' },
  { codigo: 'R10.4', descripcion: 'Otros dolores abdominales y los no especificados', categoria: 'Síntomas' },
  { codigo: 'Z00.0', descripcion: 'Examen médico general', categoria: 'Preventivo' },
  { codigo: 'Z23', descripcion: 'Necesidad de inmunización', categoria: 'Preventivo' },
  { codigo: 'E66.9', descripcion: 'Obesidad no especificada', categoria: 'Endocrino' },
  { codigo: 'F41.9', descripcion: 'Trastorno de ansiedad no especificado', categoria: 'Mental' },
  { codigo: 'M25.5', descripcion: 'Dolor articular', categoria: 'Musculoesquelético' },
  { codigo: 'J00', descripcion: 'Rinofaringitis aguda (resfriado común)', categoria: 'Respiratorio' },
  { codigo: 'A09', descripcion: 'Diarrea y gastroenteritis de presunto origen infeccioso', categoria: 'Infeccioso' },
];
