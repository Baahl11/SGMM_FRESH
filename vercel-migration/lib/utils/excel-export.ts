/**
 * Excel Export Utility
 * Uses exceljs to create professional Excel exports
 */

import ExcelJS from 'exceljs';
import type { Invoice } from '@/lib/types/facturama';

export interface ExcelExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  autoFilter?: boolean;
}

export async function exportInvoicesToExcel(
  invoices: Invoice[],
  options: ExcelExportOptions = {}
): Promise<void> {
  const {
    filename = `facturas_${new Date().toISOString().split('T')[0]}.xlsx`,
    includeHeaders = true,
    autoFilter = true,
  } = options;

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Facturas', {
    properties: { tabColor: { argb: '7C3AED' } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }], // Freeze header row
  });

  // Define columns
  worksheet.columns = [
    { header: 'Folio', key: 'folio', width: 15 },
    { header: 'Serie', key: 'serie', width: 10 },
    { header: 'Fecha Emisión', key: 'fecha', width: 15 },
    { header: 'Paciente', key: 'paciente', width: 30 },
    { header: 'RFC', key: 'rfc', width: 15 },
    { header: 'Subtotal', key: 'subtotal', width: 15 },
    { header: 'IVA', key: 'iva', width: 15 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Estado', key: 'estado', width: 12 },
    { header: 'UUID', key: 'uuid', width: 40 },
    { header: 'Fecha Envío Email', key: 'enviado', width: 18 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '7C3AED' }, // Purple
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data rows
  invoices.forEach((invoice) => {
    const paciente = invoice.patient
      ? `${invoice.patient.nombre} ${invoice.patient.apellido}`
      : 'N/A';
    
    const row = worksheet.addRow({
      folio: `${invoice.serie}-${invoice.folio_number}`,
      serie: invoice.serie,
      fecha: new Date(invoice.fecha_emision),
      paciente,
      rfc: invoice.fiscal_data?.rfc || 'N/A',
      subtotal: invoice.subtotal,
      iva: invoice.iva,
      total: invoice.total,
      estado: getStatusText(invoice.status),
      uuid: invoice.uuid || 'N/A',
      enviado: invoice.emailed_at ? new Date(invoice.emailed_at) : 'No enviado',
    });

    // Format date cells
    row.getCell('fecha').numFmt = 'dd/mm/yyyy';
    if (invoice.emailed_at) {
      row.getCell('enviado').numFmt = 'dd/mm/yyyy hh:mm';
    }

    // Format currency cells
    row.getCell('subtotal').numFmt = '$#,##0.00';
    row.getCell('iva').numFmt = '$#,##0.00';
    row.getCell('total').numFmt = '$#,##0.00';

    // Color-code status
    const statusCell = row.getCell('estado');
    switch (invoice.status) {
      case 'issued':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E0F2FE' }, // Light blue
        };
        statusCell.font = { color: { argb: '0369A1' } }; // Dark blue
        break;
      case 'sent':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'D1FAE5' }, // Light green
        };
        statusCell.font = { color: { argb: '065F46' } }; // Dark green
        break;
      case 'cancelled':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FEE2E2' }, // Light red
        };
        statusCell.font = { color: { argb: '991B1B' } }; // Dark red
        break;
    }

    // Center align status
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Add auto-filter
  if (autoFilter && invoices.length > 0) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 11 },
    };
  }

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'E5E7EB' } },
        left: { style: 'thin', color: { argb: 'E5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
        right: { style: 'thin', color: { argb: 'E5E7EB' } },
      };
    });
  });

  // Add summary row at the bottom
  const summaryRow = worksheet.addRow({});
  summaryRow.getCell(5).value = 'TOTALES:';
  summaryRow.getCell(5).font = { bold: true };
  summaryRow.getCell(5).alignment = { horizontal: 'right' };
  
  summaryRow.getCell(6).value = { formula: `SUM(F2:F${invoices.length + 1})` };
  summaryRow.getCell(6).numFmt = '$#,##0.00';
  summaryRow.getCell(6).font = { bold: true };
  
  summaryRow.getCell(7).value = { formula: `SUM(G2:G${invoices.length + 1})` };
  summaryRow.getCell(7).numFmt = '$#,##0.00';
  summaryRow.getCell(7).font = { bold: true };
  
  summaryRow.getCell(8).value = { formula: `SUM(H2:H${invoices.length + 1})` };
  summaryRow.getCell(8).numFmt = '$#,##0.00';
  summaryRow.getCell(8).font = { bold: true };
  summaryRow.getCell(8).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FEF3C7' }, // Light yellow
  };

  // Add metadata
  workbook.creator = 'AgendaMedPro';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastModifiedBy = 'AgendaMedPro';

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getStatusText(status: string): string {
  switch (status) {
    case 'issued':
      return 'Emitida';
    case 'sent':
      return 'Enviada';
    case 'cancelled':
      return 'Cancelada';
    case 'draft':
      return 'Borrador';
    default:
      return status;
  }
}
