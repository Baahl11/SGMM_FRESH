/**
 * Utilidades para cálculo de comisiones de tarjetas de crédito
 */

export interface PaymentCalculation {
  tasa: number;
  comision: number;
  ganancia: number;
  montoNeto: number;
}

export function calcularComisionBBVA(monto: number, mesesSinIntereses: number = 0): PaymentCalculation {
  const tasaBase = 3.5;
  
  let tasa: number;
  switch (mesesSinIntereses) {
    case 0:
      tasa = tasaBase;
      break;
    case 3:
      tasa = 3.95;
      break;
    case 6:
      tasa = 6.5;
      break;
    case 9:
      tasa = 9.0;
      break;
    case 12:
      tasa = 12.0;
      break;
    default:
      throw new Error(`MSI no válidos para BBVA: ${mesesSinIntereses}`);
  }
  
  const comision = monto * (tasa / 100);
  const montoNeto = monto - comision;
  
  return {
    tasa,
    comision,
    ganancia: 0, // Se calculará después con el costo
    montoNeto
  };
}

export function calcularComisionOpenPay(monto: number, mesesSinIntereses: number = 0): PaymentCalculation {
  let tasa: number;
  switch (mesesSinIntereses) {
    case 0:
      tasa = 2.9;
      break;
    case 3:
      tasa = 7.7;
      break;
    case 6:
      tasa = 10.7;
      break;
    case 9:
      tasa = 13.7;
      break;
    case 12:
      tasa = 16.7;
      break;
    default:
      throw new Error(`MSI no válidos para OpenPay: ${mesesSinIntereses}`);
  }
  
  // Comisión sin IVA
  const comisionSinIva = monto * (tasa / 100);
  // Agregar IVA (16%)
  const comision = comisionSinIva * 1.16;
  const montoNeto = monto - comision;
  
  return {
    tasa,
    comision,
    ganancia: 0, // Se calculará después con el costo
    montoNeto
  };
}

export function calcularComisionTarjeta(
  monto: number, 
  tipoTarjeta: 'bbva' | 'openpay', 
  mesesSinIntereses: number = 0
): PaymentCalculation {
  if (tipoTarjeta === 'bbva') {
    return calcularComisionBBVA(monto, mesesSinIntereses);
  } else {
    return calcularComisionOpenPay(monto, mesesSinIntereses);
  }
}

export function calcularGananciaNeta(
  montoPagado: number,
  costoUnitario: number,
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia',
  tipoTarjeta?: 'bbva' | 'openpay',
  mesesSinIntereses: number = 0
): PaymentCalculation {
  const gananciaBase = montoPagado - costoUnitario;
  
  if (metodoPago === 'efectivo' || metodoPago === 'transferencia') {
    return {
      tasa: 0,
      comision: 0,
      ganancia: gananciaBase,
      montoNeto: montoPagado
    };
  }
  
  if (metodoPago === 'tarjeta' && tipoTarjeta) {
    const calc = calcularComisionTarjeta(montoPagado, tipoTarjeta, mesesSinIntereses);
    return {
      ...calc,
      ganancia: calc.montoNeto - costoUnitario
    };
  }
  
  throw new Error('Tipo de tarjeta requerido para pagos con tarjeta');
}

export const MESES_SIN_INTERESES_OPTIONS = [
  { value: 0, label: '1 exhibición' },
  { value: 3, label: '3 MSI' },
  { value: 6, label: '6 MSI' },
  { value: 9, label: '9 MSI' },
  { value: 12, label: '12 MSI' }
];

export const TIPOS_TARJETA_OPTIONS = [
  { value: 'bbva', label: 'BBVA' },
  { value: 'openpay', label: 'OpenPay (Otras tarjetas)' }
];

export const METODOS_PAGO_OPTIONS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta de Crédito' },
  { value: 'transferencia', label: 'Transferencia' }
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}
