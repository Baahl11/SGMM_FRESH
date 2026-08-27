import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Adenda V2.1, hallazgo A-5: interpolar un string de fecha seguido de hora
// sin offset (00:00:00 / 23:59:59) hace que Postgres interprete el limite
// como UTC, corriendo la ventana del dia seis horas en Mexico. Las 7
// ubicaciones citadas por la adenda ya se reemplazaron por
// clinicDateStringRangeUtc()/addDaysToDateString() (lib/timezone.ts). Este
// test falla si el patron reaparece en cualquier archivo .ts/.tsx trackeado
// por git, para que el bug no pueda volver a colarse sin que la suite lo
// note.

const NAIVE_BOUNDARY_PATTERN = /\$\{[^}]+\}T(00:00:00|23:59:59)/

// lib/timezone.ts documenta el patron viejo en prosa (para explicar que
// reemplazan las funciones nuevas), nunca lo usa como codigo -- se excluye
// a proposito, no por descuido.
const ALLOWED_FILES = new Set(['lib/timezone.ts'])

function listTrackedSourceFiles(): string[] {
  const out = execSync('git ls-files', { encoding: 'utf8' })
  return out
    .split('\n')
    .filter(Boolean)
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .filter((f) => !f.startsWith('tests/'))
}

describe('adenda V2.1, A-5: sin límites de fecha naive (T00:00:00/T23:59:59 sin offset)', () => {
  it('ningún archivo de código interpola un string de fecha con hora sin offset', () => {
    const offenders: string[] = []
    for (const file of listTrackedSourceFiles()) {
      if (ALLOWED_FILES.has(file)) continue
      let content: string
      try {
        content = readFileSync(file, 'utf8')
      } catch {
        continue
      }
      if (NAIVE_BOUNDARY_PATTERN.test(content)) {
        offenders.push(file)
      }
    }
    expect(offenders).toEqual([])
  })
})
