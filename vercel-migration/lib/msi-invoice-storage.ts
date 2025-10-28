// MSI-compatible local storage for invoices
interface StoredInvoice {
  id: number;
  patient_id: number;
  patient_name: string;
  invoice_number: string;
  folio: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  subtotal: number;
  impuestos: number;
  total: number;
  total_amount: number;
  amount: number;
  estado: string;
  status: string;
  metodo_pago: string;
  notas: string;
  tratamientos: any[];
  concepts: any[];
  created_at: string;
  updated_at: string;
}

class MSIInvoiceStorage {
  private static readonly STORAGE_KEY = 'msi_invoices_storage';

  static saveInvoice(invoice: StoredInvoice): void {
    try {
      const existingInvoices = this.getAllInvoices();
      
      // Remove existing invoice with same ID if it exists
      const filteredInvoices = existingInvoices.filter(inv => inv.id !== invoice.id);
      
      // Add new invoice
      filteredInvoices.push(invoice);
      
      // Sort by creation date (newest first)
      filteredInvoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredInvoices));
      console.log(`✅ [MSI-STORAGE] Invoice ${invoice.invoice_number} saved locally`);
    } catch (error) {
      console.error('❌ [MSI-STORAGE] Error saving invoice:', error);
    }
  }

  static getAllInvoices(): StoredInvoice[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ [MSI-STORAGE] Error reading invoices:', error);
      return [];
    }
  }

  static getInvoicesByPatient(patientId: number): StoredInvoice[] {
    return this.getAllInvoices().filter(invoice => invoice.patient_id === patientId);
  }

  static updateInvoiceStatus(invoiceId: number, status: string): void {
    try {
      const invoices = this.getAllInvoices();
      const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);
      
      if (invoiceIndex !== -1) {
        invoices[invoiceIndex].estado = status;
        invoices[invoiceIndex].status = status;
        invoices[invoiceIndex].updated_at = new Date().toISOString();
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(invoices));
        console.log(`✅ [MSI-STORAGE] Invoice ${invoiceId} status updated to ${status}`);
      }
    } catch (error) {
      console.error('❌ [MSI-STORAGE] Error updating invoice status:', error);
    }
  }

  static deleteInvoice(invoiceId: number): void {
    try {
      const invoices = this.getAllInvoices();
      const filteredInvoices = invoices.filter(inv => inv.id !== invoiceId);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredInvoices));
      console.log(`✅ [MSI-STORAGE] Invoice ${invoiceId} deleted`);
    } catch (error) {
      console.error('❌ [MSI-STORAGE] Error deleting invoice:', error);
    }
  }

  static clearAll(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ [MSI-STORAGE] All invoices cleared');
    } catch (error) {
      console.error('❌ [MSI-STORAGE] Error clearing invoices:', error);
    }
  }
}

export default MSIInvoiceStorage;
