import type { SupabaseClient } from '@supabase/supabase-js'

export type DemoIntegrationName =
  | 'email'
  | 'whatsapp'
  | 'sms'
  | 'stripe'
  | 'facturama'
  | 'google_calendar'
  | 'mercadopago'

export type DemoIntegrationConfig = {
  enabled?: boolean
  mock?: boolean
}

export type DemoModeConfigRow = {
  user_id: string
  is_demo_account: boolean
  audit_label: string | null
  seed_profile: string | null
  integrations: Record<string, DemoIntegrationConfig> | null
  demo_expires_at: string | null
}

export type DemoIntegrationPolicy = {
  isDemoAccount: boolean
  shouldSimulate: boolean
  config: DemoIntegrationConfig
}

const DEFAULT_INTEGRATION_CONFIG: DemoIntegrationConfig = {
  enabled: false,
  mock: true,
}

function getIntegrationConfig(
  config: DemoModeConfigRow | null,
  integration: DemoIntegrationName
): DemoIntegrationConfig {
  const raw = config?.integrations?.[integration]
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_INTEGRATION_CONFIG
  }

  return {
    enabled: raw.enabled,
    mock: raw.mock,
  }
}

function isDemoExpired(config: DemoModeConfigRow): boolean {
  if (!config.demo_expires_at) {
    return false
  }

  const expiresAt = new Date(config.demo_expires_at).getTime()
  if (Number.isNaN(expiresAt)) {
    return false
  }

  return Date.now() > expiresAt
}

export async function resolveDemoModeConfig(
  supabase: SupabaseClient,
  userId: string
): Promise<DemoModeConfigRow | null> {
  const { data, error } = await supabase
    .from('demo_mode_config')
    .select('user_id, is_demo_account, audit_label, seed_profile, integrations, demo_expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[DemoMode] Error loading config', { userId, error: error.message })
    return null
  }

  if (!data?.is_demo_account) {
    return null
  }

  if (isDemoExpired(data as DemoModeConfigRow)) {
    return null
  }

  return data as DemoModeConfigRow
}

export function getDemoIntegrationPolicy(
  config: DemoModeConfigRow | null,
  integration: DemoIntegrationName
): DemoIntegrationPolicy {
  const integrationConfig = getIntegrationConfig(config, integration)
  const isDemoAccount = Boolean(config?.is_demo_account)

  if (!isDemoAccount) {
    return {
      isDemoAccount: false,
      shouldSimulate: false,
      config: integrationConfig,
    }
  }

  // Demo accounts simulate by default unless explicitly enabled with mock=false.
  const shouldSimulate = !(
    integrationConfig.enabled === true && integrationConfig.mock === false
  )

  return {
    isDemoAccount,
    shouldSimulate,
    config: integrationConfig,
  }
}

export async function logDemoAuditEvent(
  supabase: SupabaseClient,
  userId: string,
  event: {
    eventType: string
    integration: DemoIntegrationName
    resourceType?: string
    resourceId?: string
    status?: 'simulated' | 'success' | 'failed'
    payload?: Record<string, unknown>
  }
): Promise<void> {
  const { error } = await supabase.from('demo_audit_log').insert({
    user_id: userId,
    event_type: event.eventType,
    integration: event.integration,
    resource_type: event.resourceType ?? null,
    resource_id: event.resourceId ?? null,
    status: event.status ?? 'simulated',
    payload: event.payload ?? {},
  })

  if (error) {
    console.error('[DemoMode] Error writing audit log', {
      userId,
      eventType: event.eventType,
      integration: event.integration,
      error: error.message,
    })
  }
}
