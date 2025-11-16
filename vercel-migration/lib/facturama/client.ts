// Facturama API Client
// Documentation: https://api.facturama.mx/docs

import { FacturamaInvoiceResponse } from '@/lib/types/facturama';
import { decryptDatabaseField } from '@/lib/crypto/encryption';

const FACTURAMA_API_SANDBOX = 'https://apisandbox.facturama.mx';
const FACTURAMA_API_PRODUCTION = 'https://api.facturama.mx';

interface FacturamaCredentials {
  api_user: string;
  api_password_encrypted: string;
  api_password_iv?: string | null;
  api_password_tag?: string | null;
  is_sandbox: boolean;
}

interface FacturamaInvoiceItem {
  ProductCode: string; // Clave SAT (ej: 85121800 - Servicios dentales)
  IdentificationNumber?: string;
  Description: string;
  Unit: string; // Clave SAT unidad (ej: E48 - Servicio)
  UnitCode: string; // Código SAT (ej: E48)
  UnitPrice: number;
  Quantity: number;
  Subtotal: number;
  TaxObject: string; // '02' = Sí objeto de impuesto
  Taxes?: Array<{
    Name: string;
    Rate: number;
    Total: number;
    Base: number;
    IsRetention: boolean;
  }>;
  Total: number;
}

interface FacturamaReceiver {
  Rfc: string;
  Name: string;
  CfdiUse: string;
  FiscalRegime: string;
  TaxZipCode: string;
  Email?: string;
}

interface FacturamaInvoicePayload {
  Serie?: string;
  Currency: string;
  ExpeditionPlace: string; // Código postal del emisor
  PaymentConditions?: string;
  CfdiType: string; // 'I' = Ingreso
  PaymentForm: string; // 01, 03, 04, etc.
  PaymentMethod: string; // PUE, PPD
  Receiver: FacturamaReceiver;
  Items: FacturamaInvoiceItem[];
  ObservationsNotes?: string;
}

class FacturamaClient {
  private credentials: FacturamaCredentials;
  private baseUrl: string;
  private apiPassword: string; // Decrypted password (kept in memory only)

  constructor(credentials: FacturamaCredentials) {
    this.credentials = credentials;
    this.baseUrl = credentials.is_sandbox
      ? FACTURAMA_API_SANDBOX
      : FACTURAMA_API_PRODUCTION;
    
    // Decrypt password on initialization
    this.apiPassword = decryptDatabaseField(
      credentials.api_password_encrypted,
      credentials.api_password_iv || null,
      credentials.api_password_tag || null
    );
  }

