import { beforeEach, describe, expect, it, vi } from 'vitest'

// Fase 1 (consolidacion de mensajeria): MessagingWorker.processJob hacia un
// SELECT status='pending' (en processJobs) y luego, por separado, un UPDATE
// incondicional a 'processing'. Dos invocaciones concurrentes del worker
// podian tomar el mismo job y enviarlo dos veces -- bug real, no
// hipotetico. Este test fija que claimJob() hace el UPDATE atomico
// (WHERE status='pending' ... RETURNING) y que dos llamadas concurrentes
// sobre el mismo job solo dejan ganar a una.

let jobStatus = 'pending'

function makeSupabase() {
  return {
    from: (table: string) => {
      if (table !== 'messaging_jobs') {
        throw new Error(`Tabla inesperada en este test: ${table}`)
      }
      return {
        update: (patch: { status?: string }) => ({
          eq: (_col1: string, _id: string) => ({
            eq: (_col2: string, expectedStatus: string) => ({
              select: async () => {
                if (jobStatus !== expectedStatus) {
                  return { data: [], error: null }
                }
                jobStatus = patch.status ?? jobStatus
                return { data: [{ id: 'job-1' }], error: null }
              },
            }),
          }),
        }),
      }
    },
  }
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => makeSupabase(),
}))

describe('MessagingWorker.claimJob (claim atomico)', () => {
  beforeEach(() => {
    jobStatus = 'pending'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
  })

  it('dos claims concurrentes sobre el mismo job: solo uno gana', async () => {
    const { MessagingWorker } = await import('@/lib/workers/messaging-worker')
    const worker = new MessagingWorker() as any

    const [first, second] = await Promise.all([
      worker.claimJob('job-1'),
      worker.claimJob('job-1'),
    ])

    expect([first, second].filter(Boolean)).toHaveLength(1)
    expect([first, second].filter((v) => v === false)).toHaveLength(1)
  })

  it('un claim sobre un job que ya no esta pending retorna false', async () => {
    jobStatus = 'processing'
    const { MessagingWorker } = await import('@/lib/workers/messaging-worker')
    const worker = new MessagingWorker() as any

    const claimed = await worker.claimJob('job-1')

    expect(claimed).toBe(false)
  })
})
