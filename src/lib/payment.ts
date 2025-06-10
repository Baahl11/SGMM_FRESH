export type PaymentMethod = 'credit' | 'debit' | 'cash' | 'transfer';
export type Terminal = 'bbva' | 'openpay';
export type InstallmentPeriod = 3 | 6 | 9 | 12;

interface InstallmentRate {
  months: InstallmentPeriod;
  bbva: number;
  openpay: number;
}

const IVA = 0.16; // 16% IVA

export const BASE_RATES = {
  bbva: 0.035, // 3.5%
  openpay: 0.029, // 2.9%
};

export const INSTALLMENT_RATES: InstallmentRate[] = [
  {
    months: 3,
    bbva: 0.0395, // 3.95%
    openpay: 0.077, // 7.7%
  },
  {
    months: 6,
    bbva: 0.065, // 6.5%
    openpay: 0.107, // 10.7%
  },
  {
    months: 9,
    bbva: 0.09, // 9%
    openpay: 0.137, // 13.7%
  },
  {
    months: 12,
    bbva: 0.12, // 12%
    openpay: 0.167, // 16.7%
  },
];

export function calculateTotal(
  amount: number,
  paymentMethod: PaymentMethod,
  terminal?: Terminal,
  installments?: InstallmentPeriod
): {
  subtotal: number;
  commission: number;
  iva: number;
  total: number;
} {
  let rate = 0;

  if (paymentMethod === 'credit' && terminal && installments) {
    const installmentRate = INSTALLMENT_RATES.find(r => r.months === installments);
    if (installmentRate) {
      rate = terminal === 'bbva' ? installmentRate.bbva : installmentRate.openpay;
    }
  } else if (paymentMethod === 'credit' && terminal) {
    // One-time payment with credit card
    rate = BASE_RATES[terminal];
  }

  const commission = amount * rate;
  const ivaOnCommission = terminal === 'openpay' ? commission * IVA : 0;
  
  return {
    subtotal: amount,
    commission: commission,
    iva: ivaOnCommission,
    total: amount + commission + ivaOnCommission,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}
