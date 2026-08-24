import { isValidRFC } from '@/lib/types/facturama';

const SAT_NON_CASH_LIMIT = 2000;
const NON_CASH_PAYMENT_METHODS = new Set(['transferencia', 'tarjeta', 'cheque']);

export type SatDeductibilityStatus = 'deducible_probable' | 'no_deducible' | 'requiere_revision';

export interface ExpenseForSatEvaluation {
  id?: number | string;
  concepto?: string | null;
  categoria?: string | null;
  monto: number | string;
  metodo_pago?: string | null;
  proveedor_rfc?: string | null;
  factura_tipo?: string | null;
  factura_numero?: string | null;
  factura_url?: string | null;
}

export interface SatRuleEvaluation {
  code: 'cfdi' | 'rfc' | 'medio_pago_mayor_2000' | 'estricta_indispensabilidad';
  title: string;
  passed: boolean;
  severity: 'critical' | 'warning';
  legalReference: string;
  details: string;
}

export interface SatExpenseEvaluation {
  status: SatDeductibilityStatus;
  statusLabel: string;
  primaryReason: string;
  blockers: string[];
  warnings: string[];
  recommendations: string[];
  rules: SatRuleEvaluation[];
  deducibleAmount: number;
  noDeducibleAmount: number;
  revisionAmount: number;
}

export interface SatOfficialSource {
  title: string;
  url: string;
}

export interface SatCriterion {
  title: string;
  description: string;
  legalReference: string;
}

export interface SatDeductibilitySummary {
  totalAmount: number;
  totalDeducibleProbable: number;
  totalNoDeducible: number;
  totalRevision: number;
  countTotal: number;
  countDeducibleProbable: number;
  countNoDeducible: number;
  countRevision: number;
  recommendations: string[];
  criteria: SatCriterion[];
  sources: SatOfficialSource[];
}

export const SAT_DEDUCTION_CRITERIA: SatCriterion[] = [
  {
    title: 'CFDI del gasto',
    description:
      'Para soportar deducción, el gasto debe estar amparado con comprobante fiscal digital y datos fiscales completos.',
    legalReference: 'CFF, Arts. 29 y 29-A'
  },
  {
    title: 'RFC del proveedor',
    description:
      'El emisor del comprobante debe estar identificado con RFC válido.',
    legalReference: 'CFF, Art. 29-A'
  },
  {
    title: 'Medio de pago en montos altos',
    description:
      'En deducciones mayores a $2,000 MXN, evitar efectivo y usar medios bancarizados.',
    legalReference: 'LISR, Art. 27'
  },
  {
    title: 'Estricta indispensabilidad',
    description:
      'El gasto debe ser estrictamente indispensable para la actividad del contribuyente.',
    legalReference: 'LISR, Art. 27'
  }
];

export const SAT_OFFICIAL_SOURCES: SatOfficialSource[] = [
  {
    title: 'SAT: Verificación de CFDI',
    url: 'https://verificacfdi.facturaelectronica.sat.gob.mx/'
  },
  {
    title: 'Código Fiscal de la Federación (CFF)',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf'
  },
  {
    title: 'Ley del ISR (LISR)',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf'
  }
];

function normalizeText(value?: string | null): string {
  return (value || '').trim().toLowerCase();
}

function toAmount(value: number | string): number {
  const amount = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(amount) ? amount : 0;
}

