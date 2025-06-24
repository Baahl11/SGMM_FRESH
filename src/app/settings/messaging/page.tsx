'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, Mail, MessageSquare, Settings, Smartphone, Clock, Key, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface NotificationConfig {
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  email_advance_hours: number;
  whatsapp_advance_hours: number;
  email_template: string;
  whatsapp_template: string;
  sendgrid_api_key: string;
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
}

interface NotificationLog {
  id: number;
  appointment_id: number;
  patient_name: string;
  notification_type: 'email' | 'whatsapp';
  status: 'pending' | 'sent' | 'failed';
  scheduled_for: string;
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

export default function MessagingPage() {  const [config, setConfig] = useState<NotificationConfig>({
    email_enabled: false,
    whatsapp_enabled: false,
    email_advance_hours: 24,
    whatsapp_advance_hours: 2,
    email_template: 'Estimado/a {nombre_paciente}, le recordamos que tiene una cita médica programada para el {fecha_cita} a las {hora_cita}. Consultorio UME López & López.',
    whatsapp_template: 'Hola {nombre_paciente}! 👋 Recordatorio: Tienes cita médica el {fecha_cita} a las {hora_cita}. Te esperamos en UME López & López 🏥',
    sendgrid_api_key: '',
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
  });
  
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);

  useEffect(() => {
    loadConfig();
    loadLogs();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/notifications/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/notifications/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Configuración guardada exitosamente');
      } else {
        toast.error('Error al guardar la configuración');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const testEmailNotification = async () => {
    setTestingEmail(true);
    try {
      const response = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: config.email_template,
          api_key: config.sendgrid_api_key,
        }),
      });

