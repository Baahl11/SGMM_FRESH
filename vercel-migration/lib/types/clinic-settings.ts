/**
 * Types for PDF customization and branding settings
 * Used in Phase 3.1 - PDF Customization
 */

export type PDFTemplate = 'modern' | 'classic' | 'minimalist' | 'professional';

export type LogoPosition = 'left' | 'center' | 'right';

export interface ClinicSettings {
  id: string;
  user_id: string;
  
  // Logo configuration
  logo_url: string | null;
  logo_width: number;
  logo_position: LogoPosition;
  
  // Brand colors (hex format)
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  
  // Template selection
  template: PDFTemplate;
  
  // Additional styling
  font_family: string;
  show_logo: boolean;
  show_clinic_name: boolean;
  footer_text: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface ClinicSettingsInput {
  // Logo configuration
  logo_url?: string | null;
  logo_width?: number;
  logo_position?: LogoPosition;
  
  // Brand colors
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  text_color?: string;
  
  // Template
  template?: PDFTemplate;
  
  // Additional styling
  font_family?: string;
  show_logo?: boolean;
  show_clinic_name?: boolean;
  footer_text?: string | null;
}

export interface PDFTemplateDefinition {
  id: PDFTemplate;
  name: string;
  description: string;
  preview: string; // Path to preview image
  features: string[];
}

export const DEFAULT_CLINIC_SETTINGS: Omit<ClinicSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  logo_url: null,
  logo_width: 150,
  logo_position: 'left',
  primary_color: '#7C3AED', // Purple
  secondary_color: '#A78BFA', // Light purple
  accent_color: '#5B21B6', // Dark purple
  text_color: '#1F2937', // Dark gray
  template: 'modern',
  font_family: 'Inter',
  show_logo: true,
  show_clinic_name: true,
  footer_text: null,
};

export const PDF_TEMPLATES: PDFTemplateDefinition[] = [
  {
    id: 'modern',
    name: 'Moderno',
    description: 'Diseño limpio y contemporáneo con gradientes suaves',
    preview: '/templates/modern-preview.png',
    features: [
      'Header con gradiente',
      'Tipografía sans-serif',
      'Espaciado amplio',
      'Iconos modernos',
    ],
  },
  {
    id: 'classic',
    name: 'Clásico',
    description: 'Estilo tradicional y profesional para consultorios establecidos',
    preview: '/templates/classic-preview.png',
    features: [
      'Bordes elegantes',
      'Tipografía serif',
      'Layout tradicional',
      'Colores sobrios',
    ],
  },
  {
    id: 'minimalist',
    name: 'Minimalista',
    description: 'Diseño ultra-limpio enfocado en la información esencial',
    preview: '/templates/minimalist-preview.png',
    features: [
      'Sin bordes',
      'Espacios en blanco',
      'Tipografía ligera',
      'Máxima legibilidad',
    ],
  },
  {
    id: 'professional',
    name: 'Profesional',
    description: 'Balance perfecto entre moderno y formal',
    preview: '/templates/professional-preview.png',
    features: [
      'Header estructurado',
      'Tabla detallada',
      'Colores corporativos',
      'Footer informativo',
    ],
  },
];

export const COLOR_PRESETS = [
  { name: 'Morado Médico', colors: { primary: '#7C3AED', secondary: '#A78BFA', accent: '#5B21B6' } },
  { name: 'Azul Clínica', colors: { primary: '#3B82F6', secondary: '#93C5FD', accent: '#1E40AF' } },
  { name: 'Verde Salud', colors: { primary: '#10B981', secondary: '#6EE7B7', accent: '#047857' } },
  { name: 'Rojo Cardiología', colors: { primary: '#EF4444', secondary: '#FCA5A5', accent: '#B91C1C' } },
  { name: 'Naranja Energía', colors: { primary: '#F59E0B', secondary: '#FCD34D', accent: '#D97706' } },
  { name: 'Gris Corporativo', colors: { primary: '#6B7280', secondary: '#D1D5DB', accent: '#374151' } },
];

export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Sans-serif moderna)' },
  { value: 'Roboto', label: 'Roboto (Sans-serif versátil)' },
  { value: 'Open Sans', label: 'Open Sans (Sans-serif amigable)' },
  { value: 'Lato', label: 'Lato (Sans-serif profesional)' },
  { value: 'Merriweather', label: 'Merriweather (Serif clásica)' },
  { value: 'Georgia', label: 'Georgia (Serif tradicional)' },
];

export const LOGO_POSITION_OPTIONS = [
  { value: 'left' as LogoPosition, label: 'Izquierda', icon: '⬅️' },
  { value: 'center' as LogoPosition, label: 'Centro', icon: '⬆️' },
  { value: 'right' as LogoPosition, label: 'Derecha', icon: '➡️' },
];

export const MAX_LOGO_SIZE_MB = 5;
export const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];
export const LOGO_STORAGE_BUCKET = 'clinic-logos';
