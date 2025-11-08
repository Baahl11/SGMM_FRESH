import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface SMTPConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
}

class EmailService {
  private isConfigured: boolean = false;
  private smtpTransporter: Transporter | null = null;
  
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

  // ============== SMTP NATIVE METHODS ==============
  
  /**
   * Configure SMTP transporter with doctor's own email account
   */
  configureSMTP(config: SMTPConfig) {
    try {
      this.smtpTransporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_secure,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_password,
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
      });
      
      console.log('✅ SMTP configured:', config.smtp_host);
      return true;
    } catch (error) {
      console.error('❌ Error configuring SMTP:', error);
      return false;
    }
  }

  /**
   * Send email via SMTP (doctor's own email)
   */
  async sendViaSMTP(config: SMTPConfig, to: string, subject: string, html: string, text?: string) {
    try {
      // Create transporter
      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_secure,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_password,
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
      });

      // Verify connection
      try {
        await transporter.verify();
        console.log('✅ SMTP connection verified');
      } catch (verifyError) {
        console.error('❌ SMTP verification failed:', verifyError);
        throw new Error('SMTP connection failed. Check your credentials.');
      }

      // Send email
      const info = await transporter.sendMail({
        from: `"${config.from_name}" <${config.from_email}>`,
        to,
        subject,
        html,
        text,
      });

      console.log('✅ Email sent via SMTP:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
        provider: 'smtp',
        to,
      };
    } catch (error: any) {
      console.error('❌ Error sending via SMTP:', error);
      
      // Check for rate limit errors
      const errorMessage = error.message || '';
      if (
        errorMessage.includes('Daily user sending quota exceeded') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('quota')
      ) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }

      throw error;
    }
  }

  /**
   * Send email with automatic fallback: SMTP -> SendGrid/Resend
   */
  async sendWithFallback(
    smtpConfig: SMTPConfig | null,
    resendApiKey: string | null,
    to: string,
    subject: string,
    html: string,
    text?: string
  ) {
    // Try SMTP first if configured
    if (smtpConfig) {
      try {
        const result = await this.sendViaSMTP(smtpConfig, to, subject, html, text);
        return result;
      } catch (error: any) {
        console.warn('⚠️  SMTP failed, trying fallback...', error.message);
        
        // If rate limit exceeded, try Resend
        if (error.message === 'RATE_LIMIT_EXCEEDED' && resendApiKey) {
          return await this.sendViaResend(resendApiKey, smtpConfig.from_email, to, subject, html, text);
        }
        
        // Otherwise, try SendGrid
        if (this.isConfigured) {
          return await this.sendCustomEmail(to, subject, html, true);
        }
        
        throw error;
      }
    }

    // Fallback to SendGrid
    if (this.isConfigured) {
      return await this.sendCustomEmail(to, subject, html, true);
    }

    throw new Error('No email provider configured');
  }

  /**
   * Send via Resend API
   */
  async sendViaResend(
    apiKey: string,
    from: string,
    to: string,
    subject: string,
    html: string,
    text?: string
  ) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          html,
          text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Resend API error');
      }

      console.log('✅ Email sent via Resend:', data.id);

      return {
        success: true,
        messageId: data.id,
        provider: 'resend',
        to,
      };
    } catch (error: any) {
      console.error('❌ Error sending via Resend:', error);
      throw error;
    }
  }

  /**
   * Replace template variables
   */
  replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });
    return result;
  }

  /**
   * Detect email provider from email address
   */
  detectProvider(email: string): { provider: string; smtp_host: string; smtp_port: number } {
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (domain?.includes('gmail')) {
      return { provider: 'gmail', smtp_host: 'smtp.gmail.com', smtp_port: 587 };
    }
    if (domain?.includes('outlook') || domain?.includes('hotmail') || domain?.includes('live')) {
      return { provider: 'outlook', smtp_host: 'smtp-mail.outlook.com', smtp_port: 587 };
    }
    if (domain?.includes('yahoo')) {
      return { provider: 'yahoo', smtp_host: 'smtp.mail.yahoo.com', smtp_port: 587 };
    }
    
    return { provider: 'custom', smtp_host: '', smtp_port: 587 };
  }

  // ============== TRIAL EMAILS ==============

  /**
   * Send welcome email when trial is activated
   */
  async sendTrialWelcomeEmail(userEmail: string, userName: string, planName: string, trialEndDate: string) {
    const formattedDate = new Date(trialEndDate).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = '🎉 ¡Bienvenido a SGMM Pro! - Tu prueba gratis de 7 días comienza ahora';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0 0 10px 0; font-size: 32px;">🎉 ¡Bienvenido a SGMM Pro!</h1>
          <p style="margin: 0; font-size: 18px; opacity: 0.95;">Tu prueba gratuita de 7 días comienza ahora</p>
        </div>
        
        <div style="background: white; padding: 40px 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">¡Hola ${userName}! 👋</h2>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Nos emociona tenerte con nosotros. Has activado exitosamente tu plan <strong>${planName}</strong> 
            y ahora tienes acceso completo a todas las funcionalidades del sistema.
          </p>
          
          <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 25px; border-radius: 10px; margin: 30px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0 0 10px 0; color: #667eea; font-weight: bold; font-size: 14px;">📅 TU PERÍODO DE PRUEBA</p>
            <p style="margin: 0; color: #333; font-size: 20px; font-weight: bold;">${formattedDate}</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">7 días completos para explorar todas las funciones</p>
          </div>

          <h3 style="color: #333; margin: 30px 0 20px 0;">🚀 Comienza en 4 pasos simples:</h3>
          
          <div style="margin: 20px 0;">
            <div style="display: flex; align-items: start; margin-bottom: 20px;">
              <div style="background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">1</div>
              <div>
                <h4 style="margin: 0 0 5px 0; color: #333;">Completa tu perfil</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">Agrega la información de tu consultorio y personaliza tu cuenta</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: start; margin-bottom: 20px;">
              <div style="background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">2</div>
              <div>
                <h4 style="margin: 0 0 5px 0; color: #333;">Registra tu primer paciente</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">Crea expedientes digitales completos en minutos</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: start; margin-bottom: 20px;">
              <div style="background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">3</div>
              <div>
                <h4 style="margin: 0 0 5px 0; color: #333;">Agenda una cita</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">Usa el calendario inteligente con recordatorios automáticos</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: start; margin-bottom: 20px;">
              <div style="background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">4</div>
              <div>
                <h4 style="margin: 0 0 5px 0; color: #333;">Crea un expediente médico</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">Documenta consultas con fotos y notas detalladas</p>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 40px 0 30px 0;">
            <a href="https://vercel-migration-og51h7lp1-guillermo-melgarejos-projects.vercel.app/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
              Ir al Dashboard
            </a>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h4 style="margin: 0 0 15px 0; color: #333;">💡 Características incluidas en tu plan ${planName}:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;">
              <li>Gestión ilimitada de pacientes y expedientes</li>
              <li>Calendario con recordatorios automáticos</li>
              <li>Expedientes médicos digitales con fotos</li>
              <li>Reportes y estadísticas en tiempo real</li>
              <li>Inventario y control de productos</li>
              <li>Soporte técnico prioritario 24/7</li>
            </ul>
          </div>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #2196f3;">
            <p style="margin: 0; color: #1565c0; font-size: 14px;">
              <strong>🛡️ Sin compromiso:</strong> Puedes cancelar en cualquier momento durante tu período de prueba. 
              No se te cobrará nada hasta que decidas continuar.
            </p>
          </div>

          <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e1e5e9;">
            <h4 style="margin: 0 0 15px 0; color: #333;">¿Necesitas ayuda?</h4>
            <p style="margin: 0 0 10px 0; color: #555;">Estamos aquí para ti:</p>
            <ul style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;">
              <li>📧 Email: soporte@sgmm.pro</li>
              <li>📚 <a href="https://vercel-migration-og51h7lp1-guillermo-melgarejos-projects.vercel.app/documentacion" style="color: #667eea; text-decoration: none;">Documentación completa</a></li>
              <li>💬 Chat en vivo disponible 24/7</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e1e5e9;">
            <p style="color: #888; margin: 0 0 5px 0; font-size: 14px;">
              ¡Gracias por confiar en SGMM Pro! 🚀
            </p>
            <p style="color: #888; margin: 0; font-size: 14px;">
              <strong>Equipo SGMM Pro</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    const text = `¡Bienvenido a SGMM Pro! Tu prueba gratis de 7 días comienza ahora.

Hola ${userName},

Has activado exitosamente tu plan ${planName}. Tu período de prueba termina el ${formattedDate}.

Comienza en 4 pasos:
1. Completa tu perfil
2. Registra tu primer paciente
3. Agenda una cita
4. Crea un expediente médico

Ve al dashboard: https://vercel-migration-og51h7lp1-guillermo-melgarejos-projects.vercel.app/dashboard

¿Necesitas ayuda? Contáctanos en soporte@sgmm.pro

¡Gracias por confiar en SGMM Pro!
Equipo SGMM Pro`;

    return await this.sendCustomEmail(userEmail, subject, html, true);
  }

  /**
   * Send reminder email 2 days before trial expires
   */
  async sendTrialExpirationReminder(
    userEmail: string, 
    userName: string, 
    planName: string, 
    daysRemaining: number,
    trialEndDate: string
  ) {
    const formattedDate = new Date(trialEndDate).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const subject = `⏰ Tu prueba gratis termina en ${daysRemaining} días - Continúa con SGMM Pro`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0 0 10px 0; font-size: 32px;">⏰ Tu prueba termina pronto</h1>
          <p style="margin: 0; font-size: 20px; opacity: 0.95; font-weight: bold;">Quedan ${daysRemaining} días</p>
        </div>
        
        <div style="background: white; padding: 40px 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hola ${userName},</h2>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Tu período de prueba gratuita del plan <strong>${planName}</strong> termina el:
          </p>
          
          <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffe5b4 100%); padding: 25px; border-radius: 10px; margin: 30px 0; border-left: 4px solid #ff9800; text-align: center;">
            <p style="margin: 0 0 5px 0; color: #e65100; font-weight: bold; font-size: 14px;">⏰ FECHA DE EXPIRACIÓN</p>
            <p style="margin: 0; color: #333; font-size: 20px; font-weight: bold;">${formattedDate}</p>
            <p style="margin: 15px 0 0 0; color: #d84315; font-size: 16px; font-weight: bold;">¡Solo ${daysRemaining} días restantes!</p>
          </div>

          <h3 style="color: #333; margin: 30px 0 20px 0;">🎯 ¿Qué sucede después?</h3>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 15px 0; color: #555; line-height: 1.6;">
              <strong style="color: #333;">Si no agregas un método de pago:</strong>
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
              <li>Perderás acceso a tu cuenta y datos</li>
              <li>No podrás gestionar pacientes ni citas</li>
              <li>Los expedientes médicos quedarán bloqueados</li>
            </ul>
          </div>

          <div style="background: linear-gradient(135deg, #e3f2fd 0%, #e1f5fe 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <p style="margin: 0 0 15px 0; color: #1565c0; font-weight: bold;">
              ✅ Si continúas con nosotros:
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #1976d2; line-height: 1.8;">
              <li>Mantén todos tus datos y configuraciones</li>
              <li>Acceso ilimitado a todas las funciones</li>
              <li>Soporte prioritario 24/7</li>
              <li>Actualizaciones automáticas incluidas</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <p style="margin: 0 0 20px 0; color: #333; font-size: 18px; font-weight: bold;">
              💳 Continúa sin interrupciones
            </p>
            <a href="https://vercel-migration-og51h7lp1-guillermo-melgarejos-projects.vercel.app/pricing" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); margin-bottom: 15px;">
              Agregar Método de Pago
            </a>
            <p style="margin: 10px 0 0 0; color: #888; font-size: 13px;">
              Planes desde $299 MXN/mes • Cancela cuando quieras
            </p>
          </div>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>🎁 Oferta especial:</strong> Los primeros 100 usuarios que se suscriban obtienen 
              <strong>20% de descuento</strong> durante los primeros 3 meses.
            </p>
          </div>

          <h3 style="color: #333; margin: 30px 0 20px 0;">📊 Tu resumen de uso:</h3>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 15px 0; color: #555; font-size: 14px;">
              Durante tu período de prueba has aprovechado:
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
              <li>✅ Plan ${planName} con todas las funciones</li>
              <li>✅ 7 días completos de acceso ilimitado</li>
              <li>✅ Soporte técnico incluido</li>
            </ul>
          </div>

          <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e1e5e9;">
            <h4 style="margin: 0 0 15px 0; color: #333;">❓ ¿Tienes dudas?</h4>
            <p style="margin: 0 0 15px 0; color: #555;">
              Estamos aquí para ayudarte a tomar la mejor decisión:
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;">
              <li>📧 Email: soporte@sgmm.pro</li>
              <li>💬 Chat en vivo disponible ahora</li>
              <li>📞 Llámanos para una demostración personalizada</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e1e5e9;">
            <p style="color: #888; margin: 0 0 5px 0; font-size: 14px;">
              Gracias por probar SGMM Pro 💜
            </p>
            <p style="color: #888; margin: 0; font-size: 14px;">
              <strong>Equipo SGMM Pro</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    const text = `⏰ Tu prueba gratis termina en ${daysRemaining} días

Hola ${userName},

Tu período de prueba del plan ${planName} termina el ${formattedDate}.

¿Qué sucede después?
- Si no agregas un método de pago, perderás acceso a tu cuenta
- Si continúas, mantienes todos tus datos y configuraciones

Continúa sin interrupciones:
https://vercel-migration-og51h7lp1-guillermo-melgarejos-projects.vercel.app/pricing

🎁 Oferta especial: 20% de descuento los primeros 3 meses

¿Dudas? Contáctanos en soporte@sgmm.pro

Gracias por probar SGMM Pro
Equipo SGMM Pro`;

    return await this.sendCustomEmail(userEmail, subject, html, true);
  }
}

export default new EmailService();
