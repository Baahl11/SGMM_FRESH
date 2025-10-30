'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Link as LinkIcon,
  Unlink,
  Info,
  Clock
} from 'lucide-react';
import {
  loadGoogleCalendarConfig,
  saveGoogleCalendarConfig,
  loadSyncStatus,
  saveSyncStatus,
  getSyncStatusLabel,
  clearGoogleCalendarData,
  generateGoogleOAuthUrl,
  CONFLICT_RESOLUTION_STRATEGIES,
  ConflictResolutionStrategy,
  GoogleCalendarConfig,
  SyncStatus
} from '@/lib/utils/google-calendar';
import { toast } from 'sonner';

export default function GoogleCalendarSettings() {
  const [config, setConfig] = useState<GoogleCalendarConfig>(loadGoogleCalendarConfig());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(loadSyncStatus());
  const [isConnected, setIsConnected] = useState(false);
  const [conflictStrategy, setConflictStrategy] = useState<ConflictResolutionStrategy>('local-wins');

  useEffect(() => {
    // Check if already connected (has tokens)
    const hasTokens = typeof window !== 'undefined' && 
      localStorage.getItem('google-calendar-access-token');
    setIsConnected(Boolean(hasTokens));
  }, []);

  const handleConnect = () => {
    const oauthUrl = generateGoogleOAuthUrl(config);
    window.location.href = oauthUrl;
  };

  const handleDisconnect = () => {
    clearGoogleCalendarData();
    setIsConnected(false);
    setConfig({ ...config, enabled: false });
    toast.success('Google Calendar desconectado');
  };

  const handleSync = async () => {
    setSyncStatus({ ...syncStatus, syncInProgress: true });
    saveSyncStatus({ ...syncStatus, syncInProgress: true });

    try {
      // TODO: Implement actual sync logic
      // This would call your backend API to sync
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      const newStatus: SyncStatus = {
        lastSyncAt: new Date().toISOString(),
        syncInProgress: false,
        eventsImported: 5,
        eventsExported: 3,
        conflicts: 0
      };

      setSyncStatus(newStatus);
      saveSyncStatus(newStatus);

      toast.success('Sincronización completada', {
        description: `${newStatus.eventsImported} importadas, ${newStatus.eventsExported} exportadas`
      });
    } catch (error) {
      const errorStatus: SyncStatus = {
        ...syncStatus,
        syncInProgress: false,
        syncError: 'Error al sincronizar'
      };
      setSyncStatus(errorStatus);
      saveSyncStatus(errorStatus);
      toast.error('Error en sincronización');
    }
  };

  const updateConfig = (updates: Partial<GoogleCalendarConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    saveGoogleCalendarConfig(newConfig);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
          <CardTitle>Sincronización con Google Calendar</CardTitle>
        </div>
        <CardDescription>
          Sincroniza tus citas automáticamente con Google Calendar
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Conectado a Google Calendar</p>
                  <p className="text-sm text-green-700">{getSyncStatusLabel(syncStatus)}</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">No conectado</p>
                  <p className="text-sm text-orange-700">Conecta tu cuenta de Google para sincronizar</p>
                </div>
              </>
            )}
          </div>

          {isConnected ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncStatus.syncInProgress}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncStatus.syncInProgress ? 'animate-spin' : ''}`} />
                {syncStatus.syncInProgress ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="gap-2"
              >
                <Unlink className="h-4 w-4" />
                Desconectar
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnect} className="gap-2">
              <LinkIcon className="h-4 w-4" />
              Conectar con Google
            </Button>
          )}
        </div>

        {isConnected && (
          <>
            <Separator />

            {/* Enable/Disable Sync */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="sync-enabled" className="text-base font-semibold">
                  Activar Sincronización
                </Label>
                <p className="text-sm text-muted-foreground">
                  Sincroniza citas automáticamente con Google Calendar
                </p>
              </div>
              <Switch
                id="sync-enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => updateConfig({ enabled: checked })}
              />
            </div>

            {config.enabled && (
              <>
                {/* Auto Sync */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto-sync">Sincronización Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincroniza automáticamente en segundo plano
                    </p>
                  </div>
                  <Switch
                    id="auto-sync"
                    checked={config.autoSync}
                    onCheckedChange={(checked) => updateConfig({ autoSync: checked })}
                  />
                </div>

                {/* Sync Interval */}
                {config.autoSync && (
                  <div className="space-y-2">
                    <Label htmlFor="sync-interval" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Intervalo de Sincronización
                    </Label>
                    <Select
                      value={config.syncInterval.toString()}
                      onValueChange={(value) => updateConfig({ syncInterval: parseInt(value) })}
                    >
                      <SelectTrigger id="sync-interval">
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

                <Separator />

                {/* Conflict Resolution */}
                <div className="space-y-2">
                  <Label htmlFor="conflict-strategy">Resolución de Conflictos</Label>
                  <Select
                    value={conflictStrategy}
                    onValueChange={(value) => setConflictStrategy(value as ConflictResolutionStrategy)}
                  >
                    <SelectTrigger id="conflict-strategy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONFLICT_RESOLUTION_STRATEGIES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Cuando hay diferencias entre AgendaMedPro y Google Calendar
                  </p>
                </div>

                {/* Sync Stats */}
                {syncStatus.lastSyncAt && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                    <p className="font-medium text-blue-900 mb-2">Última sincronización</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-600 font-medium">{syncStatus.eventsImported}</p>
                        <p className="text-blue-800">Importadas</p>
                      </div>
                      <div>
                        <p className="text-blue-600 font-medium">{syncStatus.eventsExported}</p>
                        <p className="text-blue-800">Exportadas</p>
                      </div>
                      <div>
                        <p className="text-blue-600 font-medium">{syncStatus.conflicts}</p>
                        <p className="text-blue-800">Conflictos</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Info Box */}
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-900">
              <p className="font-medium">¿Cómo funciona la sincronización?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Las citas creadas en AgendaMedPro se exportan a Google Calendar</li>
                <li>Los eventos de Google Calendar se importan como citas</li>
                <li>Los cambios se sincronizan automáticamente (si está activado)</li>
                <li>Los conflictos se resuelven según la estrategia elegida</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
