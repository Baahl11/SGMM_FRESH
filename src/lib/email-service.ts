import sgMail from '@sendgrid/mail';

class EmailService {
  private isConfigured: boolean = false;
  
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
      console.log('✅ SendGrid configured');
    } else {
      console.warn('⚠️  SendGrid API key not configured');
    }
  }
  
  async sendAppointmentReminder(appointment: any, hoursBeforeType: '24h' | '2h') {
    const patientName = appointment.patient_name;
    const appointmentDate = new Date(appointment.fecha).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const appointmentTime = appointment.appointment_time || 'por confirmar';
    const treatmentName = appointment.treatment_name || 'Consulta médica';
    
    const templates = {
      '24h': {
        subject: `Recordatorio: Cita médica mañana - ${treatmentName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🏥 Recordatorio de Cita</h1>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Estimado/a ${patientName},</h2>
              
              <p style="font-size: 16px; color: #555; line-height: 1.6;">
                Le recordamos que tiene una cita médica programada para <strong>mañana</strong>:
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>📅 Fecha:</strong></td>
                    <td style="padding: 8px 0; color: #333;">${appointmentDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>⏰ Hora:</strong></td>
                    <td style="padding: 8px 0; color: #333;">${appointmentTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>🩺 Tratamiento:</strong></td>
                    <td style="padding: 8px 0; color: #333;">${treatmentName}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #1976d2;">
                  <strong>📋 Recordatorios importantes:</strong><br>
                  • Llegue 15 minutos antes de su cita<br>
                  • Traiga su identificación y documentos médicos<br>
                  • Si necesita reprogramar, contáctenos con anticipación
                </p>
              </div>
              
              <p style="color: #555; margin-top: 30px;">
                Si tiene alguna pregunta o necesita reprogramar su cita, no dude en contactarnos.
              </p>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
                <p style="color: #888; margin: 0;">
                  Saludos cordiales,<br>
                  <strong>Equipo Médico</strong>
                </p>
              </div>
            </div>
          </div>
        `
      },
      '2h': {
        subject: `🚨 Su cita médica es en 2 horas - ${treatmentName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🚨 Recordatorio Urgente</h1>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">¡Hola ${patientName}!</h2>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 18px; text-align: center;">
                  <strong>Su cita médica es en aproximadamente 2 horas</strong>
                </p>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>📅 Fecha:</strong></td>
                    <td style="padding: 8px 0; color: #333;">Hoy</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>⏰ Hora:</strong></td>
                    <td style="padding: 8px 0; color: #333; font-size: 18px;"><strong>${appointmentTime}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>🩺 Tratamiento:</strong></td>
                    <td style="padding: 8px 0; color: #333;">${treatmentName}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #0c5460; text-align: center;">
                  <strong>Por favor confirme su asistencia respondiendo a este email</strong>
                </p>
              </div>
              
              <p style="color: #555; text-align: center; font-size: 16px;">
                ¡Nos vemos en un momento! 🏥
              </p>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
                <p style="color: #888; margin: 0;">
                  Saludos cordiales,<br>
                  <strong>Equipo Médico</strong>
                </p>
              </div>
            </div>
          </div>
        `
      }
    };
    
    const template = templates[hoursBeforeType];
    
    return await this.sendCustomEmail(
      appointment.patient_email, 
      template.subject, 
      template.html, 
      true
    );
  }
  
  async sendCustomEmail(to: string, subject: string, content: string, isHtml = false) {
    try {
      if (!this.isConfigured) {
        console.log('📧 DEMO MODE - Email would be sent:', { to, subject });
        return {
          success: true,
          messageId: 'demo_email_' + Date.now(),
          provider: 'email_demo',
          to: to
        };
      }
      
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@clinica.com';
      
      const msg: any = {
        to: to,
        from: fromEmail,
        subject: subject
      };
      
      if (isHtml) {
        msg.html = content;
      } else {
        msg.text = content;
      }
      
      console.log(`📧 Sending email to ${to}: ${subject}`);
      
      const result = await sgMail.send(msg);
      
      console.log('✅ Email sent successfully');
      
      return {
        success: true,
        messageId: result[0].headers['x-message-id'] || 'sent_' + Date.now(),
        provider: 'sendgrid',
        to: to
      };
      
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }
  
  async sendBulkEmails(recipients: { email: string; name: string }[], subject: string, content: string, isHtml = false) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const personalizedSubject = subject.replace(/\{nombre\}/g, recipient.name);
        const personalizedContent = content.replace(/\{nombre\}/g, recipient.name);
        
        const result = await this.sendCustomEmail(
          recipient.email, 
          personalizedSubject, 
          personalizedContent, 
          isHtml
        );
        
        results.push({
          ...result,
          recipient: recipient.name,
          email: recipient.email
        });
        
        // Delay entre emails para evitar rate limiting
        await this.delay(500);
        
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          recipient: recipient.name,
          email: recipient.email
        });
      }
    }
    
    return results;
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Método para verificar configuración
  isReady(): boolean {
    return this.isConfigured;
  }
  
  // Método para modo demo/testing
  async sendDemo(to: string, subject: string, content: string) {
    console.log(`📧 DEMO MODE - Email would be sent to ${to}:`, { subject, content: content.substring(0, 100) + '...' });
    return {
      success: true,
      messageId: 'demo_email_' + Date.now(),
      provider: 'email_demo',
      to: to
    };
  }
}

export default new EmailService();
