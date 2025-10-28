/**
 * ZIP Utility for bulk PDF downloads
 * Uses jszip to create ZIP files with multiple PDFs
 */

import JSZip from 'jszip';
import type { Invoice } from '@/lib/types/facturama';

export interface ZipDownloadOptions {
  filename?: string;
  onProgress?: (current: number, total: number) => void;
}

export interface ZipDownloadResult {
  successCount: number;
  errorCount: number;
  total: number;
}

export async function downloadInvoicePDFsAsZip(
  invoices: Invoice[],
  options: ZipDownloadOptions = {}
): Promise<ZipDownloadResult> {
  const {
    filename = `facturas_${new Date().toISOString().split('T')[0]}.zip`,
    onProgress,
  } = options;

  // Filter invoices that have PDF URLs
  const invoicesWithPDF = invoices.filter(inv => inv.pdf_url);

  if (invoicesWithPDF.length === 0) {
    throw new Error('No hay PDFs disponibles para descargar');
  }

  const zip = new JSZip();
  let successCount = 0;
  let errorCount = 0;

  // Download each PDF and add to ZIP
  for (let i = 0; i < invoicesWithPDF.length; i++) {
    const invoice = invoicesWithPDF[i];
    
    try {
      // Fetch PDF
      const response = await fetch(invoice.pdf_url!);
      
      if (!response.ok) {
        console.error(`Failed to fetch PDF for invoice ${invoice.id}`);
        errorCount++;
        continue;
      }

      const blob = await response.blob();
      const filename = `${invoice.serie}-${invoice.folio_number}.pdf`;
      
      // Add to ZIP
      zip.file(filename, blob);
      successCount++;

      // Report progress
      if (onProgress) {
        onProgress(i + 1, invoicesWithPDF.length);
      }
    } catch (error) {
      console.error(`Error downloading PDF for invoice ${invoice.id}:`, error);
      errorCount++;
    }
  }

  if (successCount === 0) {
    throw new Error('No se pudo descargar ningún PDF');
  }

  // Generate ZIP file
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      // Progress during ZIP generation
      if (onProgress && metadata.percent) {
        const current = Math.round((metadata.percent / 100) * invoicesWithPDF.length);
        onProgress(current, invoicesWithPDF.length);
      }
    }
  );

  // Download ZIP
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);

  return {
    successCount,
    errorCount,
    total: invoicesWithPDF.length,
  };
}