function statusLabel(status: SatDeductibilityStatus): string {
  switch (status) {
    case 'deducible_probable':
      return 'Deducible SAT probable';
    case 'no_deducible':
      return 'No deducible SAT';
    case 'requiere_revision':
      return 'Requiere revisión SAT';
    default:
      return 'Requiere revisión SAT';
  }
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function evaluateSatDeductibility(expense: ExpenseForSatEvaluation): SatExpenseEvaluation {
  const amount = toAmount(expense.monto);
  const metodoPago = normalizeText(expense.metodo_pago);
  const facturaTipo = normalizeText(expense.factura_tipo);
  const facturaNumero = (expense.factura_numero || '').trim();
  const facturaUrl = (expense.factura_url || '').trim();
  const proveedorRfc = (expense.proveedor_rfc || '').trim().toUpperCase();
  const categoria = normalizeText(expense.categoria);

  const hasCfdi = facturaTipo === 'fiscal' && Boolean(facturaNumero || facturaUrl);
  const hasValidRfc = Boolean(proveedorRfc) && isValidRFC(proveedorRfc);
  const requiresNonCashMethod = amount > SAT_NON_CASH_LIMIT;
  const hasValidPaymentMethod = !requiresNonCashMethod || NON_CASH_PAYMENT_METHODS.has(metodoPago);
  const canInferBusinessUse = Boolean(categoria) && categoria !== 'otros';

  const rules: SatRuleEvaluation[] = [
    {
      code: 'cfdi',
      title: 'CFDI del gasto',
      passed: hasCfdi,
      severity: 'critical',
      legalReference: 'CFF, Arts. 29 y 29-A',
      details: hasCfdi
        ? 'Se detectó comprobante fiscal en formato CFDI con referencia documental.'
        : 'Falta CFDI fiscal o referencia de comprobante (folio/archivo).'
    },
    {
      code: 'rfc',
      title: 'RFC del proveedor',
      passed: hasValidRfc,
      severity: 'critical',
      legalReference: 'CFF, Art. 29-A',
      details: hasValidRfc ? 'RFC de proveedor válido.' : 'RFC del proveedor faltante o con formato inválido.'
    },
    {
      code: 'medio_pago_mayor_2000',
      title: 'Medio de pago para montos > $2,000',
      passed: hasValidPaymentMethod,
      severity: 'critical',
      legalReference: 'LISR, Art. 27',
      details: hasValidPaymentMethod
        ? requiresNonCashMethod
          ? 'Se usó un medio de pago bancarizado para monto mayor a $2,000.'
          : 'No aplica restricción de medio de pago por monto <= $2,000.'
        : 'Monto mayor a $2,000 con medio de pago no bancarizado.'
    },
    {
      code: 'estricta_indispensabilidad',
      title: 'Estricta indispensabilidad',
      passed: canInferBusinessUse,
      severity: 'warning',
      legalReference: 'LISR, Art. 27',
      details: canInferBusinessUse
        ? 'La categoría permite inferir uso operativo; validar con criterio contable.'
        : 'La categoría no permite inferir indispensabilidad con certeza.'
    }
  ];

  if (amount <= 0) {
    return {
      status: 'requiere_revision',
      statusLabel: statusLabel('requiere_revision'),
      primaryReason: 'Monto inválido para evaluación fiscal.',
      blockers: [],
      warnings: ['Monto inválido para evaluación fiscal.'],
      recommendations: ['Corrige el monto del gasto para poder clasificar deducibilidad SAT.'],
      rules,
      deducibleAmount: 0,
      noDeducibleAmount: 0,
      revisionAmount: 0
    };
  }

  const failedCriticalRules = rules.filter((rule) => rule.severity === 'critical' && !rule.passed);
  const failedWarningRules = rules.filter((rule) => rule.severity === 'warning' && !rule.passed);

  let status: SatDeductibilityStatus = 'deducible_probable';
  if (failedCriticalRules.length > 0) {
    status = 'no_deducible';
  } else if (failedWarningRules.length > 0) {
    status = 'requiere_revision';
  }

  const blockers = failedCriticalRules.map((rule) => rule.details);
  const warnings = failedWarningRules.map((rule) => rule.details);
  const recommendations = uniqueStrings([
    !hasCfdi ? 'Solicita CFDI fiscal y conserva folio/archivo del comprobante.' : '',
    !hasValidRfc ? 'Captura el RFC correcto del proveedor en el gasto.' : '',
    requiresNonCashMethod && !hasValidPaymentMethod
      ? 'Para montos mayores a $2,000 MXN usa transferencia, tarjeta o cheque nominativo.'
      : '',
    !canInferBusinessUse
      ? 'Evita categoría "otros" cuando puedas clasificar el gasto de forma específica.'
      : '',
    'Valida con tu contador la estricta indispensabilidad del gasto antes de declararlo.'
  ]);

  const primaryReason =
    status === 'no_deducible'
      ? blockers[0] || 'No cumple con uno o más requisitos SAT/LISR.'
      : status === 'requiere_revision'
        ? warnings[0] || 'Requiere evidencia fiscal adicional para clasificarlo.'
        : 'Cumple requisitos automáticos de CFDI, RFC y medio de pago.';

  return {
    status,
    statusLabel: statusLabel(status),
    primaryReason,
    blockers,
    warnings,
    recommendations,
    rules,
    deducibleAmount: status === 'deducible_probable' ? amount : 0,
    noDeducibleAmount: status === 'no_deducible' ? amount : 0,
    revisionAmount: status === 'requiere_revision' ? amount : 0
  };
}

export function buildSatDeductibilitySummary(expenses: ExpenseForSatEvaluation[]): SatDeductibilitySummary {
  const evaluations = expenses.map((expense) => evaluateSatDeductibility(expense));

  const summary = evaluations.reduce(
    (acc, evaluation, index) => {
      acc.totalAmount += toAmount(expenses[index]?.monto ?? 0);
      acc.totalDeducibleProbable += evaluation.deducibleAmount;
      acc.totalNoDeducible += evaluation.noDeducibleAmount;
      acc.totalRevision += evaluation.revisionAmount;
      acc.countTotal += 1;

      if (evaluation.status === 'deducible_probable') acc.countDeducibleProbable += 1;
      if (evaluation.status === 'no_deducible') acc.countNoDeducible += 1;
      if (evaluation.status === 'requiere_revision') acc.countRevision += 1;

      acc.recommendations.push(...evaluation.recommendations);

      return acc;
    },
    {
      totalAmount: 0,
      totalDeducibleProbable: 0,
      totalNoDeducible: 0,
      totalRevision: 0,
      countTotal: 0,
      countDeducibleProbable: 0,
      countNoDeducible: 0,
      countRevision: 0,
      recommendations: [] as string[]
    }
  );

  const dedupedRecommendations = uniqueStrings(summary.recommendations);

  return {
    totalAmount: Math.round(summary.totalAmount * 100) / 100,
    totalDeducibleProbable: Math.round(summary.totalDeducibleProbable * 100) / 100,
    totalNoDeducible: Math.round(summary.totalNoDeducible * 100) / 100,
    totalRevision: Math.round(summary.totalRevision * 100) / 100,
    countTotal: summary.countTotal,
    countDeducibleProbable: summary.countDeducibleProbable,
    countNoDeducible: summary.countNoDeducible,
    countRevision: summary.countRevision,
    recommendations: dedupedRecommendations.slice(0, 6),
    criteria: SAT_DEDUCTION_CRITERIA,
    sources: SAT_OFFICIAL_SOURCES
  };
}
