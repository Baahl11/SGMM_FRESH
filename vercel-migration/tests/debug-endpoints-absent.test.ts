import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// fable C1/C12/C14/C15: estos endpoints exponían datos reales, ejecutaban DDL
// o filtraban configuración. El test impide que reaparezcan.
const FORBIDDEN = [
  'app/api/debug',
  'app/api/setup-notes-table',
  'app/api/team/debug',
  'lib/api-auth.ts',
  'lib/auth-service.ts',
]

describe('endpoints/módulos peligrosos eliminados', () => {
  for (const rel of FORBIDDEN) {
    it(`${rel} no existe`, () => {
      expect(existsSync(path.resolve(__dirname, '..', rel))).toBe(false)
    })
  }
})
