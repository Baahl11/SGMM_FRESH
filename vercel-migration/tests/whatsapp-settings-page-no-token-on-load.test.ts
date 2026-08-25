import { describe, expect, it } from 'vitest'

// HANDOFF_MAESTRO_V2 seccion 3 (P0 -- app/dashboard/settings/whatsapp/page.tsx
// seleccionaba whatsapp_access_token directo desde el navegador via Supabase
// client, exponiendo el token real en el estado de React y en el trafico de
// red del cliente). El panel ahora debe construir su estado a partir de la
// respuesta ya saneada de GET /api/user/whatsapp-settings (que expone
// whatsapp_has_access_token, nunca el token). Este mapper fija el contrato:
// el token nunca llega al estado del cliente al cargar, ni siquiera si el
// backend regresara el campo por error (defensa en profundidad).

import {
  mapWhatsAppSettingsFromApi,
  type WhatsAppSettingsApiResponse,
} from '@/app/dashboard/settings/whatsapp/settings-mapper'

describe('mapWhatsAppSettingsFromApi nunca expone el access token al cargar', () => {
  it('deja accessToken vacio aunque el backend regrese whatsapp_access_token por error', () => {
    // Simula una regresion futura en la ruta API (el campo no forma parte
    // del contrato tipado): el mapper del cliente debe ignorarlo pase lo
    // que pase.
    const responseWithLeakedToken = {
      whatsapp_enabled: true,
      whatsapp_phone_number_id: 'phone-1',
      whatsapp_business_account_id: 'biz-1',
      whatsapp_has_access_token: true,
      whatsapp_access_token: 'EAA_super_secreto_no_debe_llegar_al_cliente',
    } as WhatsAppSettingsApiResponse

    const result = mapWhatsAppSettingsFromApi(responseWithLeakedToken)

    expect(result.accessToken).toBe('')
    expect(JSON.stringify(result)).not.toContain('super_secreto')
  })

  it('expone hasAccessToken a partir de whatsapp_has_access_token', () => {
    const withToken = mapWhatsAppSettingsFromApi({ whatsapp_has_access_token: true })
    const withoutToken = mapWhatsAppSettingsFromApi({ whatsapp_has_access_token: false })

    expect(withToken.hasAccessToken).toBe(true)
    expect(withoutToken.hasAccessToken).toBe(false)
  })

  it('usa valores por defecto seguros cuando data es null', () => {
    const result = mapWhatsAppSettingsFromApi(null)

    expect(result).toEqual({
      enabled: false,
      phoneNumberId: '',
      businessAccountId: '',
      accessToken: '',
      hasAccessToken: false,
    })
  })
})
