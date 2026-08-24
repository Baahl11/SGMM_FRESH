'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import {
  MessageSquare,
  Mail,
  Send,
  AlertCircle,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassPanel } from '@/components/ui/glass-panel';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MainNav } from '@/components/layout/main-nav';
import { SmsReminderSettings } from '@/components/settings/sms-reminder-settings';
import { SmsRemindersGuide } from '@/components/sms/sms-reminders-guide';
import { useSmsReminders } from '@/hooks/use-sms-reminders';
import { GuideToggle } from '@/components/settings/guide-toggle';
import { TIMING_OPTIONS } from '@/lib/utils/sms-reminders';

interface MessagingStats {
  channel: 'whatsapp' | 'sms' | 'email';
  total_sent: number;
  total_delivered: number;
  total_read: number;
  total_failed: number;
  today_sent: number;
  today_limit: number;
  channel_enabled: boolean;
  whatsapp_enabled: boolean;
  connection_status: 'connected' | 'disconnected' | 'error';
}

interface RecentMessage {
  id: string;
  channel: 'whatsapp' | 'sms' | 'email';
  destination: string;
  patient_name: string;
  subject?: string | null;
  message_body: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
  error_message?: string;
}

type MessagingChannelTab = 'whatsapp' | 'sms' | 'email';

const MESSAGING_CHANNEL_TABS: MessagingChannelTab[] = ['whatsapp', 'sms', 'email'];

function isMessagingChannelTab(value: string): value is MessagingChannelTab {
  return MESSAGING_CHANNEL_TABS.includes(value as MessagingChannelTab);
}

const TIMING_DESCRIPTIONS: Record<keyof typeof TIMING_OPTIONS, string> = {
  '24h': 'Recordatorio principal un día antes de la cita.',
  '12h': 'Mantiene al paciente al tanto medio día antes.',
  '6h': 'Refuerza la asistencia el mismo día de la cita.',
  '2h': 'Último empujón dos horas antes de la cita.',
  '1h': 'Aviso final una hora antes de que inicie la consulta.',
  custom: 'Horario personalizado definido al programar la cita.',
};

