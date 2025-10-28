// Facturama Integration Types

// ===== Configuration =====
export interface FacturamaConfig {
  id: string;
  user_id: string;
  api_user: string;
  api_password_encrypted: string;
  is_sandbox: boolean;
  emisor_rfc: string;
  emisor_razon_social: string;
  emisor_regimen_fiscal: string;
  emisor_codigo_postal: string;
  certificate_cer_url?: string;
  certificate_key_url?: string;
  certificate_password_encrypted?: string;
  emisor_email?: string;
  emisor_telefono?: string;
  emisor_direccion?: string;
  emisor_ciudad?: string;
  emisor_estado?: string;
  serie_default: string;
  folio_inicial: number;
  auto_send_email: boolean;
  is_active: boolean;
  is_configured: boolean;
  last_validated_at?: string;
  validation_error?: string;
  created_at: string;
  updated_at: string;
}

export interface FacturamaConfigInput {
  api_user: string;
  api_password: string; // Plain password (will be encrypted)
  is_sandbox: boolean;
  emisor_rfc: string;
  emisor_razon_social: string;
  emisor_regimen_fiscal: string;
  emisor_codigo_postal: string;
  emisor_email?: string;
  emisor_telefono?: string;
  emisor_direccion?: string;
  emisor_ciudad?: string;
  emisor_estado?: string;
  serie_default?: string;
  folio_inicial?: number;
  auto_send_email?: boolean;
}

// ===== Patient Fiscal Data =====
export interface PatientFiscalData {
  id: string;
  patient_id: string;
  rfc: string;
  razon_social: string;
  regimen_fiscal: string;
  codigo_postal: string;
  uso_cfdi: string;
  email_facturacion?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  pais: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientFiscalDataInput {
  patient_id: string;
  rfc: string;
  razon_social: string;
  regimen_fiscal: string;
  codigo_postal: string;
  uso_cfdi?: string;
  email_facturacion?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  is_default?: boolean;
}

// ===== Invoices =====
export interface Invoice {
  id: string;
  patient_id: string;
  fiscal_data_id: string;
  facturama_id?: string;
  folio_number?: string;
  serie?: string;
  uuid?: string;
  fecha_emision: string;
  fecha_timbrado?: string;
  subtotal: number;
  iva: number;
  total: number;
  moneda: string;
  tipo_comprobante: string;
  forma_pago: string;
  metodo_pago: string;
  xml_url?: string;
  pdf_url?: string;
  status: InvoiceStatus;
  cancelled_at?: string;
  cancellation_reason?: string;
  emailed_at?: string;
  notas?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relations (optional for joined queries)
  patient?: {
    id: string;
    nombre: string;
    apellido?: string;
    email?: string;
  };
  fiscal_data?: PatientFiscalData;
  invoice_records?: InvoiceRecord[];
}

export type InvoiceStatus = 'draft' | 'issued' | 'sent' | 'cancelled';

export interface InvoiceRecord {
  id: string;
  invoice_id: string;
  record_id: string;
  monto: number;
  created_at: string;
}

// ===== Facturama API Types =====

// Request to generate a CFDI
export interface FacturamaCreateInvoiceRequest {
  patient_id: string;
  fiscal_data_id: string;
  record_ids: string[]; // Treatment records to bill
  forma_pago: string; // 01, 03, 04, etc.
  metodo_pago?: string; // PUE, PPD
  notas?: string;
  send_email?: boolean;
}

// Facturama API Response (simplified)
export interface FacturamaInvoiceResponse {
  Id: string; // Facturama internal ID
  Serie: string;
  Folio: string;
  Date: string;
  CfdiType: string;
  PaymentForm: string;
  PaymentMethod: string;
  Subtotal: number;
  Total: number;
  Complement: {
    TaxStamp: {
      Uuid: string; // UUID del SAT
      Date: string;
    };
  };
}

// SAT Catalogs (partial - most common values)
export const SAT_FORMA_PAGO = {
  '01': 'Efectivo',
  '02': 'Cheque nominativo',
  '03': 'Transferencia electrónica de fondos',
  '04': 'Tarjeta de crédito',
  '28': 'Tarjeta de débito',
  '99': 'Por definir',
} as const;

export const SAT_METODO_PAGO = {
  'PUE': 'Pago en una sola exhibición',
  'PPD': 'Pago en parcialidades o diferido',
} as const;

export const SAT_USO_CFDI = {
  'G01': 'Adquisición de mercancías',
  'G02': 'Devoluciones, descuentos o bonificaciones',
  'G03': 'Gastos en general',
  'I01': 'Construcciones',
  'I02': 'Mobiliario y equipo de oficina por inversiones',
  'I03': 'Equipo de transporte',
  'I04': 'Equipo de cómputo y accesorios',
  'D01': 'Honorarios médicos, dentales y gastos hospitalarios',
  'D02': 'Gastos médicos por incapacidad o discapacidad',
  'D10': 'Pagos por servicios educativos (colegiaturas)',
  'P01': 'Por definir',
} as const;

export const SAT_REGIMEN_FISCAL = {
  '601': 'General de Ley Personas Morales',
  '603': 'Personas Morales con Fines no Lucrativos',
  '605': 'Sueldos y Salarios e Ingresos Asimilados a Salarios',
  '606': 'Arrendamiento',
  '608': 'Demás ingresos',
  '610': 'Residentes en el Extranjero sin Establecimiento Permanente en México',
  '611': 'Ingresos por Dividendos (socios y accionistas)',
  '612': 'Personas Físicas con Actividades Empresariales y Profesionales',
  '614': 'Ingresos por intereses',
  '616': 'Sin obligaciones fiscales',
  '620': 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos',
  '621': 'Incorporación Fiscal',
  '622': 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras',
  '623': 'Opcional para Grupos de Sociedades',
  '624': 'Coordinados',
  '625': 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas',
  '626': 'Régimen Simplificado de Confianza',
} as const;

// Invoice generation result
export interface InvoiceGenerationResult {
  success: boolean;
  invoice_id?: string;
  error?: string;
  xml_url?: string;
  pdf_url?: string;
  uuid?: string;
}

// Configuration validation result
export interface ConfigValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings?: string[];
}

// Certificate upload
export interface CertificateUpload {
  cer_file: File;
  key_file: File;
  password: string;
}

// Type guards
export function isInvoiceStatus(status: string): status is InvoiceStatus {
  return ['draft', 'issued', 'sent', 'cancelled'].includes(status);
}

export function isValidRFC(rfc: string): boolean {
  // Persona física: 13 caracteres (AAAA######XXX)
  // Persona moral: 12 caracteres (AAA######XXX)
  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  return rfcRegex.test(rfc.toUpperCase());
}

export function isValidCodigoPostal(cp: string): boolean {
  return /^\d{5}$/.test(cp);
}
