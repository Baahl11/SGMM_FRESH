// ============================================
// Quick Phrases Types & Constants
// ============================================

/**
 * Context: Where the quick phrase is used
 */
export type QuickPhraseContext = 'medical_record' | 'treatment' | 'both';

/**
 * Categories for medical record phrases
 */
export type MedicalRecordCategory =
  | 'motivo_consulta'      // Chief complaint / reason for visit
  | 'exploracion'          // Physical examination
  | 'diagnostico'          // Diagnosis
  | 'plan_tratamiento'     // Treatment plan
  | 'indicaciones'         // Instructions to patient
  | 'evolucion'           // Progress notes / evolution
  | 'otro';               // Other

/**
 * Categories for treatment phrases
 */
export type TreatmentPhraseCategory =
  | 'descripcion'          // Service description
  | 'indicaciones'         // Indications / when to use
  | 'contraindicaciones'   // Contraindications / when NOT to use
  | 'cuidados_post'        // Post-treatment care
  | 'otro';               // Other

/**
 * Union of all possible categories
 */
export type QuickPhraseCategory = MedicalRecordCategory | TreatmentPhraseCategory;

/**
 * Main Quick Phrase interface
 */
export interface QuickPhrase {
  id: string;
  user_id: string;
  title: string;
  content: string;
  context: QuickPhraseContext;
  category: QuickPhraseCategory;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * DTO for creating a new quick phrase
 */
export interface CreateQuickPhraseDTO {
  title: string;
  content: string;
  context: QuickPhraseContext;
  category: QuickPhraseCategory;
}

/**
 * DTO for updating a quick phrase
 */
export interface UpdateQuickPhraseDTO {
  title?: string;
  content?: string;
  context?: QuickPhraseContext;
  category?: QuickPhraseCategory;
}

// ============================================
// Medical Record Categories Configuration
// ============================================

export const MEDICAL_RECORD_CATEGORIES = [
  {
    value: 'motivo_consulta' as const,
    label: 'Motivo de Consulta',
    icon: '🩺',
    description: 'Razón de la visita del paciente',
    color: 'blue'
  },
  {
    value: 'exploracion' as const,
    label: 'Exploración Física',
    icon: '🔍',
    description: 'Hallazgos del examen físico',
    color: 'purple'
  },
  {
    value: 'diagnostico' as const,
    label: 'Diagnóstico',
    icon: '📋',
    description: 'Diagnóstico clínico',
    color: 'red'
  },
  {
    value: 'plan_tratamiento' as const,
    label: 'Plan de Tratamiento',
    icon: '💊',
    description: 'Tratamiento prescrito',
    color: 'green'
  },
  {
    value: 'indicaciones' as const,
    label: 'Indicaciones al Paciente',
    icon: '📝',
    description: 'Instrucciones y recomendaciones',
    color: 'amber'
  },
  {
    value: 'evolucion' as const,
    label: 'Evolución',
    icon: '📈',
    description: 'Notas de seguimiento',
    color: 'cyan'
  },
  {
    value: 'otro' as const,
    label: 'Otro',
    icon: '📄',
    description: 'Otras notas médicas',
    color: 'gray'
  }
] as const;

// ============================================
// Treatment Categories Configuration
// ============================================

export const TREATMENT_PHRASE_CATEGORIES = [
  {
    value: 'descripcion' as const,
    label: 'Descripción del Servicio',
    icon: '📄',
    description: 'Descripción general del tratamiento',
    color: 'blue'
  },
  {
    value: 'indicaciones' as const,
    label: 'Indicaciones',
    icon: '✅',
    description: 'Cuándo está indicado el tratamiento',
    color: 'green'
  },
  {
    value: 'contraindicaciones' as const,
    label: 'Contraindicaciones',
    icon: '⚠️',
    description: 'Cuándo NO aplicar el tratamiento',
    color: 'red'
  },
  {
    value: 'cuidados_post' as const,
    label: 'Cuidados Post-Tratamiento',
    icon: '💚',
    description: 'Cuidados después del procedimiento',
    color: 'emerald'
  },
  {
    value: 'otro' as const,
    label: 'Otro',
    icon: '📋',
    description: 'Otras notas del tratamiento',
    color: 'gray'
  }
] as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Get category configuration for medical records
 */
export function getMedicalRecordCategoryConfig(category: MedicalRecordCategory) {
  return MEDICAL_RECORD_CATEGORIES.find(c => c.value === category) || MEDICAL_RECORD_CATEGORIES[6]; // default to 'otro'
}

/**
 * Get category configuration for treatments
 */
export function getTreatmentPhraseCategoryConfig(category: TreatmentPhraseCategory) {
  return TREATMENT_PHRASE_CATEGORIES.find(c => c.value === category) || TREATMENT_PHRASE_CATEGORIES[4]; // default to 'otro'
}

/**
 * Get category config based on context
 */
export function getCategoryConfig(context: QuickPhraseContext, category: QuickPhraseCategory) {
  if (context === 'medical_record') {
    return getMedicalRecordCategoryConfig(category as MedicalRecordCategory);
  } else {
    return getTreatmentPhraseCategoryConfig(category as TreatmentPhraseCategory);
  }
}

/**
 * Get Tailwind color classes for category badge
 */
export function getCategoryColorClasses(color: string) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-950',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-950',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800'
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-950',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-950',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800'
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-950',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800'
    },
    cyan: {
      bg: 'bg-cyan-100 dark:bg-cyan-950',
      text: 'text-cyan-700 dark:text-cyan-300',
      border: 'border-cyan-200 dark:border-cyan-800'
    },
    emerald: {
      bg: 'bg-emerald-100 dark:bg-emerald-950',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800'
    },
    gray: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700'
    }
  };

  return colorMap[color] || colorMap.gray;
}

/**
 * Validate quick phrase data
 */
export function validateQuickPhrase(data: Partial<CreateQuickPhraseDTO>): string[] {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('El título es requerido');
  }
  if (data.title && data.title.length > 100) {
    errors.push('El título no puede exceder 100 caracteres');
  }

  if (!data.content || data.content.trim().length === 0) {
    errors.push('El contenido es requerido');
  }
  if (data.content && data.content.length > 5000) {
    errors.push('El contenido no puede exceder 5000 caracteres');
  }

  if (!data.context || !['medical_record', 'treatment', 'both'].includes(data.context)) {
    errors.push('Contexto inválido');
  }

  if (!data.category) {
    errors.push('La categoría es requerida');
  }

  return errors;
}
