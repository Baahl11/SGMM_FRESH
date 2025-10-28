/**
 * Invoice Preview Component
 * Shows how the invoice will look with current branding settings
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { ClinicSettings } from '@/lib/types/clinic-settings';

interface InvoicePreviewProps {
  settings: ClinicSettings;
}

export function InvoicePreview({ settings }: InvoicePreviewProps) {
  const {
    logo_url,
    logo_position,
    show_logo,
    show_clinic_name,
    primary_color,
    secondary_color,
    text_color,
    template,
    font_family,
    footer_text,
  } = settings;

  // Sample data for preview
  const sampleData = {
    clinicName: 'Clínica Demo',
    folio: 'A-12345',
    date: new Date().toLocaleDateString('es-MX'),
    patient: 'Juan Pérez García',
    rfc: 'XAXX010101000',
    concepts: [
      { description: 'Consulta General', quantity: 1, price: 500, total: 500 },
      { description: 'Estudios de Laboratorio', quantity: 2, price: 350, total: 700 },
    ],
    subtotal: 1200,
    tax: 192,
    total: 1392,
  };

  // Template-specific styles
  const templateStyles: Record<typeof template, {
    headerBg: string;
    borderRadius: string;
    shadow: string;
    border?: string;
  }> = {
    modern: {
      headerBg: `linear-gradient(135deg, ${primary_color} 0%, ${secondary_color} 100%)`,
      borderRadius: '12px',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    classic: {
      headerBg: primary_color,
      borderRadius: '4px',
      shadow: 'none',
      border: `2px solid ${primary_color}`,
    },
    minimalist: {
      headerBg: 'transparent',
      borderRadius: '0px',
      shadow: 'none',
    },
    professional: {
      headerBg: primary_color,
      borderRadius: '8px',
      shadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
    },
  };

  const currentTemplate = templateStyles[template] || templateStyles.modern;

  return (
    <Card className="overflow-hidden" style={{ fontFamily: font_family }}>
      <CardContent className="p-0">
        <div className="bg-white" style={{ boxShadow: currentTemplate.shadow }}>
          {/* Header */}
          <div
            className="p-6"
            style={{
              background: currentTemplate.headerBg,
              borderRadius: `${currentTemplate.borderRadius} ${currentTemplate.borderRadius} 0 0`,
              ...(currentTemplate.border && { border: currentTemplate.border }),
            }}
          >
            <div
              className={`flex items-center gap-4 ${
                logo_position === 'center'
                  ? 'justify-center flex-col'
                  : logo_position === 'right'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              {show_logo && logo_url && (
                <img
                  src={logo_url}
                  alt="Logo"
                  className="object-contain"
                  style={{
                    maxWidth: `${settings.logo_width}px`,
                    maxHeight: '80px',
                  }}
                />
              )}
              {show_clinic_name && (
                <h1
                  className="text-2xl font-bold"
                  style={{
                    color: template === 'minimalist' ? text_color : '#FFFFFF',
                  }}
                >
                  {sampleData.clinicName}
                </h1>
              )}
            </div>
          </div>

          {/* Invoice Info */}
          <div className="p-6 grid grid-cols-2 gap-4 border-b">
            <div>
              <p className="text-sm font-semibold" style={{ color: primary_color }}>
                FACTURA
              </p>
              <p className="text-lg font-bold" style={{ color: text_color }}>
                {sampleData.folio}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm" style={{ color: text_color }}>
                Fecha: {sampleData.date}
              </p>
            </div>
          </div>

          {/* Patient Info */}
          <div className="p-6 border-b">
            <h2
              className="text-sm font-semibold mb-2"
              style={{ color: primary_color }}
            >
              PACIENTE
            </h2>
            <p className="font-medium" style={{ color: text_color }}>
              {sampleData.patient}
            </p>
            <p className="text-sm" style={{ color: text_color, opacity: 0.7 }}>
              RFC: {sampleData.rfc}
            </p>
          </div>

          {/* Concepts Table */}
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: secondary_color, color: '#FFFFFF' }}>
                  <th className="text-left p-2 text-sm">Concepto</th>
                  <th className="text-center p-2 text-sm">Cantidad</th>
                  <th className="text-right p-2 text-sm">Precio</th>
                  <th className="text-right p-2 text-sm">Total</th>
                </tr>
              </thead>
              <tbody>
                {sampleData.concepts.map((concept, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2" style={{ color: text_color }}>
                      {concept.description}
                    </td>
                    <td className="text-center p-2" style={{ color: text_color }}>
                      {concept.quantity}
                    </td>
                    <td className="text-right p-2" style={{ color: text_color }}>
                      ${concept.price.toFixed(2)}
                    </td>
                    <td className="text-right p-2 font-medium" style={{ color: text_color }}>
                      ${concept.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-end gap-8">
                <span style={{ color: text_color }}>Subtotal:</span>
                <span className="font-medium" style={{ color: text_color }}>
                  ${sampleData.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-end gap-8">
                <span style={{ color: text_color }}>IVA (16%):</span>
                <span className="font-medium" style={{ color: text_color }}>
                  ${sampleData.tax.toFixed(2)}
                </span>
              </div>
              <div
                className="flex justify-end gap-8 pt-2 border-t-2"
                style={{ borderColor: primary_color }}
              >
                <span className="text-lg font-bold" style={{ color: primary_color }}>
                  TOTAL:
                </span>
                <span className="text-lg font-bold" style={{ color: primary_color }}>
                  ${sampleData.total.toFixed(2)} MXN
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          {footer_text && (
            <div
              className="p-4 text-center text-sm border-t"
              style={{ color: text_color, opacity: 0.8, backgroundColor: '#F9FAFB' }}
            >
              {footer_text}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
