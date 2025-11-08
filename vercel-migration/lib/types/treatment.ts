/**
 * Type definitions for the Treatments module
 * Centralized types to avoid duplication across components
 */

/**
 * Treatment categories
 * These match the database values and UI labels
 */
export type TreatmentCategory = 
  | 'consulta'
  | 'procedimiento'
  | 'estetico'
  | 'laboratorio'
  | 'dental'
  | 'especialidad'
  | 'otro';

/**
 * Category configuration with icons and colors
 */
export interface CategoryConfig {
  value: TreatmentCategory;
  label: string;
  icon: string;
  color: string; // Tailwind color class
}

/**
 * Available treatment categories with their UI configuration
 */
export const TREATMENT_CATEGORIES: CategoryConfig[] = [
  {
    value: 'consulta',
    label: 'Consulta General',
    icon: '🩺',
    color: 'blue'
  },
  {
    value: 'procedimiento',
    label: 'Procedimientos',
    icon: '💉',
    color: 'purple'
  },
  {
    value: 'estetico',
    label: 'Tratamientos Estéticos',
    icon: '💊',
    color: 'pink'
  },
  {
    value: 'laboratorio',
    label: 'Estudios/Laboratorio',
    icon: '🧪',
    color: 'green'
  },
  {
    value: 'dental',
    label: 'Dental',
    icon: '🦷',
    color: 'cyan'
  },
  {
    value: 'especialidad',
    label: 'Especialidades',
    icon: '🧠',
    color: 'indigo'
  },
  {
    value: 'otro',
    label: 'Otros',
    icon: '📋',
    color: 'gray'
  }
];

/**
 * Main Treatment interface
 * Matches the database schema
 */
export interface Treatment {
  id: string | number;
  nombre: string;
  descripcion?: string | null;
  precio_base?: number;
  costo_unitario?: number;
  precio?: number; // Alias for precio_base
  duracion_minutos?: number;
  activo?: boolean;
  category?: TreatmentCategory | null;
  tags?: string[] | null;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Treatment form data
 * Used for creating/updating treatments
 */
export interface TreatmentFormData {
  nombre: string;
  descripcion?: string;
  precio_base: number;
  costo_unitario?: number;
  duracion_minutos?: number;
  activo?: boolean;
  category?: TreatmentCategory | null;
  tags?: string[];
}

/**
 * Helper function to get category configuration
 */
export function getCategoryConfig(category: TreatmentCategory | null | undefined): CategoryConfig | null {
  if (!category) return null;
  return TREATMENT_CATEGORIES.find(c => c.value === category) || null;
}

/**
 * Helper function to get color classes for a category
 */
export function getCategoryColorClasses(category: TreatmentCategory | null | undefined): {
  bg: string;
  text: string;
  border: string;
} {
  const config = getCategoryConfig(category);
  if (!config) {
    return {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-600'
    };
  }
  
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-600'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-300 dark:border-purple-600'
    },
    pink: {
      bg: 'bg-pink-100 dark:bg-pink-900/30',
      text: 'text-pink-700 dark:text-pink-300',
      border: 'border-pink-300 dark:border-pink-600'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-300 dark:border-green-600'
    },
    cyan: {
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      text: 'text-cyan-700 dark:text-cyan-300',
      border: 'border-cyan-300 dark:border-cyan-600'
    },
    indigo: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-300 dark:border-indigo-600'
    },
    gray: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-600'
    }
  };
  
  return colorMap[config.color] || colorMap.gray;
}
