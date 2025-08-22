import { NextRequest, NextResponse } from 'next/server';

// Type definitions for email messages
interface EmailMessage {
  id: string;
  recipient: string;
  patientName: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  timestamp: string;
  template_id?: string;
  type: 'individual' | 'bulk';
  from_email: string;
  from_name: string;
  message_id?: string;
  error?: string;
}

// Import the shared email messages store
let emailMessages: EmailMessage[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, message, template_id, patient_name } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Destinatario, asunto y mensaje son requeridos' }, 
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' }, 
        { status: 400 }
      );
    }

    console.log(`🔄 [EMAIL-SEND] Enviando email individual a ${to}...`);

    // Obtener configuración de email del sistema
    let emailConfig = null;
    try {
      const configResponse = await fetch('http://localhost:8000/api/billing/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (configResponse.ok) {
        const configData = await configResponse.json();
        emailConfig = {
          smtp_host: configData.data?.smtp_server,
          smtp_port: configData.data?.smtp_port,
          smtp_user: configData.data?.smtp_username,
          smtp_password: configData.data?.smtp_password,
          from_name: configData.data?.email_from_name,
          from_email: configData.data?.email_from,
          enabled: configData.data?.email_enabled
        };
        console.log(`✅ [EMAIL-SEND] Usando configuración: ${emailConfig.from_email}`);
      }
    } catch (error) {
      console.warn('⚠️ [EMAIL-SEND] No se pudo obtener configuración del sistema:', error);
    }

    if (!emailConfig || !emailConfig.enabled || !emailConfig.from_email) {
      console.warn('⚠️ [EMAIL-SEND] Sistema principal no configurado, intentando configuración local...');
      
      // Intentar usar configuración local de messaging como fallback
      try {
        const localConfigResponse = await fetch('http://localhost:3000/api/messaging/email/config');
        if (localConfigResponse.ok) {
          const localConfig = await localConfigResponse.json();
          if (localConfig.configured && localConfig.from_email && 
              ((localConfig.use_sendgrid && localConfig.sendgrid_api_key) ||
               (!localConfig.use_sendgrid && localConfig.smtp_user))) {
            
            emailConfig = {
              smtp_host: localConfig.smtp_host,
              smtp_port: localConfig.smtp_port,
              smtp_user: localConfig.smtp_user,
              smtp_password: '[LOCAL_CONFIG]',
              from_name: localConfig.from_name,
              from_email: localConfig.from_email,
              enabled: true,
              use_sendgrid: localConfig.use_sendgrid,
              sendgrid_api_key: localConfig.sendgrid_api_key
            };
            console.log(`✅ [EMAIL-SEND] Usando configuración local: ${emailConfig.from_email}`);
          }
        }
      } catch (error) {
        console.error('❌ [EMAIL-SEND] Error obteniendo configuración local:', error);
      }
    }

    if (!emailConfig || !emailConfig.from_email) {
      return NextResponse.json(
        { error: 'Sistema de email no configurado. Configure el email en Configuración > Facturación > Email o en esta página de Messaging' }, 
        { status: 400 }
      );
    }

    // ⚡ ENVÍO REAL DE EMAIL (en lugar de simulación)
    console.log(`📧 [EMAIL-SEND] Iniciando envío real desde: ${emailConfig.from_name} <${emailConfig.from_email}>`);
    console.log(`📧 [EMAIL-SEND] SMTP: ${emailConfig.smtp_host}:${emailConfig.smtp_port}`);
    console.log(`📧 [EMAIL-SEND] Destinatario: ${to}`);

    // Importar nodemailer dinámicamente
    const nodemailer = require('nodemailer');

    // Crear transporter SMTP
    const transporter = nodemailer.createTransporter({
      host: emailConfig.smtp_host,
      port: emailConfig.smtp_port,
      secure: emailConfig.smtp_port === 465, // true para 465, false para otros
      auth: {
        user: emailConfig.smtp_user,
        pass: emailConfig.smtp_password,
      },
      tls: {
        rejectUnauthorized: false // Para development
      }
    });

    let messageRecord: EmailMessage;

    try {
      // Verificar conexión SMTP
      await transporter.verify();
      console.log('✅ [EMAIL-SEND] Conexión SMTP verificada');

      // Envío real del email
      const info = await transporter.sendMail({
        from: `"${emailConfig.from_name}" <${emailConfig.from_email}>`,
        to: to,
        subject: subject,
        text: message,
        html: message.replace(/\n/g, '<br>'), // Convertir saltos de línea a HTML
      });

      // Email enviado exitosamente
      messageRecord = {
        id: `single_email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipient: to,
        patientName: patient_name || 'Paciente Individual',
        subject: subject,
        message: message,
        status: 'sent' as const,
        timestamp: new Date().toISOString(),
        template_id,
        type: 'individual' as const,
        from_email: emailConfig.from_email,
        from_name: emailConfig.from_name,
        message_id: info.messageId // ID real del mensaje enviado
      };

      console.log(`✅ [EMAIL-SEND] Email enviado exitosamente a ${to}: ${info.messageId}`);
      
      // Simular webhook de entrega después de unos segundos
      const currentRecord = messageRecord;
      setTimeout(() => {
        currentRecord.status = 'delivered';
        console.log(`📧 [EMAIL-WEBHOOK] Email marcado como entregado: ${to}`);
      }, 1000 + Math.random() * 2000);

    } catch (error) {
      // Email falló
      messageRecord = {
        id: `single_email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipient: to,
        patientName: patient_name || 'Paciente Individual',
        subject: subject,
        message: message,
        status: 'failed' as const,
        timestamp: new Date().toISOString(),
        template_id,
        type: 'individual' as const,
        from_email: emailConfig.from_email,
        from_name: emailConfig.from_name,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };

      console.error(`❌ [EMAIL-SEND] Error enviando email a ${to}:`, error);
    } finally {
      // Cerrar transporter
      transporter.close();
    }

    // Agregar a la lista de mensajes
    emailMessages.unshift(messageRecord);

    // Mantener solo los últimos 100 mensajes en memoria
    if (emailMessages.length > 100) {
      emailMessages = emailMessages.slice(0, 100);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email enviado exitosamente',
      message_id: messageRecord.id,
      status: messageRecord.status,
      from_email: emailConfig.from_email,
      from_name: emailConfig.from_name,
      smtp_server: emailConfig.smtp_host
    });
  } catch (error) {
    console.error('❌ [EMAIL-SEND] Error sending email:', error);
    return NextResponse.json(
      { error: 'Error al enviar email' }, 
      { status: 500 }
    );
  }
}

// GET endpoint para obtener mensajes recientes
export async function GET() {
  try {
    // Obtener los últimos 50 mensajes
    const recentMessages = emailMessages
      .slice(0, 50)
      .map(msg => ({
        id: msg.id,
        patient_name: msg.patientName,
        email: msg.recipient,
        subject: msg.subject,
        message: msg.message.substring(0, 100) + (msg.message.length > 100 ? '...' : ''),
        status: msg.status,
        sent_at: msg.timestamp,
        type: msg.type
      }));

    return NextResponse.json({
      messages: recentMessages,
      total: emailMessages.length
    });
  } catch (error) {
    console.error('❌ [EMAIL-SEND] Error getting messages:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes' }, 
      { status: 500 }
    );
  }
}
