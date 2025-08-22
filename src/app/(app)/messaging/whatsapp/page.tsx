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
  Smartphone, 
  Send, 
  MessageSquare, 
  Users, 
  Settings,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface WhatsAppConfig {
  business_id: string;
  access_token: string;
  phone_number_id: string;
  webhook_verify_token: string;
  default_template: string;
}

interface WhatsAppMessage {
  id: string | number;
  recipient?: string;
  patientName?: string;
  patient_name?: string;
  phone?: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  timestamp?: string;
  sent_at?: string;
  appointmentDate?: string;
}

const messageTemplates = [
  {
    id: 'appointment_reminder',
    name: 'Recordatorio de Cita',
    template: 'Hola {nombre_paciente}! 👋\n\nTe recordamos que tienes una cita médica programada para:\n📅 {fecha_cita}\n🕐 {hora_cita}\n\n🏥 Consultorio UME López & López\n📍 [Dirección del consultorio]\n\nSi necesitas reagendar, contáctanos con anticipación.\n\n¡Te esperamos!'
  },
  {
    id: 'appointment_confirmation',
    name: 'Confirmación de Cita',
    template: '✅ ¡Cita confirmada!\n\nHola {nombre_paciente}, tu cita ha sido confirmada para:\n📅 {fecha_cita}\n🕐 {hora_cita}\n\n🏥 Consultorio UME López & López\n\nTe enviaremos un recordatorio 24 horas antes. ¡Gracias!'
  },
  {
    id: 'general_announcement',
    name: 'Comunicado General',
    template: '📢 Comunicado Importante\n\nEstimados pacientes,\n\n{mensaje_personalizado}\n\n🏥 Consultorio UME López & López\n📞 Para más información, contáctanos.'
  }
];

