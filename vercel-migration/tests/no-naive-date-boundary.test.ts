import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Adenda V2.1, hallazgo A-5: interpolar un string de fecha seguido de hora
// sin offset (00:00:00 / 23:59:59) hace que Postgres interprete el limite
// como UTC, corriendo la ventana del dia seis horas en Mexico. Las 7
// ubicaciones citadas por la adenda (mas 3 instancias adicionales del mismo
// bug encontradas por este mismo test durante la implementacion) ya se
// reemplazaron por clinicDateStringRangeUtc()/addDaysToDateString()
// (lib/timezone.ts y su duplicado deliberado en mcp-server/src/utils/timezone.ts).
// Este test falla si el patron reaparece en cualquier archivo .ts/.tsx del
// repo, para que el bug no pueda volver a colarse sin que la suite lo note.
//
// El patron exige que la hora NO vaya seguida de "Z": eso es exactamente lo
// que distingue el bug (`${date}T00:00:00`, Postgres lo interpreta como
// UTC) del uso legitimo dentro de la propia utilidad de zona horaria
// (`${localDate}T00:00:00Z`, UTC explicito e intencional, ancla interna de
// clinicDayRangeUtc/clinicDateStringRangeUtc). No hace falta ninguna lista
// de archivos exceptuados -- el patron correcto simplemente no matchea.

const NAIVE_BOUNDARY_PATTERN = /\$\{[^}]+\}T(00:00:00|23:59:59)(?!Z)/

function listSourceFiles(): string[] {
  // -c (cached/trackeados) -o (otros, sin trackear) --exclude-standard
  // (respeta .gitignore): un archivo nuevo todavia sin `git add` también
  // debe pasar por el scan, no solo lo que ya esta en el indice.
  const out = execSync('git ls-files -co --exclude-standard', { encoding: 'utf8' })
  return out
    .split('\n')
    .filter(Boolean)
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .filter((f) => !f.startsWith('tests/'))
}

describe('adenda V2.1, A-5: sin límites de fecha naive (T00:00:00/T23:59:59 sin offset)', () => {
  it('ningún archivo de código interpola un string de fecha con hora sin offset', () => {
    const offenders: string[] = []
    for (const file of listSourceFiles()) {
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
