'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, 
  Send, 
  Settings, 
  Users, 
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Key,
  User
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_name: string;
  from_email: string;
  sendgrid_api_key: string;
  use_sendgrid: boolean;
}

interface EmailMessage {
  id: string;
  recipient: string;
  patientName: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  timestamp: string;
  appointmentDate?: string;
}

const emailTemplates = [
  {
    id: 'appointment_reminder',
    name: 'Recordatorio de Cita',
    subject: 'Recordatorio: Cita Médica - {fecha_cita}',
    template: `Estimado/a {nombre_paciente},

Le recordamos que tiene una cita médica programada para:

📅 Fecha: {fecha_cita}
🕐 Hora: {hora_cita}

🏥 Consultorio UME López & López
📍 [Dirección del consultorio]
📞 [Teléfono del consultorio]

Por favor, llegue 15 minutos antes de su cita. Si necesita reagendar, contáctenos con anticipación.

¡Le esperamos!

Atentamente,
Consultorio UME López & López`
  },
  {
    id: 'appointment_confirmation',
    name: 'Confirmación de Cita',
    subject: '✅ Cita Confirmada - {fecha_cita}',
    template: `Estimado/a {nombre_paciente},

Su cita médica ha sido confirmada exitosamente:

📅 Fecha: {fecha_cita}
🕐 Hora: {hora_cita}

🏥 Consultorio UME López & López
📍 [Dirección del consultorio]
📞 [Teléfono del consultorio]

Le enviaremos un recordatorio 24 horas antes de su cita.

¡Gracias por confiar en nosotros!

Atentamente,
Consultorio UME López & López`
  },
  {
    id: 'general_announcement',
    name: 'Comunicado General',
    subject: 'Comunicado Importante - Consultorio UME',
    template: `Estimados pacientes,

{mensaje_personalizado}

Para cualquier consulta o aclaración, no duden en contactarnos.

🏥 Consultorio UME López & López
📞 [Teléfono del consultorio]
📧 [Email del consultorio]

Atentamente,
Consultorio UME López & López`
  }
];