  private getAuthHeaders(): HeadersInit {
    const auth = Buffer.from(
      `${this.credentials.api_user}:${this.apiPassword}`
    ).toString('base64');

    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Test connection to Facturama API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[FacturamaClient] Testing connection to:', this.baseUrl);
      console.log('[FacturamaClient] Using user:', this.credentials.api_user);
      console.log('[FacturamaClient] Password length:', this.apiPassword?.length || 0);
      console.log('[FacturamaClient] Is sandbox:', this.credentials.is_sandbox);
      
      const authString = `${this.credentials.api_user}:${this.apiPassword}`;
      const base64Auth = Buffer.from(authString).toString('base64');
      console.log('[FacturamaClient] Base64 auth length:', base64Auth.length);
      console.log('[FacturamaClient] Auth starts with:', base64Auth.substring(0, 20) + '...');
      
      const response = await fetch(`${this.baseUrl}/Catalogs/ProductsOrServices?keyword=dental`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      console.log('[FacturamaClient] Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorDetail;
        try {
          const errorText = await response.text();
          console.error('[FacturamaClient] Error response:', errorText);
          errorDetail = errorText;
        } catch (e) {
          errorDetail = `Status ${response.status}: ${response.statusText}`;
        }
        
        return { 
          success: false, 
          error: `Error ${response.status}: ${errorDetail}` 
        };
      }

      console.log('[FacturamaClient] Connection successful');
      return { success: true };
    } catch (error) {
      console.error('[FacturamaClient] Connection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      };
    }
  }

  /**
   * Create and stamp a CFDI (Comprobante Fiscal Digital por Internet)
   */
  async createInvoice(payload: FacturamaInvoicePayload): Promise<FacturamaInvoiceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/3/cfdis`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Facturama API Error:', errorText);
        throw new Error(`Facturama API Error: ${errorText}`);
      }

      const data = await response.json();
      return data as FacturamaInvoiceResponse;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Download XML file for a stamped invoice
   */
  async downloadXML(facturamaId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/cfdi/xml/issuedLite/${facturamaId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to download XML: ${response.statusText}`);
      }

      const xml = await response.text();
      return xml;
    } catch (error) {
      console.error('Error downloading XML:', error);
      throw error;
    }
  }

  /**
   * Download PDF file for a stamped invoice
   */
  async downloadPDF(facturamaId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/cfdi/pdf/issuedLite/${facturamaId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Cancel an invoice (requires cancellation motive)
   */
  async cancelInvoice(
    facturamaId: string,
    motive: '01' | '02' | '03' | '04', // SAT cancellation motives
    uuidReplacement?: string // Required for motive 01
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const payload: any = {
        motive,
      };

      if (motive === '01' && uuidReplacement) {
        payload.uuidReplacement = uuidReplacement;
      }

      const response = await fetch(`${this.baseUrl}/Cfdi?cfdiType=issued&cfdiId=${facturamaId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cancellation failed',
      };
    }
  }

  /**
   * Send invoice by email through Facturama
   */
  async sendInvoiceByEmail(facturamaId: string, email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/Cfdi?cfdiType=issued&cfdiId=${facturamaId}&email=${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email send failed',
      };
    }
  }

  /**
   * Get invoice details
   */
  async getInvoice(facturamaId: string): Promise<FacturamaInvoiceResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/Cfdi/issued/${facturamaId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.error('Failed to get invoice:', response.statusText);
        return null;
      }

      const data = await response.json();
      return data as FacturamaInvoiceResponse;
    } catch (error) {
      console.error('Error getting invoice:', error);
      return null;
    }
  }
}

/**
 * Helper function to build invoice items from treatment records
 */
export function buildInvoiceItems(
  records: Array<{
    id: string;
    treatment_name: string;
    price: number;
    cantidad?: number;
  }>,
  includeIVA: boolean = true
): FacturamaInvoiceItem[] {
  const IVA_RATE = 0.16;

  return records.map((record) => {
    const quantity = record.cantidad || 1;
    const unitPrice = record.price;
    const subtotal = unitPrice * quantity;
    const iva = includeIVA ? subtotal * IVA_RATE : 0;
    const total = subtotal + iva;

    const item: FacturamaInvoiceItem = {
      ProductCode: '85121800', // Servicios dentales (ajustar según tipo de servicio)
      Description: record.treatment_name,
      Unit: 'Servicio',
      UnitCode: 'E48', // Unidad de servicio
      UnitPrice: unitPrice,
      Quantity: quantity,
      Subtotal: subtotal,
      TaxObject: includeIVA ? '02' : '01', // 02 = Sí objeto de impuesto, 01 = No objeto de impuesto
      Total: total,
    };

    if (includeIVA) {
      item.Taxes = [
        {
          Name: '002', // IVA
          Rate: IVA_RATE,
          Total: iva,
          Base: subtotal,
          IsRetention: false,
        },
      ];
    }

    return item;
  });
}

/**
 * SAT Cancellation Motives
 */
export const SAT_CANCELLATION_MOTIVES = {
  '01': 'Comprobante emitido con errores con relación',
  '02': 'Comprobante emitido con errores sin relación',
  '03': 'No se llevó a cabo la operación',
  '04': 'Operación nominativa relacionada en una factura global',
} as const;

export default FacturamaClient;