function MessagingContent() {
  const [stats, setStats] = useState<MessagingStats | null>(null);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hola! Este es un mensaje de prueba desde AgendaMedPro');
  const [testEmail, setTestEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('Recordatorio de AgendaMedPro');
  const [emailMessage, setEmailMessage] = useState('Hola! Este es un correo de prueba desde AgendaMedPro.');
  const [whatsappStatus, setWhatsappStatus] = useState<{
    enabled: boolean;
    connection_status: 'connected' | 'disconnected' | 'error';
  }>({
    enabled: false,
    connection_status: 'disconnected',
  });
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('whatsapp');
  const latestTabRef = useRef(activeTab);
  const { config: smsConfig, updateConfig: updateSmsConfig } = useSmsReminders();

  useEffect(() => {
    latestTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (!tabParam) {
      return;
    }

    const allowed = ['whatsapp', 'sms', 'email', 'reminders'];
    if (allowed.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`/messaging?${params.toString()}`, { scroll: false });
  };

  const loadWhatsAppStatus = async () => {
    try {
      const response = await fetch('/api/messaging/stats?channel=whatsapp');
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setWhatsappStatus({
        enabled: Boolean(data?.stats?.channel_enabled),
        connection_status: data?.stats?.connection_status || 'disconnected',
      });
    } catch (error) {
      console.error('Error loading WhatsApp status:', error);
    }
  };

  const loadMessagingData = async (channel: MessagingChannelTab) => {
    const isStaleRequest = () => latestTabRef.current !== channel;

    try {
      setIsLoading(true);

      const [statsRes, messagesRes] = await Promise.all([
        fetch(`/api/messaging/stats?channel=${channel}`),
        fetch(`/api/messaging/recent?channel=${channel}`),
      ]);

      if (isStaleRequest()) {
        return;
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);

        if (channel === 'whatsapp') {
          setWhatsappStatus({
            enabled: Boolean(statsData?.stats?.channel_enabled),
            connection_status: statsData?.stats?.connection_status || 'disconnected',
          });
        }
      }

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        setRecentMessages(messagesData.messages || []);
      }
    } catch (error) {
      console.error('Error loading messaging data:', error);
      toast.error('Error al cargar datos de mensajería');
    } finally {
      if (!isStaleRequest()) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadWhatsAppStatus();
  }, []);

  useEffect(() => {
    if (isMessagingChannelTab(activeTab)) {
      loadMessagingData(activeTab);
      return;
    }

    if (activeTab === 'reminders') {
      setIsLoading(false);
      loadWhatsAppStatus();
    }
  }, [activeTab]);

  const sendTestMessage = async () => {
    if (!testPhone || !testMessage) {
      toast.error('Ingresa un teléfono y mensaje');
      return;
    }

    setIsSendingSms(true);
    try {
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'sms',
          to_contact: {
            phone: testPhone,
          },
          body: testMessage,
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('SMS enviado o en cola correctamente');
        setTestPhone('');
        setTimeout(() => loadMessagingData('sms'), 1200);
      } else {
        toast.error(data.error || 'Error al enviar mensaje');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsSendingSms(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !emailSubject || !emailMessage) {
      toast.error('Completa destinatario, asunto y mensaje');
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'email',
          to_contact: {
            email: testEmail,
          },
          subject: emailSubject,
          body: emailMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Email enviado correctamente');
        setTimeout(() => loadMessagingData('email'), 1200);
      } else {
        toast.error(data.error || 'Error al enviar email');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string; icon: any }> = {
      pending: { className: 'border-amber-400/40 bg-amber-500/15 text-amber-200', label: 'Pendiente', icon: Clock },
      sent: { className: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200', label: 'Enviado', icon: Send },
      delivered: { className: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200', label: 'Entregado', icon: CheckCircle2 },
      read: { className: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200', label: 'Leído', icon: CheckCircle2 },
      failed: { className: 'border-rose-400/40 bg-rose-500/15 text-rose-200', label: 'Fallido', icon: AlertCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge className={cn('flex items-center gap-1 w-fit', config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center text-white/70">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-300 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm">Cargando mensajería...</p>
        </div>
      </div>
    );
  }

  const isWhatsAppConfigured =
    whatsappStatus.enabled && whatsappStatus.connection_status === 'connected';
  const hasSmsEnabled = smsConfig.enabled;
  const smsTimingCards = smsConfig.default_timings.map((timing) => {
    const timingKey = timing as keyof typeof TIMING_OPTIONS;
    const option = TIMING_OPTIONS[timingKey];
    const label = option?.label ?? timing.toUpperCase();
    const description = TIMING_DESCRIPTIONS[timingKey] ?? 'Recordatorio programado automáticamente.';

    return (
      <Card key={timing}>
        <CardHeader>
          <CardTitle className="text-base">{label}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            El sistema agenda el SMS y respeta tus horarios de silencio configurados.
          </p>
        </CardContent>
      </Card>
    );
  });

  const smsOptionsSummary = [
    {
      id: 'send_confirmation',
      enabled: smsConfig.send_confirmation,
      on: 'Envía confirmación al agendar la cita.',
      off: 'Sin confirmación automática al crear la cita.',
    },
    {
      id: 'include_doctor_name',
      enabled: smsConfig.include_doctor_name,
      on: 'Incluye el nombre del doctor en cada SMS.',
      off: 'No agrega el nombre del doctor.',
    },
    {
      id: 'require_confirmation',
      enabled: smsConfig.require_confirmation,
      on: 'Solicita que el paciente responda "SI" para confirmar.',
      off: 'No solicita confirmación por respuesta.',
    },
    {
      id: 'business_hours_only',
      enabled: smsConfig.business_hours_only,
      on: `Respeta el horario comercial de ${smsConfig.quiet_hours_start} a ${smsConfig.quiet_hours_end}.`,
      off: 'Puede enviar SMS en cualquier horario.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Main Navigation */}
      <GlassPanel className="rounded-none border-x-0 border-t-0">
        <div className="container mx-auto px-6 py-4">
          <MainNav />
        </div>
      </GlassPanel>

      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Hero Section */}
        <GlassPanel className="relative overflow-hidden p-8 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-green-400/30 blur-[140px]" />
            <div className="absolute -bottom-40 left-0 h-72 w-72 rounded-full bg-teal-400/30 blur-[160px]" />
          </div>
          
          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">Comunicación</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-teal-500 shadow-lg">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Mensajería</h1>
                <p className="mt-1 text-white/80">Envía recordatorios automáticos y gestiona la comunicación</p>
              </div>
            </div>
            
            {/* Stats mini-cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <div className="text-2xl font-bold">{stats?.total_sent || 0}</div>
                <div className="text-sm text-white/70">Enviados</div>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <div className="text-2xl font-bold">{stats?.total_delivered || 0}</div>
                <div className="text-sm text-white/70">Entregados</div>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <div className="text-2xl font-bold">{stats?.total_read || 0}</div>
                <div className="text-sm text-white/70">Leídos</div>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <div className="text-2xl font-bold">{(stats?.today_limit || 1000) - (stats?.today_sent || 0)}</div>
                <div className="text-sm text-white/70">Disponibles</div>
              </div>
            </div>
            
            <Button variant="ghost" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
              <Link href="/dashboard/settings/whatsapp">
                <Settings className="mr-2 h-5 w-5" />
                Configurar WhatsApp
              </Link>
            </Button>
          </div>
        </GlassPanel>

      {/* Configuration Alert */}
      {activeTab === 'whatsapp' && !isWhatsAppConfigured && (
        <GlassPanel className="border-amber-400/30 bg-amber-500/15 text-amber-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold">WhatsApp no configurado</h3>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm">Configura tu cuenta de WhatsApp Business para comenzar a enviar mensajes</span>
                <Button size="sm" variant="ghost" className="rounded-full border-amber-400/30 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30" asChild>
                  <Link href="/dashboard/settings/whatsapp">Configurar ahora</Link>
                </Button>
              </div>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="border-white/20 bg-white/10">
          <TabsTrigger value="whatsapp" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60">
            <MessageSquare className="h-4 w-4 mr-2" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="sms" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60">
            <Send className="h-4 w-4 mr-2" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="reminders" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60">
            <Clock className="h-4 w-4 mr-2" />
            Recordatorios
          </TabsTrigger>
        </TabsList>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp">
          <GlassPanel className="space-y-5 p-5 text-white">
            <div>
              <h3 className="text-lg font-semibold">Mensajes Recientes de WhatsApp</h3>
              <p className="text-sm text-white/70">Historial de mensajes enviados por WhatsApp Business</p>
            </div>
            <div>
              {recentMessages.length === 0 ? (
                <div className="py-16 text-center text-white/70">
                  <MessageSquare className="mx-auto h-12 w-12 text-white/40 mb-4" />
                  <p className="text-sm">No hay mensajes enviados todavía</p>
                  {isWhatsAppConfigured && (
                    <p className="text-xs text-white/50 mt-2">
                      Los mensajes aparecerán aquí cuando se envíen
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMessages.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-start justify-between border-b border-white/10 pb-4 last:border-0"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{message.patient_name}</p>
                          {getStatusBadge(message.status)}
                        </div>
                        <p className="text-xs text-white/60">{message.destination}</p>
                        <p className="text-sm text-white/70 line-clamp-2">{message.message_body}</p>
                        {message.error_message && (
                          <p className="text-xs text-rose-300">Error: {message.error_message}</p>
                        )}
                        <p className="text-xs text-white/60">
                          {new Date(message.created_at).toLocaleString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassPanel>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms">
          <div className="space-y-6">
            {/* Formulario de prueba */}
            <GlassPanel className="border-emerald-400/30 bg-emerald-500/15 text-emerald-50">
              <div className="space-y-5">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Send className="h-5 w-5" />
                    Enviar SMS de Prueba
                  </h3>
                  <p className="mt-1 text-sm text-emerald-100/80">
                    Envía un mensaje de prueba para validar tu configuración de Twilio
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-phone" className="text-white">Teléfono (con código de país)</Label>
                    <Input
                      id="test-phone"
                      type="tel"
                      placeholder="+521234567890"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                    />
                    <p className="text-xs text-emerald-100/70">
                      Ejemplo: +52 para México, +1 para USA
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="test-message" className="text-white">Mensaje</Label>
                    <Textarea
                      id="test-message"
                      placeholder="Escribe tu mensaje..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      rows={3}
                      className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                    />
                  </div>

                  <Button
                    onClick={sendTestMessage}
                    disabled={isSendingSms || !testPhone || !testMessage}
                    className="w-full rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10"
                    variant="ghost"
                  >
                    {isSendingSms ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Mensaje de Prueba
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="border-amber-400/30 bg-amber-500/15 text-amber-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Configuración de credenciales</h3>
                  <p className="mt-1 text-sm">
                    Para enviar SMS, configura tus credenciales de Twilio en{' '}
                    <a 
                      href="/dashboard/settings/notifications" 
                      className="underline font-semibold hover:text-amber-100"
                    >
                      Configuración → Notificaciones
                    </a>
                  </p>
                </div>
              </div>
            </GlassPanel>

            <SmsReminderSettings
              config={smsConfig}
              onConfigChange={updateSmsConfig}
              appearance="glass"
            />

            <GuideToggle label="¿Cómo funcionan los recordatorios por SMS?">
              <SmsRemindersGuide />
            </GuideToggle>

            <GlassPanel className="space-y-5 p-5 text-white">
              <div>
                <h3 className="text-lg font-semibold">Mensajes SMS recientes</h3>
                <p className="text-sm text-white/70">Historial del canal SMS con estatus de entrega</p>
              </div>
              <div>
                {recentMessages.length === 0 ? (
                  <div className="py-10 text-center text-white/70">
                    <Send className="mx-auto h-10 w-10 text-white/40 mb-3" />
                    <p className="text-sm">No hay SMS registrados todavía</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentMessages.map((message) => (
                      <div
                        key={message.id}
                        className="flex items-start justify-between border-b border-white/10 pb-4 last:border-0"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{message.patient_name}</p>
                            {getStatusBadge(message.status)}
                          </div>
                          <p className="text-xs text-white/60">{message.destination}</p>
                          <p className="text-sm text-white/70 line-clamp-2">{message.message_body}</p>
                          {message.error_message && (
                            <p className="text-xs text-rose-300">Error: {message.error_message}</p>
                          )}
                          <p className="text-xs text-white/60">
                            {new Date(message.created_at).toLocaleString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassPanel>
          </div>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <div className="space-y-6">
            <GlassPanel className="space-y-5 p-5 text-white">
              <div>
                <h3 className="text-lg font-semibold">Enviar Email de Prueba</h3>
                <p className="text-sm text-white/70">Utiliza la configuración de email que definiste en Notificaciones</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email" className="text-white">Destinatario</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="paciente@ejemplo.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-email-subject" className="text-white">Asunto</Label>
                  <Input
                    id="test-email-subject"
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-email-message" className="text-white">Mensaje</Label>
                  <Textarea
                    id="test-email-message"
                    rows={4}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                  />
                </div>

                <Button
                  onClick={sendTestEmail}
                  disabled={isSendingEmail || !testEmail || !emailSubject || !emailMessage}
                  className="w-full rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10"
                  variant="ghost"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Enviando email...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar Email de Prueba
                    </>
                  )}
                </Button>

                <p className="text-xs text-white/60">
                  Si no tienes configurado email aún, ve a{' '}
                  <Link href="/dashboard/settings/notifications" className="underline font-semibold hover:text-white">
                    Configuración → Notificaciones
                  </Link>
                  .
                </p>
              </div>
            </GlassPanel>

            <GlassPanel className="space-y-5 p-5 text-white">
              <div>
                <h3 className="text-lg font-semibold">Emails recientes</h3>
                <p className="text-sm text-white/70">Historial del canal email con estatus por envío</p>
              </div>
              <div>
                {recentMessages.length === 0 ? (
                  <div className="py-10 text-center text-white/70">
                    <Mail className="mx-auto h-10 w-10 text-white/40 mb-3" />
                    <p className="text-sm">No hay emails registrados todavía</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentMessages.map((message) => (
                      <div
                        key={message.id}
                        className="flex items-start justify-between border-b border-white/10 pb-4 last:border-0"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{message.patient_name}</p>
                            {getStatusBadge(message.status)}
                          </div>
                          <p className="text-xs text-white/60">{message.destination}</p>
                          {message.subject && (
                            <p className="text-xs text-white/50">Asunto: {message.subject}</p>
                          )}
                          <p className="text-sm text-white/70 line-clamp-2">{message.message_body}</p>
                          {message.error_message && (
                            <p className="text-xs text-rose-300">Error: {message.error_message}</p>
                          )}
                          <p className="text-xs text-white/60">
                            {new Date(message.created_at).toLocaleString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassPanel>
          </div>
        </TabsContent>

        {/* Reminders Tab */}
        <TabsContent value="reminders">
          <GlassPanel className="space-y-5 p-5 text-white">
            <div>
              <h3 className="text-lg font-semibold">Configuración de Recordatorios</h3>
              <p className="text-sm text-white/70">Gestiona los recordatorios automáticos para citas</p>
            </div>
            <div className="space-y-6">
              {!hasSmsEnabled && (
                <GlassPanel className="border-amber-400/30 bg-amber-500/15 text-amber-50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Activa los recordatorios por SMS</h3>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm">Ve a la pestaña SMS para elegir horarios y guardar tus credenciales.</span>
                        <Button size="sm" variant="ghost" className="rounded-full border-amber-400/30 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30" asChild>
                          <Link href="/messaging?tab=sms">Abrir pestaña SMS</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              )}

              {hasSmsEnabled && (
                <div className="space-y-4">
                  <GlassPanel className="border-emerald-400/30 bg-emerald-500/15 text-emerald-50">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">Recordatorios SMS activos</h3>
                        <p className="mt-1 text-sm">
                          Tus pacientes recibirán mensajes en los horarios configurados. Puedes ajustar el contenido en la pestaña SMS.
                        </p>
                      </div>
                    </div>
                  </GlassPanel>

                  {smsTimingCards.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {smsTimingCards}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-white/30 bg-white/5 p-6 text-sm text-white/70">
                      Activa al menos un horario en la pestaña SMS para comenzar a enviar recordatorios.
                    </div>
                  )}

                  <div className="rounded-lg border border-white/20 bg-white/5 p-4">
                    <p className="mb-3 text-sm font-medium text-white">Opciones habilitadas</p>
                    <ul className="space-y-2 text-sm text-white/70">
                      {smsOptionsSummary.map((option) => (
                        <li key={option.id} className="flex items-start gap-2">
                          {option.enabled ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                          ) : (
                            <Clock className="mt-0.5 h-4 w-4 text-white/40" />
                          )}
                          <span>{option.enabled ? option.on : option.off}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {isWhatsAppConfigured ? (
                <GlassPanel className="border-emerald-400/30 bg-emerald-500/15 text-emerald-50">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">WhatsApp conectado</h3>
                      <p className="mt-1 text-sm">
                        Tus mensajes de WhatsApp se envían desde el número configurado. Consulta el historial en la pestaña WhatsApp.
                      </p>
                    </div>
                  </div>
                </GlassPanel>
              ) : (
                <GlassPanel className="border-amber-400/30 bg-amber-500/15 text-amber-50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Conecta WhatsApp Business</h3>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm">Completa tus credenciales en Configuración → Mensajería para habilitar WhatsApp.</span>
                        <Button size="sm" variant="ghost" className="rounded-full border-amber-400/30 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30" asChild>
                          <Link href="/dashboard/settings/whatsapp">Configurar WhatsApp</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              )}
            </div>
          </GlassPanel>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

export default function MessagingPage() {
  return (
    <Suspense fallback={
      <div className="flex h-96 items-center justify-center">
        <div className="text-center text-white/70">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-300 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm">Cargando mensajería...</p>
        </div>
      </div>
    }>
      <MessagingContent />
    </Suspense>
  );
}