export default function WhatsAppPage() {
  const [config, setConfig] = useState<WhatsAppConfig>({
    business_id: '',
    access_token: '',
    phone_number_id: '',
    webhook_verify_token: '',
    default_template: messageTemplates[0].template
  });

  const [selectedTemplate, setSelectedTemplate] = useState(messageTemplates[0]);
  const [customMessage, setCustomMessage] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recentMessages, setRecentMessages] = useState<WhatsAppMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
    loadRecentMessages();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/messaging/whatsapp/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading WhatsApp config:', error);
    }
  };

  const loadRecentMessages = async () => {
    try {
      console.log('🔄 Loading WhatsApp messages...');
      
      const response = await fetch('/api/messaging/whatsapp/send');
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          recipient: msg.phone,
          patientName: msg.patient_name,
          message: msg.message,
          status: msg.status,
          timestamp: msg.sent_at
        }));
        setRecentMessages(formattedMessages);
        console.log(`✅ Loaded ${formattedMessages.length} WhatsApp messages`);
      } else {
        console.warn('⚠️ Could not load WhatsApp messages, using fallback');
        // Fallback a datos mock si falla el endpoint
        const mockMessages: WhatsAppMessage[] = [
          {
            id: 1,
            patientName: 'Carlos López',
            message: 'Recordatorio de cita médica para mañana',
            status: 'sent',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            recipient: '+52 555 0003'
          },
          {
            id: 2,
            patientName: 'María García',
            message: 'Confirmación de cita programada',
            status: 'delivered',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            recipient: '+52 555 0002'
          }
        ];
        setRecentMessages(mockMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setRecentMessages([]);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messaging/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        toast.success('Configuración de WhatsApp guardada');
      } else {
        toast.error('Error al guardar configuración');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!recipientPhone || !customMessage) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setSending(true);
    try {
      console.log(`🔄 [WHATSAPP] Enviando mensaje individual a ${recipientPhone}...`);
      const response = await fetch('/api/messaging/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: recipientPhone,
          message: customMessage,
          template_id: selectedTemplate.id,
          patient_name: 'Paciente Individual'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [WHATSAPP] Mensaje individual enviado:', data);
        toast.success('Mensaje enviado exitosamente');
        setCustomMessage('');
        setRecipientPhone('');
        loadRecentMessages();
      } else {
        const errorData = await response.json();
        console.error('❌ [WHATSAPP] Error enviando mensaje:', errorData);
        toast.error(errorData.error || 'Error al enviar mensaje');
      }
    } catch (error) {
      console.error('❌ [WHATSAPP] Error de conexión:', error);
      toast.error('Error de conexión');
    } finally {
      setSending(false);
    }
  };

  const sendBulkMessage = async () => {
    if (!customMessage) {
      toast.error('Por favor escribe un mensaje');
      return;
    }

    setSending(true);
    try {
      console.log('🔄 [WHATSAPP] Iniciando envío masivo...');
      const response = await fetch('/api/messaging/whatsapp/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: customMessage,
          template_id: selectedTemplate.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [WHATSAPP] Envío masivo exitoso:', data);
        
        if (data.details) {
          toast.success(
            `Enviado a ${data.sent} de ${data.recipients} pacientes con WhatsApp ` +
            `(${data.details.success_rate}% éxito). Total pacientes en BD: ${data.details.total_patients}`
          );
        } else {
          toast.success(`Enviando mensaje a ${data.recipients} pacientes`);
        }
        
        // Limpiar mensaje y recargar historial
        setCustomMessage('');
        loadRecentMessages();
      } else {
        const errorData = await response.json();
        console.error('❌ [WHATSAPP] Error en envío masivo:', errorData);
        toast.error(errorData.error || 'Error al enviar mensajes masivos');
      }
    } catch (error) {
      console.error('❌ [WHATSAPP] Error de conexión:', error);
      toast.error('Error de conexión al enviar mensajes');
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
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 dark:from-gray-900 dark:via-green-900 dark:to-emerald-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/messaging"
              className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Smartphone className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">WhatsApp Business</h1>
              <p className="text-green-100 mt-1">
                Envío de recordatorios y mensajes por WhatsApp
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
                <Settings className="h-5 w-5 text-green-600" />
                Configuración WhatsApp Business
              </CardTitle>
              <CardDescription>
                Configura tu cuenta de WhatsApp Business API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="business-id">Business Account ID</Label>
                <Input
                  id="business-id"
                  placeholder="123456789012345"
                  value={config.business_id}
                  onChange={(e) => setConfig(prev => ({ ...prev, business_id: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="phone-id">Phone Number ID</Label>
                <Input
                  id="phone-id"
                  placeholder="109876543210987"
                  value={config.phone_number_id}
                  onChange={(e) => setConfig(prev => ({ ...prev, phone_number_id: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="access-token">Access Token</Label>
                <Input
                  id="access-token"
                  type="password"
                  placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={config.access_token}
                  onChange={(e) => setConfig(prev => ({ ...prev, access_token: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="webhook-token">Webhook Verify Token</Label>
                <Input
                  id="webhook-token"
                  placeholder="mi_token_secreto_123"
                  value={config.webhook_verify_token}
                  onChange={(e) => setConfig(prev => ({ ...prev, webhook_verify_token: e.target.value }))}
                />
              </div>

              <Button 
                onClick={saveConfig} 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </CardContent>
          </Card>

          {/* Message Composer */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                Enviar Mensaje
              </CardTitle>
              <CardDescription>
                Envío individual o masivo de mensajes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template-select">Plantilla</Label>
                <Select 
                  value={selectedTemplate.id}
                  onValueChange={(value) => {
                    const template = messageTemplates.find(t => t.id === value);
                    if (template) {
                      setSelectedTemplate(template);
                      setCustomMessage(template.template);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {messageTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recipient-phone">Número de Teléfono (Envío Individual)</Label>
                <Input
                  id="recipient-phone"
                  placeholder="+52 33 1234 5678"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deja vacío para envío masivo a todos los pacientes con WhatsApp de la base de datos
                </p>
              </div>

              <div>
                <Label htmlFor="message">Mensaje</Label>
                <Textarea
                  id="message"
                  placeholder="Escribe tu mensaje aquí..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variables: {'{nombre_paciente}'}, {'{fecha_cita}'}, {'{hora_cita}'}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={sendMessage}
                  disabled={sending || !recipientPhone}
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
                  onClick={sendBulkMessage}
                  disabled={sending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
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

        {/* Recent Messages */}
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Mensajes Recientes
            </CardTitle>
            <CardDescription>
              Historial de mensajes enviados por WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay mensajes enviados aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMessages.map((message) => (
                  <div
                    key={message.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-white/50"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(message.status)}
                      <div>
                        <p className="font-medium">{message.patientName || message.patient_name}</p>
                        <p className="text-sm text-muted-foreground">{message.recipient || message.phone}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.message.substring(0, 80)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(message.status)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.timestamp || message.sent_at || '').toLocaleDateString('es-MX')}
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
