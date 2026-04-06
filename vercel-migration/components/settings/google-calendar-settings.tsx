'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlassPanel } from '@/components/ui/glass-panel';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Link as LinkIcon,
  Unlink,
  Info,
  Clock,
  Mail,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface SyncSettings {
  syncEnabled: boolean;
  autoSync: boolean;
  syncIntervalMinutes: number;
}

interface ConnectionStatus {
  connected: boolean;
  googleEmail?: string;
  calendarId?: string;
  syncEnabled?: boolean;
  autoSync?: boolean;
  syncIntervalMinutes?: number;
  lastSyncAt?: string;
  syncedEventsCount?: number;
}

export default function GoogleCalendarSettings() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ connected: false });
  const [settings, setSettings] = useState<SyncSettings>({
    syncEnabled: true,
    autoSync: true,
    syncIntervalMinutes: 15
  });

  // Check for URL params (success/error from callback)
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'connected') {
      toast.success('¡Conectado a Google Calendar!', {
        description: 'Tu cuenta ha sido vinculada exitosamente'
      });
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/settings/google-calendar');
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        auth_denied: 'Autorización denegada por el usuario',
        missing_params: 'Parámetros faltantes en la respuesta',
        invalid_state: 'Estado de seguridad inválido',
        expired: 'La solicitud expiró, intenta de nuevo',
        unauthorized: 'No autorizado',
        not_configured: 'Google Calendar no está configurado en el servidor',
        token_failed: 'Error al obtener tokens de Google',
        storage_failed: 'Error al guardar credenciales',
        unknown: 'Error desconocido'
      };
      toast.error('Error al conectar', {
        description: errorMessages[error] || error
      });
      window.history.replaceState({}, '', '/dashboard/settings/google-calendar');
    }
  }, [searchParams]);

  // Load connection status on mount
  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  const fetchConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/google-calendar/sync');
      const data = await response.json();
      
      setConnectionStatus(data);
      
      if (data.connected) {
        setSettings({
          syncEnabled: data.syncEnabled ?? true,
          autoSync: data.autoSync ?? true,
          syncIntervalMinutes: data.syncIntervalMinutes ?? 15
        });
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const response = await fetch('/api/google-calendar/auth');
      const data = await response.json();

      if (data.error) {
        toast.error('Error', { description: data.error });
        return;
      }

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      toast.error('Error al iniciar conexión');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/google-calendar/sync', { method: 'DELETE' });
      
      if (response.ok) {
        setConnectionStatus({ connected: false });
        toast.success('Desconectado de Google Calendar');
      } else {
        toast.error('Error al desconectar');
      }
    } catch (error) {
      toast.error('Error al desconectar');
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch('/api/google-calendar/sync', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        toast.success('Sincronización completada', {
          description: `${data.eventsExported} exportadas, ${data.eventsUpdated} actualizadas`
        });
        // Refresh status
        fetchConnectionStatus();
      } else {
        toast.error('Error en sincronización', { description: data.error });
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <GlassPanel className="border-white/10 bg-white/5 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white/50" />
        </div>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Connection Card */}
      <GlassPanel className="border-white/10 bg-white/5 p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center">
            <CalendarIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Sincronización con Google Calendar</h3>
            <p className="text-sm text-white/60">Sincroniza tus citas automáticamente con Google Calendar</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            {connectionStatus.connected ? (
              <>
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-emerald-300">Conectado a Google Calendar</p>
                  {connectionStatus.googleEmail && (
                    <p className="text-sm text-white/60 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {connectionStatus.googleEmail}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-orange-300">No conectado</p>
                  <p className="text-sm text-white/60">Conecta tu cuenta de Google para sincronizar</p>
                </div>
              </>
            )}
          </div>

          {connectionStatus.connected ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="gap-2 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="gap-2 rounded-full border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
              >
                <Unlink className="h-4 w-4" />
                Desconectar
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting} 
              className="gap-2 rounded-full bg-gradient-to-r from-blue-500 to-sky-500 text-white font-semibold shadow-lg hover:opacity-90"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LinkIcon className="h-4 w-4" />
              )}
              Conectar con Google
            </Button>
          )}
        </div>
      </GlassPanel>

      {connectionStatus.connected && (
        <GlassPanel className="border-white/10 bg-white/5 p-6 text-white space-y-6">
          {/* Enable/Disable Sync */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="sync-enabled" className="text-base font-semibold text-white">
                Activar Sincronización
              </Label>
              <p className="text-sm text-white/60">
                Sincroniza citas automáticamente con Google Calendar
              </p>
            </div>
            <Switch
              id="sync-enabled"
              checked={settings.syncEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, syncEnabled: checked })}
            />
          </div>

          {settings.syncEnabled && (
            <>
              <div className="h-px bg-white/10" />

              {/* Auto Sync */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-sync" className="text-white">Sincronización Automática</Label>
                  <p className="text-sm text-white/60">
                    Sincroniza automáticamente en segundo plano
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={settings.autoSync}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoSync: checked })}
                />
              </div>

              {/* Sync Interval */}
              {settings.autoSync && (
                <div className="space-y-2">
                  <Label htmlFor="sync-interval" className="flex items-center gap-2 text-white">
                    <Clock className="h-4 w-4" />
                    Intervalo de Sincronización
                  </Label>
                  <Select
                    value={settings.syncIntervalMinutes.toString()}
                    onValueChange={(value) => setSettings({ ...settings, syncIntervalMinutes: parseInt(value) })}
                  >
                    <SelectTrigger id="sync-interval" className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Cada 5 minutos</SelectItem>
                      <SelectItem value="15">Cada 15 minutos</SelectItem>
                      <SelectItem value="30">Cada 30 minutos</SelectItem>
                      <SelectItem value="60">Cada hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="h-px bg-white/10" />

              {/* Sync Stats */}
              <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-sky-500/10 border border-blue-500/20 p-4">
                <p className="font-medium text-blue-300 mb-3">Estado de Sincronización</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-2xl font-semibold text-white">{connectionStatus.syncedEventsCount || 0}</p>
                    <p className="text-xs text-white/60">Eventos sincronizados</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-sm font-medium text-white">
                      {connectionStatus.lastSyncAt 
                        ? formatLastSync(connectionStatus.lastSyncAt)
                        : 'Nunca'
                      }
                    </p>
                    <p className="text-xs text-white/60">Última sincronización</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </GlassPanel>
      )}

      {/* Info Box */}
      <GlassPanel className="border-white/10 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 p-5 text-white">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-sky-400 mt-0.5" />
          <div>
            <p className="font-medium mb-2">¿Cómo funciona la sincronización?</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-white/70">
              <li>Las citas creadas en AgendaMedPro se exportan a Google Calendar</li>
              <li>Verás las citas en tu teléfono y otros dispositivos</li>
              <li>Los cambios se sincronizan cuando presionas &quot;Sincronizar&quot;</li>
              <li>Tus datos están seguros y encriptados</li>
            </ul>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
