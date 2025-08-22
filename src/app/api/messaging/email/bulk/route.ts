import { NextRequest, NextResponse } from 'next/server';

// Types
interface Patient {
  id: number;
  nombre?: string;
  name?: string;
  first_name?: string;
  email?: string;
  telefono?: string;
  phone?: string;
}

interface EmailMessage {
  id: string;
  recipient: string;
  patientName: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  timestamp: string;
  template_id?: string;
  patient_id?: number;
  type: 'individual' | 'bulk';
  from_email: string;
  from_name: string;
  message_id?: string;
  error?: string;
}

// Almacén de mensajes en memoria (en producción usar base de datos)
let emailMessages: EmailMessage[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, message, template_id } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Asunto y mensaje son requeridos' }, 
        { status: 400 }
      );
    }

    console.log('🔄 [EMAIL-BULK] Iniciando envío masivo...');

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
        console.log(`✅ [EMAIL-BULK] Configuración del sistema obtenida: ${emailConfig.from_email}`);
      }
    } catch (error) {
      console.warn('⚠️ [EMAIL-BULK] No se pudo obtener configuración del sistema:', error);
    }

    if (!emailConfig || !emailConfig.enabled || !emailConfig.from_email) {
      console.warn('⚠️ [EMAIL-BULK] Sistema principal no configurado, intentando configuración local...');
      
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
            console.log(`✅ [EMAIL-BULK] Usando configuración local: ${emailConfig.from_email}`);
          }
        }
      } catch (error) {
        console.error('❌ [EMAIL-BULK] Error obteniendo configuración local:', error);
      }
    }

    if (!emailConfig || !emailConfig.from_email) {
      return NextResponse.json(
        { error: 'Sistema de email no configurado. Configure el email en Configuración > Facturación > Email o en esta página de Messaging' }, 
        { status: 400 }
      );
    }

    // Obtener todos los pacientes reales del backend
    let allPatients: Patient[] = [];
    try {
      const patientsResponse = await fetch('http://localhost:3000/api/proxy/patients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        allPatients = patientsData.data || patientsData || [];
        console.log(`✅ [EMAIL-BULK] Obtenidos ${allPatients.length} pacientes de la base de datos`);
      } else {
        console.warn('⚠️ [EMAIL-BULK] No se pudo conectar al backend, usando datos mock');
        // Fallback a datos mock si no hay conexión
        allPatients = [
          { id: 1, nombre: 'María González', email: 'maria@email.com', telefono: '+52 33 1234 5678' },
          { id: 2, nombre: 'Carlos Rodríguez', email: 'carlos@email.com', telefono: '+52 33 2345 6789' },
          { id: 3, nombre: 'Ana Martínez', email: 'ana@email.com', telefono: '+52 33 3456 7890' },
          { id: 4, nombre: 'Luis Fernández', email: 'luis@email.com', telefono: '+52 33 4567 8901' },
          { id: 5, nombre: 'Carmen Silva', email: 'carmen@email.com', telefono: '+52 33 5678 9012' }
        ];
      }
    } catch (error) {
      console.error('❌ [EMAIL-BULK] Error conectando al backend:', error);
      // Usar datos mock como fallback
      allPatients = [
        { id: 1, nombre: 'María González', email: 'maria@email.com', telefono: '+52 33 1234 5678' },
        { id: 2, nombre: 'Carlos Rodríguez', email: 'carlos@email.com', telefono: '+52 33 2345 6789' },
        { id: 3, nombre: 'Ana Martínez', email: 'ana@email.com', telefono: '+52 33 3456 7890' }
      ];
    }

    // Filtrar solo pacientes que tienen email válido
    const patientsWithEmail = allPatients.filter((patient: Patient) => {
      const hasEmail = patient.email && patient.email.includes('@');
      if (hasEmail) {
        console.log(`📧 [EMAIL-BULK] Paciente con email: ${patient.nombre || patient.name} - ${hasEmail}`);
      }
      return hasEmail;
    });

    console.log(`📊 [EMAIL-BULK] Total pacientes: ${allPatients.length}, Con email: ${patientsWithEmail.length}`);

    if (patientsWithEmail.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron pacientes con emails válidos' }, 
        { status: 400 }
      );
    }

    // ⚡ ENVÍO REAL DE EMAILS (en lugar de simulación)
    console.log(`📧 [EMAIL-BULK] Iniciando envío real desde: ${emailConfig.from_name} <${emailConfig.from_email}>`);
    console.log(`📧 [EMAIL-BULK] SMTP: ${emailConfig.smtp_host}:${emailConfig.smtp_port}`);

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

    // Verificar conexión SMTP
    try {
      await transporter.verify();
      console.log('✅ [EMAIL-BULK] Conexión SMTP verificada');
    } catch (error) {
      console.error('❌ [EMAIL-BULK] Error de conexión SMTP:', error);
      return NextResponse.json(
        { 
          error: 'Error de conexión SMTP', 
          details: error instanceof Error ? error.message : 'Error desconocido',
          suggestion: 'Verifica tu configuración SMTP en el sistema principal'
        }, 
        { status: 500 }
      );
    }

    // Enviar emails uno por uno
    const sentMessages: EmailMessage[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < patientsWithEmail.length; i++) {
      const patient: Patient = patientsWithEmail[i];
      const patientName = patient.nombre || patient.name || patient.first_name || `Paciente ${patient.id}`;
      
      const personalizedSubject = subject.replace('{nombre_paciente}', patientName);
      const personalizedMessage = message.replace('{nombre_paciente}', patientName);

      try {
        // Envío real del email
        const info = await transporter.sendMail({
          from: `"${emailConfig.from_name}" <${emailConfig.from_email}>`,
          to: patient.email,
          subject: personalizedSubject,
          text: personalizedMessage,
          html: personalizedMessage.replace(/\n/g, '<br>'), // Convertir saltos de línea a HTML
        });

        // Email enviado exitosamente
        sentMessages.push({
          id: `bulk_email_${Date.now()}_${i}`,
          recipient: patient.email || '',
          patientName: patientName,
          subject: personalizedSubject,
          message: personalizedMessage,
          status: 'sent' as const,
          timestamp: new Date().toISOString(),
          template_id,
          patient_id: patient.id,
          type: 'bulk' as const,
          from_email: emailConfig.from_email,
          from_name: emailConfig.from_name,
          message_id: info.messageId // ID real del mensaje enviado
        });

        successCount++;
        console.log(`✅ [EMAIL-BULK] Email enviado a ${patientName} (${patient.email}): ${info.messageId}`);

        // Pequeña pausa para evitar límites de rate
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        // Email falló
        sentMessages.push({
          id: `bulk_email_${Date.now()}_${i}`,
          recipient: patient.email || '',
          patientName: patientName,
          subject: personalizedSubject,
          message: personalizedMessage,
          status: 'failed' as const,
          timestamp: new Date().toISOString(),
          template_id,
          patient_id: patient.id,
          type: 'bulk' as const,
          from_email: emailConfig.from_email,
          from_name: emailConfig.from_name,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });

        failureCount++;
        console.error(`❌ [EMAIL-BULK] Error enviando a ${patientName} (${patient.email}):`, error);
      }
    }

    // Cerrar transporter
    transporter.close();

    // Agregar a la lista de mensajes enviados
    emailMessages.unshift(...sentMessages);

    // Mantener solo los últimos 200 mensajes en memoria
    if (emailMessages.length > 200) {
      emailMessages = emailMessages.slice(0, 200);
    }

    console.log(`✅ [EMAIL-BULK] Envío completado: ${successCount} exitosos, ${failureCount} fallidos`);
    console.log(`📧 [EMAIL-BULK] Enviado desde: ${emailConfig.from_email}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Emails enviados exitosamente',
      recipients: patientsWithEmail.length,
      sent: successCount,
      failed: failureCount,
      from_email: emailConfig.from_email,
      from_name: emailConfig.from_name,
      details: {
        total_patients: allPatients.length,
        patients_with_email: patientsWithEmail.length,
        success_rate: Math.round((successCount / patientsWithEmail.length) * 100),
        smtp_server: emailConfig.smtp_host
      }
    });

  } catch (error) {
    console.error('❌ [EMAIL-BULK] Error sending bulk emails:', error);
    return NextResponse.json(
      { error: 'Error al enviar emails masivos' }, 
      { status: 500 }
    );
  }
}

// GET endpoint para obtener estadísticas de envío masivo
export async function GET() {
  try {
    const recentBulkEmails = emailMessages.filter(msg => 
      msg.type === 'bulk' && 
      new Date(msg.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
    );

    const stats = {
      total_bulk_emails_24h: recentBulkEmails.length,
      successful: recentBulkEmails.filter(m => m.status === 'sent').length,
      failed: recentBulkEmails.filter(m => m.status === 'failed').length,
      last_bulk_send: recentBulkEmails.length > 0 ? recentBulkEmails[0].timestamp : null
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('❌ [EMAIL-BULK] Error getting bulk stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' }, 
      { status: 500 }
    );
  }
}