export default function EmailPage() {
  const [config, setConfig] = useState<EmailConfig>({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_name: 'Consultorio UME López & López',
    from_email: '',
    sendgrid_api_key: '',
    use_sendgrid: true
  });

  const [selectedTemplate, setSelectedTemplate] = useState(emailTemplates[0]);
  const [customSubject, setCustomSubject] = useState(emailTemplates[0].subject || '');
  const [customMessage, setCustomMessage] = useState(emailTemplates[0].template || '');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recentEmails, setRecentEmails] = useState<EmailMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
    loadRecentEmails();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/messaging/email/config');
      if (response.ok) {
        const data = await response.json();
        
        // La API devuelve una estructura con smtp y sendgrid, necesitamos mapear al formato antiguo
        let safeConfig;
        
        if (data.smtp) {
          // Nueva estructura de la API
          safeConfig = {
            smtp_host: data.smtp.host || 'smtp.gmail.com',
            smtp_port: data.smtp.port || 587,
            smtp_user: data.smtp.username || '',
            smtp_password: data.smtp.password || '',
            from_name: data.smtp.fromName || 'Consultorio UME López & López',
            from_email: data.smtp.fromEmail || '',
            sendgrid_api_key: data.sendgrid?.apiKey || '',
            use_sendgrid: data.sendgrid?.enabled || false
          };
        } else {
          // Estructura antigua como fallback
          safeConfig = {
            smtp_host: data.smtp_host || 'smtp.gmail.com',
            smtp_port: data.smtp_port || 587,
            smtp_user: data.smtp_user || '',
            smtp_password: data.smtp_password || '',
            from_name: data.from_name || 'Consultorio UME López & López',
            from_email: data.from_email || '',
            sendgrid_api_key: data.sendgrid_api_key || '',
            use_sendgrid: data.use_sendgrid !== undefined ? data.use_sendgrid : true
          };
        }
        
        setConfig(safeConfig);
        
        // Si no hay configuración del sistema, mostrar mensaje informativo
        if (!data.system_configured && !data.configured) {
          console.warn('⚠️ [EMAIL-CONFIG] Sistema no configurado. Usando configuración local.');
        }
      }
    } catch (error) {
      console.error('Error loading email config:', error);
    }
  };

  const loadRecentEmails = async () => {
    try {
      const response = await fetch('/api/messaging/email/messages');
      if (response.ok) {
        const data = await response.json();
        setRecentEmails(data);
      }
    } catch (error) {
      console.error('Error loading emails:', error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messaging/email/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        toast.success('Configuración de email guardada');
      } else {
        toast.error('Error al guardar configuración');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!recipientEmail || !customSubject || !customMessage) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/messaging/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: customSubject,
          message: customMessage,
          template_id: selectedTemplate.id
        })
      });

      if (response.ok) {
        toast.success('Email enviado exitosamente');
        setCustomSubject('');
        setCustomMessage('');
        setRecipientEmail('');
        loadRecentEmails();
      } else {
        toast.error('Error al enviar email');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setSending(false);
    }
  };

  const sendBulkEmail = async () => {
    if (!customSubject || !customMessage) {
      toast.error('Por favor completa el asunto y mensaje');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/messaging/email/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: customSubject,
          message: customMessage,
          template_id: selectedTemplate.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Enviando emails a ${data.recipients} pacientes`);
        loadRecentEmails();
      } else {
        toast.error('Error al enviar emails masivos');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">Enviado</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">Entregado</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">Fallido</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-700 border-yellow-200 bg-yellow-50">Pendiente</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-100 dark:from-gray-900 dark:via-blue-900 dark:to-cyan-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/messaging"
              className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Mail className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Email Marketing</h1>
              <p className="text-blue-100 mt-1">
                Envío de recordatorios y comunicaciones por email
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Configuración de Email
              </CardTitle>
              <CardDescription>
                Configura tu servidor SMTP o SendGrid
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from-name">Nombre del Remitente</Label>
                  <Input
                    id="from-name"
                    placeholder="Consultorio UME López & López"
                    value={config.from_name || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, from_name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="from-email">Email del Remitente</Label>
                  <Input
                    id="from-email"
                    type="email"
                    placeholder="consultorio@ume.com"
                    value={config.from_email || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, from_email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={config.use_sendgrid}
                      onChange={() => setConfig(prev => ({ ...prev, use_sendgrid: true }))}
                      className="text-blue-600"
                    />
                    <Key className="h-4 w-4" />
                    SendGrid (Recomendado)
                  </Label>
                  <Label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!config.use_sendgrid}
                      onChange={() => setConfig(prev => ({ ...prev, use_sendgrid: false }))}
                      className="text-blue-600"
                    />
                    <User className="h-4 w-4" />
                    SMTP Personalizado
                  </Label>
                </div>

                {config.use_sendgrid ? (
                  <div>
                    <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                    <Input
                      id="sendgrid-key"
                      type="password"
                      placeholder="SG.xxxxxxxxxx"
                      value={config.sendgrid_api_key || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, sendgrid_api_key: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Obtén tu API key desde el panel de SendGrid
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp-host">Servidor SMTP</Label>
                      <Input
                        id="smtp-host"
                        placeholder="smtp.gmail.com"
                        value={config.smtp_host || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, smtp_host: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="smtp-port">Puerto</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        placeholder="587"
                        value={config.smtp_port}
                        onChange={(e) => {
                          const port = parseInt(e.target.value) || 587;
                          setConfig(prev => ({ ...prev, smtp_port: port }));
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="smtp-user">Usuario SMTP</Label>
                      <Input
                        id="smtp-user"
                        type="email"
                        placeholder="tu-email@gmail.com"
                        value={config.smtp_user || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, smtp_user: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="smtp-password">Contraseña/Token</Label>
                      <Input
                        id="smtp-password"
                        type="password"
                        placeholder="••••••••••••••••"
                        value={config.smtp_password || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, smtp_password: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button 
                onClick={saveConfig} 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </CardContent>
          </Card>

          {/* Email Composer */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Compositor de Email
              </CardTitle>
              <CardDescription>
                Envío individual o masivo de emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template-select">Plantilla</Label>
                <Select 
                  value={selectedTemplate.id}
                  onValueChange={(value) => {
                    const template = emailTemplates.find(t => t.id === value);
                    if (template) {
                      setSelectedTemplate(template);
                      setCustomSubject(template.subject || '');
                      setCustomMessage(template.template || '');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {emailTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recipient-email">Email del Destinatario (Envío Individual)</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="paciente@email.com"
                  value={recipientEmail || ''}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deja vacío para envío masivo a todos los pacientes
                </p>
              </div>

              <div>
                <Label htmlFor="subject">Asunto</Label>
                <Input
                  id="subject"
                  placeholder="Asunto del email..."
                  value={customSubject || ''}
                  onChange={(e) => setCustomSubject(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="message">Mensaje</Label>
                <Textarea
                  id="message"
                  placeholder="Escribe tu mensaje aquí..."
                  value={customMessage || ''}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variables: {'{nombre_paciente}'}, {'{fecha_cita}'}, {'{hora_cita}'}, {'{mensaje_personalizado}'}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={sendEmail}
                  disabled={sending || !recipientEmail}
                  variant="outline"
                  className="flex-1"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Individual
                    </>
                  )}
                </Button>

                <Button
                  onClick={sendBulkEmail}
                  disabled={sending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Envío Masivo
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Emails */}
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Emails Recientes
            </CardTitle>
            <CardDescription>
              Historial de emails enviados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentEmails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay emails enviados aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentEmails.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-white/50"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(email.status)}
                      <div>
                        <p className="font-medium">{email.patientName}</p>
                        <p className="text-sm text-muted-foreground">{email.recipient}</p>
                        <p className="text-sm font-medium text-blue-600">{email.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {email.message.substring(0, 80)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(email.status)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(email.timestamp).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
