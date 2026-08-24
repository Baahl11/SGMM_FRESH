class WhatsAppService {
  private apiKey: string;
  private phoneNumberId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';
  
  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    
    if (!this.apiKey || !this.phoneNumberId) {
      console.warn('⚠️  WhatsApp API credentials not configured');
    }
  }
  
  async sendMessage(to: string, message: string, templateName?: string) {
    try {
      // Validar configuración
      if (!this.apiKey || !this.phoneNumberId) {
        throw new Error('WhatsApp API credentials not configured');
      }
      
      // Limpiar número de teléfono (remover espacios, guiones, etc.)
      const cleanPhone = this.cleanPhoneNumber(to);
      
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      
      const payload = templateName ? {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "es_MX" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: message }]
            }
          ]
        }
      } : {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: { body: message }
      };
      
      console.log(`📱 Sending WhatsApp to ${cleanPhone}:`, message.substring(0, 50) + '...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`WhatsApp API Error: ${JSON.stringify(error)}`);
      }
      
      const result = await response.json();
      console.log('✅ WhatsApp sent successfully:', result.messages[0].id);
      
      return {
        success: true,
        messageId: result.messages[0].id,
        provider: 'whatsapp',
        to: cleanPhone
      };
      
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      throw error;
    }
  }
  
  async sendAppointmentReminder(appointment: any, hoursBeforeType: '24h' | '2h') {
    const patientName = appointment.patient_name;
    const appointmentDate = new Date(appointment.fecha).toLocaleDateString('es-MX');
    const appointmentTime = appointment.appointment_time || 'por confirmar';
    
    const messages = {
      '24h': `Hola ${patientName}! 👋\n\nTe recordamos que tienes una cita médica mañana:\n📅 ${appointmentDate}\n⏰ ${appointmentTime}\n\nPor favor llega 15 minutos antes.\n\n¡Te esperamos! 🏥`,
      '2h': `Hola ${patientName}! 👋\n\nTu cita médica es en 2 horas:\n📅 Hoy\n⏰ ${appointmentTime}\n\nPor favor confirma tu asistencia respondiendo a este mensaje.\n\n¡Te esperamos! 🏥`
    };
    
    const message = messages[hoursBeforeType];
    return await this.sendMessage(appointment.patient_whatsapp, message);
  }
  
  async sendCustomMessage(to: string, message: string) {
    return await this.sendMessage(to, message);
  }
  
  async sendBulkMessages(recipients: { phone: string; name: string }[], message: string) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const personalizedMessage = message.replace(/\{nombre\}/g, recipient.name);
        const result = await this.sendMessage(recipient.phone, personalizedMessage);
        results.push({
          ...result,
          recipient: recipient.name,
          phone: recipient.phone
        });
        
        // Delay entre mensajes para evitar rate limiting
        await this.delay(1000);
        
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          recipient: recipient.name,
          phone: recipient.phone
        });
      }
    }
    
    return results;
  }
  
  private cleanPhoneNumber(phone: string): string {
    // Remover espacios, guiones, paréntesis
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Si empieza con +52, mantenerlo
    if (cleaned.startsWith('+52')) {
      return cleaned;
    }
    
    // Si empieza con 52, agregar +
    if (cleaned.startsWith('52')) {
      return '+' + cleaned;
    }
    
    // Si es número mexicano sin código de país, agregarlo
    if (cleaned.length === 10) {
      return '+52' + cleaned;
    }
    
    return cleaned;
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Método para verificar configuración
  isConfigured(): boolean {
    return !!(this.apiKey && this.phoneNumberId);
  }
  
  // Método para modo demo/testing
  async sendDemo(to: string, message: string) {
    console.log(`📱 DEMO MODE - WhatsApp would be sent to ${to}:`, message);
    return {
      success: true,
      messageId: 'demo_' + Date.now(),
      provider: 'whatsapp_demo',
      to: to
    };
  }
}

export default new WhatsAppService();
