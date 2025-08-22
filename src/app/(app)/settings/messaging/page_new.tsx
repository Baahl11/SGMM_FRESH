'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageSquare, Settings, Smartphone, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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
  doctor_email: string;
  doctor_name: string;
  gmail_app_password: string;
  whatsapp_business_id: string;
  whatsapp_access_token: string;
  whatsapp_phone_number_id: string;
  whatsapp_webhook_verify_token: string;
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

const MessagingPage: React.FC = () => {
  const [config, setConfig] = useState<NotificationConfig>({
    email_enabled: false,
    whatsapp_enabled: false,
    email_advance_hours: 24,
    whatsapp_advance_hours: 2,
    email_template: 'Estimado/a {nombre_paciente}, le recordamos que tiene una cita médica programada para el {fecha_cita} a las {hora_cita}. Consultorio Médico.',
    whatsapp_template: 'Hola {nombre_paciente}! 👋 Recordatorio: Tienes cita médica el {fecha_cita} a las {hora_cita}. Te esperamos 🏥',
    sendgrid_api_key: '',
    doctor_email: '',
    doctor_name: '',
    gmail_app_password: '',
    whatsapp_business_id: '',
    whatsapp_access_token: '',
    whatsapp_phone_number_id: '',
    whatsapp_webhook_verify_token: '',
  });
  
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
    loadLogs();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/messaging/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/messaging/automation/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data || []);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messaging/config', {
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="doctor" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email del Médico
            </TabsTrigger>
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="doctor" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-green-600" />
                  Configuración del Email del Médico
                </CardTitle>
                <CardDescription>
                  Configura tu email de Gmail para Google Calendar y envío automático de facturas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="doctor-name">Nombre del Médico/Consultorio</Label>
                    <Input
                      id="doctor-name"
                      placeholder="Dr. Juan López - Consultorio"
                      value={config.doctor_name}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, doctor_name: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="doctor-email">Email de Gmail</Label>
                    <Input
                      id="doctor-email"
                      type="email"
                      placeholder="doctor@gmail.com"
                      value={config.doctor_email}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, doctor_email: e.target.value }))
                      }
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="gmail-password">Contraseña de Aplicación de Gmail</Label>
                  <Input
                    id="gmail-password"
                    type="password"
                    placeholder="••••••••••••••••"
                    value={config.gmail_app_password}
                    onChange={(e) => 
                      setConfig(prev => ({ ...prev, gmail_app_password: e.target.value }))
                    }
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Necesitas generar una "Contraseña de aplicación" en tu cuenta de Gmail
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
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

            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  Templates de Mensajes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={saveConfig}
                disabled={loading}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
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
};

export default MessagingPage;
