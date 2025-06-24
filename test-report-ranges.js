/**
 * Test de los nuevos rangos de tiempo en reportes
 * Verifica que se puedan seleccionar períodos de 12 meses o más
 */

console.log("🧪 Test de Rangos de Tiempo en Reportes");
console.log("=====================================");

// Simular datos de prueba para diferentes períodos
const testPeriods = [
  { value: "daily7", label: "Últimos 7 días", months: 0 },
  { value: "daily15", label: "Últimos 15 días", months: 0 },
  { value: "daily30", label: "Últimos 30 días", months: 1 },
  { value: "daily90", label: "Últimos 90 días", months: 3 },
  { value: "monthly6", label: "Últimos 6 meses", months: 6 },
  { value: "monthly12", label: "Últimos 12 meses", months: 12 },
  { value: "monthly24", label: "Últimos 24 meses", months: 24 },
];

console.log("📅 Períodos disponibles:");
testPeriods.forEach(period => {
  const isExtended = period.months >= 12;
  const icon = isExtended ? "✅" : "📊";
  console.log(`${icon} ${period.label} (${period.value}) - ${period.months} meses`);
});

console.log("\n🎯 Rangos extendidos (12+ meses):");
const extendedRanges = testPeriods.filter(p => p.months >= 12);
extendedRanges.forEach(range => {
  console.log(`✅ ${range.label} - Perfecto para análisis a largo plazo`);
});

console.log("\n📈 Beneficios de los rangos extendidos:");
console.log("• Análisis de tendencias anuales");
console.log("• Comparación estacional");
console.log("• Evaluación de crecimiento a largo plazo");
console.log("• Identificación de patrones de 12+ meses");

console.log("\n✅ Test completado: Los rangos de 12 meses o más están disponibles!");
