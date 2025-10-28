/**
 * Utilidades para cálculo de comisiones de tarjetas de crédito
 */

export interface PaymentCalculation {
  tasa: number;
  comision: number;
  ganancia: number;
  montoNeto: number;
}

export interface CardType {
  id: string;
  name: string;
  baseRate: number;
  installmentRates: { [months: number]: number };
}

// Configuración de tipos de tarjeta
export const CARD_TYPES: CardType[] = [
  {
    id: 'bbva',
    name: 'BBVA',
    baseRate: 3.5,
    installmentRates: {
      3: 3.95,
      6: 6.5,
      9: 9.0,
      12: 12.0
    }
  },
  {
    id: 'banamex',
    name: 'Banamex',
    baseRate: 1.5,
    installmentRates: {
      3: 1.5 + 5.75,  // 7.25%
      6: 1.5 + 10.49, // 11.99%
      9: 1.5 + 14.03, // 15.53%
      12: 1.5 + 16.63 // 18.13%
    }
  },
  {
    id: 'amex',
    name: 'American Express',
    baseRate: 2.65,
    installmentRates: {
      3: 2.80 + 3.5,  // 6.30%
      6: 2.80 + 5.5,  // 8.30%
      9: 2.80 + 8.5,  // 11.30%
      12: 2.80 + 11.5 // 14.30%
    }
  },
  {
    id: 'openpay',
    name: 'OpenPay',
    baseRate: 3.364, // 2.9% + IVA (16%)
    installmentRates: {
      3: 8.932,  // 7.7% + IVA (16%)
      6: 12.412, // 10.7% + IVA (16%)
      9: 15.892, // 13.7% + IVA (16%)
      12: 19.372 // 16.7% + IVA (16%)
    }
  },
  {
    id: 'otros',
    name: 'Otras Tarjetas de Crédito',
    baseRate: 2.80,
    installmentRates: {
      3: 2.80 + 3.5,  // 6.30%
      6: 2.80 + 5.5,  // 8.30%
      9: 2.80 + 8.5,  // 11.30%
      12: 2.80 + 11.5 // 14.30%
    }
  }
];

export function calcularComisionTarjeta(
  monto: number, 
  tipoTarjeta: string, 
  mesesSinIntereses: number = 0
): PaymentCalculation {
  const cardType = CARD_TYPES.find(card => card.id === tipoTarjeta);
  
  if (!cardType) {
    throw new Error(`Tipo de tarjeta no válido: ${tipoTarjeta}`);
  }

  let tasa: number;
  
  if (mesesSinIntereses === 0) {
    tasa = cardType.baseRate;
  } else {
    tasa = cardType.installmentRates[mesesSinIntereses];
    if (tasa === undefined) {
      throw new Error(`MSI no válidos para ${cardType.name}: ${mesesSinIntereses} meses`);
    }
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

export function calcularGananciaNeta(
  montoPagado: number,
  costoUnitario: number,
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia',
  tipoTarjeta?: string,
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
  
  if (metodoPago === 'tarjeta') {
    if (!tipoTarjeta) {
      return {
        tasa: 0,
        comision: 0,
        ganancia: gananciaBase,
        montoNeto: montoPagado
      };
    }
    
    const calc = calcularComisionTarjeta(montoPagado, tipoTarjeta, mesesSinIntereses);
    return {
      ...calc,
      ganancia: calc.montoNeto - costoUnitario
    };
  }
  
  return {
    tasa: 0,
    comision: 0,
    ganancia: gananciaBase,
    montoNeto: montoPagado
  };
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
  { value: 'banamex', label: 'Banamex' },
  { value: 'amex', label: 'American Express' },
  { value: 'openpay', label: 'OpenPay' },
  { value: 'otros', label: 'Otras Tarjetas de Crédito' }
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

/**
 * Format payment method for display
 */
export function formatPaymentMethod(
  metodoPago: string,
  tipoTarjeta?: string | null,
  mesesSinIntereses?: number | null
): string {
  if (metodoPago === 'efectivo') {
    return 'Pagado con Efectivo';
  }
  
  if (metodoPago === 'transferencia') {
    return 'Pagado con Transferencia';
  }
  
  if (metodoPago === 'tarjeta') {
    let text = 'Pagado con Tarjeta';
    
    if (tipoTarjeta) {
      const cardType = CARD_TYPES.find(c => c.id === tipoTarjeta);
      text += ` ${cardType?.name || tipoTarjeta.toUpperCase()}`;
    }
    
    if (mesesSinIntereses && mesesSinIntereses > 0) {
      text += ` - ${mesesSinIntereses} MSI`;
    }
    
    return text;
  }
  
  return metodoPago;
}
