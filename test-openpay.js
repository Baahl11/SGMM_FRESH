// Simulación de las funciones para probar OpenPay

const CARD_TYPES = [
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
  }
];

function calcularComisionTarjeta(monto, tipoTarjeta, mesesSinIntereses = 0) {
  const cardType = CARD_TYPES.find(card => card.id === tipoTarjeta);
  
  if (!cardType) {
    throw new Error(`Tipo de tarjeta no válido: ${tipoTarjeta}`);
  }

  let tasa;
  
  if (mesesSinIntereses === 0) {
    tasa = cardType.baseRate;
  } else {
    tasa = cardType.installmentRates[mesesSinIntereses];
    if (tasa === undefined) {
      throw new Error(`MSI no válidos para ${cardType.name}: ${mesesSinIntereses} meses`);
    }
  }
  
  let comision = monto * (tasa / 100);
  const montoNeto = monto - comision;
  
  return {
    tasa,
    comision,
    ganancia: 0,
    montoNeto
  };
}

// Pruebas
console.log('Prueba OpenPay:');
const monto = 1000;

console.log('\n1 exhibición (0 MSI):');
let calculo = calcularComisionTarjeta(monto, 'openpay', 0);
console.log(`Monto: $${monto}, Tasa: ${calculo.tasa}%, Comisión: $${calculo.comision.toFixed(2)}, Neto: $${calculo.montoNeto.toFixed(2)}`);

console.log('\n3 MSI:');
calculo = calcularComisionTarjeta(monto, 'openpay', 3);
console.log(`Monto: $${monto}, Tasa: ${calculo.tasa}%, Comisión: $${calculo.comision.toFixed(2)}, Neto: $${calculo.montoNeto.toFixed(2)}`);

console.log('\n6 MSI:');
calculo = calcularComisionTarjeta(monto, 'openpay', 6);
console.log(`Monto: $${monto}, Tasa: ${calculo.tasa}%, Comisión: $${calculo.comision.toFixed(2)}, Neto: $${calculo.montoNeto.toFixed(2)}`);

console.log('\n12 MSI:');
calculo = calcularComisionTarjeta(monto, 'openpay', 12);
console.log(`Monto: $${monto}, Tasa: ${calculo.tasa}%, Comisión: $${calculo.comision.toFixed(2)}, Neto: $${calculo.montoNeto.toFixed(2)}`);
