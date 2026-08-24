#!/usr/bin/env node
/**
 * Presupuesto de lint (auditoría fable 2026-06-11, B3 / OD-3).
 * El repo arrastra deuda histórica de ESLint que no es seguro corregir en
 * bloque. Este script impide que la deuda CREZCA: falla si los errores
 * superan el presupuesto registrado en .lint-budget. Al reducir deuda,
 * actualizar el archivo a la baja (nunca al alza sin justificación).
 */
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const budget = parseInt(readFileSync('.lint-budget', 'utf8').trim(), 10)
let out
try {
  out = execSync('npx eslint . -f json', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
} catch (e) {
  out = e.stdout?.toString() ?? '[]'
}
const results = JSON.parse(out)
const errors = results.reduce((n, f) => n + f.errorCount, 0)
console.log(`ESLint: ${errors} errores (presupuesto: ${budget})`)
if (errors > budget) {
  console.error(`✖ La deuda de lint creció en ${errors - budget}. Corrige antes de mergear.`)
  process.exit(1)
}
console.log('✓ Dentro del presupuesto.')
