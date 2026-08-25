export interface WhatsAppSettingsApiResponse {
  whatsapp_enabled?: boolean
  whatsapp_phone_number_id?: string
  whatsapp_business_account_id?: string
  whatsapp_has_access_token?: boolean
}

export interface WhatsAppSettingsViewModel {
  enabled: boolean
  phoneNumberId: string
  businessAccountId: string
  accessToken: string
  hasAccessToken: boolean
}

// HANDOFF_MAESTRO_V2 seccion 3 (P0): el panel de WhatsApp solo debe construir
// su estado a partir de campos no sensibles de GET /api/user/whatsapp-settings.
// accessToken siempre inicia vacio -- el usuario debe volver a pegarlo para
// cambiarlo -- sin importar que traiga el objeto `data` recibido.
export function mapWhatsAppSettingsFromApi(
  data: WhatsAppSettingsApiResponse | null
): WhatsAppSettingsViewModel {
  return {
    enabled: data?.whatsapp_enabled ?? false,
    phoneNumberId: data?.whatsapp_phone_number_id ?? '',
    businessAccountId: data?.whatsapp_business_account_id ?? '',
    accessToken: '',
    hasAccessToken: Boolean(data?.whatsapp_has_access_token),
  }
}
