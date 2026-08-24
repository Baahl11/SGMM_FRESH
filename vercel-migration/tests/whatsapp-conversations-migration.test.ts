import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// HANDOFF_MAESTRO_V2 sección 3 (P0 — Deriva de esquema): whatsapp_conversations
// vive solo en mcp-server/migrations, fuera del set "oficial" de
// supabase/migrations. Un deploy nuevo que solo aplique supabase/migrations
// rompería el insert del webhook. Este test fija que exista una migración
// canónica idempotente para esa tabla.
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'supabase', 'migrations')

function findCanonicalWhatsappConversationsMigration(): string | null {
  const files = readdirSync(MIGRATIONS_DIR)
  const match = files.find((f) => f.includes('whatsapp_conversations'))
  return match ? path.join(MIGRATIONS_DIR, match) : null
}

describe('reconciliación de esquema: whatsapp_conversations (fase 0)', () => {
  it('existe una migración canónica en supabase/migrations', () => {
    const file = findCanonicalWhatsappConversationsMigration()
    expect(file).not.toBeNull()
    expect(existsSync(file as string)).toBe(true)
  })

  it('la migración es idempotente (CREATE TABLE IF NOT EXISTS) y define las columnas usadas por el webhook', () => {
    const file = findCanonicalWhatsappConversationsMigration()
    const sql = readFileSync(file as string, 'utf8')
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS whatsapp_conversations/)
    for (const column of ['user_id', 'patient_id', 'phone_number', 'message_in', 'message_out', 'message_id', 'responded_by', 'action_taken']) {
      expect(sql).toContain(column)
    }
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/)
  })
})