      if (response.ok) {
        toast.success('Email de prueba enviado exitosamente');
      } else {
        toast.error('Error al enviar email de prueba');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setTestingEmail(false);
    }
  };

  const testWhatsAppNotification = async () => {
    setTestingWhatsApp(true);
    try {
      const response = await fetch('/api/notifications/test-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: config.whatsapp_template,
          account_sid: config.twilio_account_sid,
          auth_token: config.twilio_auth_token,
          from_number: config.twilio_phone_number,
        }),
      });

      if (response.ok) {
        toast.success('WhatsApp de prueba enviado exitosamente');
      } else {
        toast.error('Error al enviar WhatsApp de prueba');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">Enviado</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">Fallido</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-700 border-yellow-200 bg-yellow-50">Pendiente</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Panel de Mensajería</h1>
              <p className="text-indigo-100 mt-1">
                Configura recordatorios automáticos por email y WhatsApp
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="configuration" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Historial de Envíos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configuration" className="space-y-6">
            {/* Configuración General */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  Configuración General
                </CardTitle>
                <CardDescription>
                  Activa o desactiva las notificaciones y configura los tiempos de anticipación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <Label htmlFor="email-enabled">Notificaciones por Email</Label>
                      </div>
                      <Switch
                        id="email-enabled"
                        checked={config.email_enabled}
                        onCheckedChange={(checked) => 
                          setConfig(prev => ({ ...prev, email_enabled: checked }))
                        }
                      />
                    </div>
                    {config.email_enabled && (
                      <div>
                        <Label htmlFor="email-advance">Anticipación (horas)</Label>
                        <Select
                          value={config.email_advance_hours.toString()}
                          onValueChange={(value) => 
                            setConfig(prev => ({ ...prev, email_advance_hours: parseInt(value) }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hora</SelectItem>
                            <SelectItem value="2">2 horas</SelectItem>
                            <SelectItem value="6">6 horas</SelectItem>
                            <SelectItem value="12">12 horas</SelectItem>
                            <SelectItem value="24">24 horas</SelectItem>
                            <SelectItem value="48">48 horas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-green-600" />
                        <Label htmlFor="whatsapp-enabled">Notificaciones por WhatsApp</Label>
                      </div>
                      <Switch
                        id="whatsapp-enabled"
                        checked={config.whatsapp_enabled}
                        onCheckedChange={(checked) => 
                          setConfig(prev => ({ ...prev, whatsapp_enabled: checked }))
                        }
                      />
                    </div>
                    {config.whatsapp_enabled && (
                      <div>
                        <Label htmlFor="whatsapp-advance">Anticipación (horas)</Label>
                        <Select
                          value={config.whatsapp_advance_hours.toString()}
                          onValueChange={(value) => 
                            setConfig(prev => ({ ...prev, whatsapp_advance_hours: parseInt(value) }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hora</SelectItem>
                            <SelectItem value="2">2 horas</SelectItem>
                            <SelectItem value="6">6 horas</SelectItem>
                            <SelectItem value="12">12 horas</SelectItem>
                            <SelectItem value="24">24 horas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Templates de Mensajes */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  Templates de Mensajes
                </CardTitle>                <CardDescription>
                  Personaliza los mensajes que se enviarán a los pacientes. 
                  Variables disponibles: {'{nombre_paciente}'}, {'{fecha_cita}'}, {'{hora_cita}'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email-template">Template para Email</Label>
                    <Textarea
                      id="email-template"
                      placeholder="Mensaje para email..."
                      value={config.email_template}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, email_template: e.target.value }))
                      }
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="whatsapp-template">Template para WhatsApp</Label>
                    <Textarea
                      id="whatsapp-template"
                      placeholder="Mensaje para WhatsApp..."
                      value={config.whatsapp_template}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, whatsapp_template: e.target.value }))
                      }
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Configuration */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-600" />
                  Configuración de APIs
                </CardTitle>
                <CardDescription>
                  Configura las credenciales para SendGrid (email) y Twilio (WhatsApp)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SendGrid Config */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      SendGrid (Email)
                    </h4>
                    <div>
                      <Label htmlFor="sendgrid-key">API Key</Label>                      <Input
                        id="sendgrid-key"
                        type="password"
                        placeholder="SG.xxxxxxxxxx"
                        value={config.sendgrid_api_key}
                        autoComplete="new-password"
                        onChange={(e) => 
                          setConfig(prev => ({ ...prev, sendgrid_api_key: e.target.value }))
                        }
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testEmailNotification}
                      disabled={testingEmail || !config.sendgrid_api_key}
                      className="w-full"
                    >
                      {testingEmail ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Probar Email
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Twilio Config */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Twilio (WhatsApp)
                    </h4>
                    <div>
                      <Label htmlFor="twilio-sid">Account SID</Label>                      <Input
                        id="twilio-sid"
                        type="password"
                        placeholder="ACxxxxxxxxxx"
                        value={config.twilio_account_sid}
                        autoComplete="username"
                        onChange={(e) => 
                          setConfig(prev => ({ ...prev, twilio_account_sid: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="twilio-token">Auth Token</Label>                      <Input
                        id="twilio-token"
                        type="password"
                        placeholder="xxxxxxxxxx"
                        value={config.twilio_auth_token}
                        autoComplete="new-password"
                        onChange={(e) => 
                          setConfig(prev => ({ ...prev, twilio_auth_token: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="twilio-phone">Número de WhatsApp</Label>                      <Input
                        id="twilio-phone"
                        placeholder="whatsapp:+1234567890"
                        value={config.twilio_phone_number}
                        autoComplete="tel"
                        onChange={(e) => 
                          setConfig(prev => ({ ...prev, twilio_phone_number: e.target.value }))
                        }
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testWhatsAppNotification}
                      disabled={testingWhatsApp || !config.twilio_account_sid || !config.twilio_auth_token}
                      className="w-full"
                    >
                      {testingWhatsApp ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Probar WhatsApp
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={saveConfig}
                disabled={loading}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Configuración'
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-green-600" />
                      Historial de Notificaciones
                    </CardTitle>
                    <CardDescription>
                      Últimas notificaciones enviadas a los pacientes
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadLogs}
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Actualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay notificaciones registradas aún</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-white/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {log.notification_type === 'email' ? (
                              <Mail className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Smartphone className="h-4 w-4 text-green-600" />
                            )}
                            {getStatusIcon(log.status)}
                          </div>
                          <div>
                            <p className="font-medium">{log.patient_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {log.notification_type === 'email' ? 'Email' : 'WhatsApp'} •{' '}
                              {new Date(log.scheduled_for).toLocaleString('es-MX')}
                            </p>
                            {log.error_message && (
                              <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(log.status)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
