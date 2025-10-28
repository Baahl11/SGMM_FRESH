'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Mail, Send, AlertCircle, Settings, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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

export default function MessagingPage() {
  const [stats, setStats] = useState<MessagingStats | null>(null);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMessagingData();
  }, []);

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

  return (
    <div className="space-y-6">
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
      <Tabs defaultValue="whatsapp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="whatsapp">
            <MessageSquare className="h-4 w-4 mr-2" />
            WhatsApp
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
            <CardContent className="space-y-4">
              {!isWhatsAppConfigured ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Configura WhatsApp primero</AlertTitle>
                  <AlertDescription>
                    Necesitas configurar tu cuenta de WhatsApp Business antes de activar recordatorios automáticos
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Recordatorios activos</AlertTitle>
                    <AlertDescription>
                      Los recordatorios automáticos están configurados. Los pacientes recibirán mensajes antes de sus citas.
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Recordatorio 24h</CardTitle>
                        <CardDescription>Un día antes de la cita</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Se envía automáticamente 24 horas antes de cada cita confirmada
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Recordatorio 1h</CardTitle>
                        <CardDescription>Una hora antes de la cita</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Se envía automáticamente 1 hora antes de cada cita confirmada
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Button variant="outline" asChild className="w-full">
                    <Link href="/settings/mensajeria">
                      <Settings className="mr-2 h-4 w-4" />
                      Ajustar configuración de recordatorios
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
