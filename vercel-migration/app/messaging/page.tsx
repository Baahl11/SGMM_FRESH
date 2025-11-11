'use client';

import { useState, useEffect, Suspense } from 'react';
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
  total_sent: number;
  total_delivered: number;
  total_read: number;
  total_failed: number;
  today_sent: number;
  today_limit: number;
  whatsapp_enabled: boolean;
  connection_status: 'connected' | 'disconnected' | 'error';
}

interface RecentMessage {
  id: string;
  to_phone: string;
  patient_name: string;
  message_body: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
  error_message?: string;
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
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hola! Este es un mensaje de prueba desde AgendaMedPro 🏥');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('whatsapp');
  const { config: smsConfig, updateConfig: updateSmsConfig } = useSmsReminders();

  useEffect(() => {
    loadMessagingData();
  }, []);

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

  const loadMessagingData = async () => {
    try {
      setIsLoading(true);
      
      const [statsRes, messagesRes] = await Promise.all([
        fetch('/api/messaging/stats'),
        fetch('/api/messaging/recent'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        setRecentMessages(messagesData.messages || []);
      }
    } catch (error) {
      console.error('Error loading messaging data:', error);
      toast.error('Error al cargar datos de mensajería');
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testPhone || !testMessage) {
      toast.error('Ingresa un teléfono y mensaje');
      return;
    }

    setIsSendingTest(true);
    try {
      const response = await fetch('/api/messaging/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('¡Mensaje de prueba encolado! Se enviará en menos de 60 segundos.');
        setTestPhone('');
        // Recargar mensajes después de 2 segundos
        setTimeout(() => loadMessagingData(), 2000);
      } else {
        toast.error(data.error || 'Error al enviar mensaje');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsSendingTest(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: 'secondary', label: 'Pendiente', icon: Clock },
      sent: { variant: 'default', label: 'Enviado', icon: Send },
      delivered: { variant: 'default', label: 'Entregado', icon: CheckCircle2 },
      read: { variant: 'default', label: 'Leído', icon: CheckCircle2 },
      failed: { variant: 'destructive', label: 'Fallido', icon: AlertCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Cargando mensajería...</p>
        </div>
      </div>
    );
  }

  const isWhatsAppConfigured = stats?.whatsapp_enabled && stats?.connection_status === 'connected';
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
    <div className="min-h-screen bg-gray-50/50">
      {/* Main Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <MainNav />
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Header con gradiente */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Mensajería</h1>
                <p className="text-green-50 mt-1">
                  Envía recordatorios automáticos y gestiona la comunicación con tus pacientes
                </p>
              </div>
            </div>
          </div>
          <Button variant="secondary" size="lg" asChild className="bg-white text-green-600 hover:bg-green-50">
            <Link href="/settings/mensajeria">
              <Settings className="mr-2 h-5 w-5" />
              Configurar WhatsApp
            </Link>
          </Button>
        </div>
      </div>

      {/* Configuration Alert */}
      {!isWhatsAppConfigured && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>WhatsApp no configurado</AlertTitle>
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>Configura tu cuenta de WhatsApp Business para comenzar a enviar mensajes</span>
              <Button size="sm" asChild>
                <Link href="/settings/mensajeria">Configurar ahora</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards con colores */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Enviados</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Send className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.total_sent || 0}</div>
            <p className="text-xs text-blue-600/70 mt-1">Mensajes enviados en total</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Entregados</CardTitle>
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.total_delivered || 0}</div>
            <p className="text-xs text-green-600/70 mt-1">
              {stats?.total_sent && stats.total_sent > 0
                ? `${Math.round((stats.total_delivered / stats.total_sent) * 100)}% tasa de entrega`
                : '0% tasa de entrega'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Leídos</CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats?.total_read || 0}</div>
            <p className="text-xs text-purple-600/70 mt-1">
              {stats?.total_delivered && stats.total_delivered > 0
                ? `${Math.round((stats.total_read / stats.total_delivered) * 100)}% tasa de lectura`
                : '0% tasa de lectura'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">
              Disponibles Hoy ({stats?.today_sent || 0}/{stats?.today_limit || 1000})
            </CardTitle>
            <div className="p-2 bg-orange-500 rounded-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {(stats?.today_limit || 1000) - (stats?.today_sent || 0)}
            </div>
            <p className="text-xs text-orange-600/70 mt-1">Mensajes restantes hoy</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="whatsapp">
            <MessageSquare className="h-4 w-4 mr-2" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="sms">
            <Send className="h-4 w-4 mr-2" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="reminders">
            <Clock className="h-4 w-4 mr-2" />
            Recordatorios
          </TabsTrigger>
        </TabsList>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>Mensajes Recientes de WhatsApp</CardTitle>
              <CardDescription>Historial de mensajes enviados por WhatsApp Business</CardDescription>
            </CardHeader>
            <CardContent>
              {recentMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No hay mensajes enviados todavía</p>
                  {isWhatsAppConfigured && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Los mensajes aparecerán aquí cuando se envíen
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMessages.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-start justify-between border-b pb-4 last:border-0"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{message.patient_name}</p>
                          {getStatusBadge(message.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">{message.to_phone}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{message.message_body}</p>
                        {message.error_message && (
                          <p className="text-xs text-destructive">Error: {message.error_message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms">
          <div className="space-y-6">
            {/* Formulario de prueba */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-green-600" />
                  Enviar SMS de Prueba
                </CardTitle>
                <CardDescription>
                  Envía un mensaje de prueba para validar tu configuración de Twilio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-phone">Teléfono (con código de país)</Label>
                  <Input
                    id="test-phone"
                    type="tel"
                    placeholder="+521234567890"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ejemplo: +52 para México, +1 para USA
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-message">Mensaje</Label>
                  <Textarea
                    id="test-message"
                    placeholder="Escribe tu mensaje..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={sendTestMessage}
                  disabled={isSendingTest || !testPhone || !testMessage}
                  className="w-full"
                >
                  {isSendingTest ? (
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
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuración de credenciales</AlertTitle>
              <AlertDescription>
                Las credenciales de Twilio ya están guardadas. El sistema enviará el SMS automáticamente.
                Si necesitas cambiarlas, ve a Configuración → Mensajería.
              </AlertDescription>
            </Alert>

            <SmsReminderSettings
              config={smsConfig}
              onConfigChange={updateSmsConfig}
            />

            <GuideToggle label="¿Cómo funcionan los recordatorios por SMS?">
              <SmsRemindersGuide />
            </GuideToggle>
          </div>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Mensajes por Email</CardTitle>
              <CardDescription>Próximamente: Envío de recordatorios por correo electrónico</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Esta funcionalidad estará disponible próximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reminders Tab */}
        <TabsContent value="reminders">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Recordatorios</CardTitle>
              <CardDescription>Gestiona los recordatorios automáticos para citas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!hasSmsEnabled && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Activa los recordatorios por SMS</AlertTitle>
                  <AlertDescription>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span>Ve a la pestaña SMS para elegir horarios y guardar tus credenciales.</span>
                      <Button size="sm" asChild>
                        <Link href="/messaging?tab=sms">Abrir pestaña SMS</Link>
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {hasSmsEnabled && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Recordatorios SMS activos</AlertTitle>
                    <AlertDescription>
                      Tus pacientes recibirán mensajes en los horarios configurados. Puedes ajustar el contenido en la pestaña SMS.
                    </AlertDescription>
                  </Alert>

                  {smsTimingCards.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {smsTimingCards}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-muted-foreground">
                      Activa al menos un horario en la pestaña SMS para comenzar a enviar recordatorios.
                    </div>
                  )}

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="mb-3 text-sm font-medium text-slate-900">Opciones habilitadas</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {smsOptionsSummary.map((option) => (
                        <li key={option.id} className="flex items-start gap-2">
                          {option.enabled ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                          ) : (
                            <Clock className="mt-0.5 h-4 w-4 text-slate-400" />
                          )}
                          <span>{option.enabled ? option.on : option.off}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {isWhatsAppConfigured ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>WhatsApp conectado</AlertTitle>
                  <AlertDescription>
                    Tus mensajes de WhatsApp se envían desde el número configurado. Consulta el historial en la pestaña WhatsApp.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Conecta WhatsApp Business</AlertTitle>
                  <AlertDescription>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span>Completa tus credenciales en Configuración → Mensajería para habilitar WhatsApp.</span>
                      <Button size="sm" asChild>
                        <Link href="/settings/mensajeria">Configurar WhatsApp</Link>
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
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
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Cargando mensajería...</p>
        </div>
      </div>
    }>
      <MessagingContent />
    </Suspense>
  );
}
