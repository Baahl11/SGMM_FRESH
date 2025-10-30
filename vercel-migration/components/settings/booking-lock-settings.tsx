/**
 * Booking Lock Settings Component
 * 
 * Configuración del sistema de prevención de double-booking
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lock, 
  Unlock, 
  Shield, 
  AlertTriangle, 
  Clock,
  RefreshCw,
  Eye,
  ShieldCheck,
  Bell,
  Info
} from 'lucide-react';
import { BookingLockConfig } from '@/lib/utils/booking-lock';

interface BookingLockSettingsProps {
  config: BookingLockConfig;
  onConfigChange: (updates: Partial<BookingLockConfig>) => void;
  activeLocks?: number;
}

export function BookingLockSettings({ 
  config, 
  onConfigChange,
  activeLocks = 0 
}: BookingLockSettingsProps) {
  
  const lockDurationSeconds = Math.round(config.lockDuration / 1000);
  const cleanupIntervalSeconds = Math.round(config.cleanupInterval / 1000);
  const retryDelaySeconds = Math.round(config.retryDelay / 1000);
  
  return (
    <Card className="border-purple-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Prevención de Double-Booking</CardTitle>
              <CardDescription>
                Sistema de bloqueo temporal para evitar reservas simultáneas
              </CardDescription>
            </div>
          </div>
          <Badge variant={config.enabled ? "default" : "secondary"} className="gap-2">
            {config.enabled ? (
              <>
                <Lock className="h-3 w-3" />
                Activo
              </>
            ) : (
              <>
                <Unlock className="h-3 w-3" />
                Desactivado
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
            <div>
              <Label htmlFor="enabled" className="text-base font-semibold">
                Habilitar Protección
              </Label>
              <p className="text-sm text-gray-600">
                Activa el sistema de bloqueo temporal de slots
              </p>
            </div>
          </div>
          <Switch
            id="enabled"
            checked={config.enabled}
            onCheckedChange={(enabled) => onConfigChange({ enabled })}
          />
        </div>
        
        {config.enabled && (
          <>
            {/* Active Locks Info */}
            {activeLocks > 0 && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  Actualmente hay <strong>{activeLocks}</strong> slot{activeLocks !== 1 ? 's' : ''} bloqueado{activeLocks !== 1 ? 's' : ''}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Lock Duration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-medium">Duración del Bloqueo</Label>
                </div>
                <Badge variant="outline" className="text-sm">
                  {lockDurationSeconds} segundos
                </Badge>
              </div>
              <Slider
                value={[config.lockDuration]}
                onValueChange={([lockDuration]) => onConfigChange({ lockDuration })}
                min={15000} // 15 segundos
                max={300000} // 5 minutos
                step={5000} // 5 segundos
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>15s (Rápido)</span>
                <span>60s (Recomendado)</span>
                <span>5min (Largo)</span>
              </div>
              <p className="text-xs text-gray-600">
                Tiempo que un slot permanece bloqueado mientras se está reservando
              </p>
            </div>
            
            {/* Cleanup Interval */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-medium">Intervalo de Limpieza</Label>
                </div>
                <Badge variant="outline" className="text-sm">
                  {cleanupIntervalSeconds}s
                </Badge>
              </div>
              <Slider
                value={[config.cleanupInterval]}
                onValueChange={([cleanupInterval]) => onConfigChange({ cleanupInterval })}
                min={5000} // 5 segundos
                max={60000} // 1 minuto
                step={5000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>5s</span>
                <span>30s</span>
                <span>60s</span>
              </div>
              <p className="text-xs text-gray-600">
                Frecuencia con la que se limpian bloqueos expirados
              </p>
            </div>
            
            {/* Max Retries */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-medium">Máximo de Reintentos</Label>
                </div>
                <Badge variant="outline" className="text-sm">
                  {config.maxRetries} intentos
                </Badge>
              </div>
              <Slider
                value={[config.maxRetries]}
                onValueChange={([maxRetries]) => onConfigChange({ maxRetries })}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 (Sin reintentos)</span>
                <span>3 (Recomendado)</span>
                <span>10 (Persistente)</span>
              </div>
              <p className="text-xs text-gray-600">
                Número de veces que se intenta adquirir un bloqueo antes de fallar
              </p>
            </div>
            
            {/* Retry Delay */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-medium">Retraso entre Reintentos</Label>
                </div>
                <Badge variant="outline" className="text-sm">
                  {retryDelaySeconds}s
                </Badge>
              </div>
              <Slider
                value={[config.retryDelay]}
                onValueChange={([retryDelay]) => onConfigChange({ retryDelay })}
                min={500}
                max={5000}
                step={500}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0.5s</span>
                <span>1s (Recomendado)</span>
                <span>5s</span>
              </div>
              <p className="text-xs text-gray-600">
                Tiempo de espera antes de cada reintento
              </p>
            </div>
            
            {/* Visual Indicators */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-gray-600" />
                <div>
                  <Label htmlFor="visual-indicators" className="text-sm font-semibold">
                    Indicadores Visuales
                  </Label>
                  <p className="text-xs text-gray-600">
                    Muestra indicadores en slots bloqueados
                  </p>
                </div>
              </div>
              <Switch
                id="visual-indicators"
                checked={config.showVisualIndicators}
                onCheckedChange={(showVisualIndicators) => onConfigChange({ showVisualIndicators })}
              />
            </div>
            
            {/* Admin Override */}
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-amber-600" />
                <div>
                  <Label htmlFor="admin-override" className="text-sm font-semibold">
                    Override de Administrador
                  </Label>
                  <p className="text-xs text-gray-600">
                    Permite a admins forzar bloqueos existentes
                  </p>
                </div>
              </div>
              <Switch
                id="admin-override"
                checked={config.allowAdminOverride}
                onCheckedChange={(allowAdminOverride) => onConfigChange({ allowAdminOverride })}
              />
            </div>
            
            {/* Conflict Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-600" />
                <div>
                  <Label htmlFor="notify-conflict" className="text-sm font-semibold">
                    Notificar Conflictos
                  </Label>
                  <p className="text-xs text-gray-600">
                    Muestra toast cuando hay conflictos
                  </p>
                </div>
              </div>
              <Switch
                id="notify-conflict"
                checked={config.notifyOnConflict}
                onCheckedChange={(notifyOnConflict) => onConfigChange({ notifyOnConflict })}
              />
            </div>
            
            {/* Info Alert */}
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <strong>¿Cómo funciona?</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Cuando un usuario empieza a reservar un slot, se bloquea temporalmente</li>
                  <li>• Otros usuarios ven el slot como "bloqueado" y no pueden reservarlo</li>
                  <li>• Si el usuario completa o cancela, el bloqueo se libera</li>
                  <li>• Si el tiempo expira, el bloqueo se libera automáticamente</li>
                  <li>• Previene race conditions cuando 2+ usuarios reservan simultáneamente</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            {/* Warning about performance */}
            {config.maxRetries > 5 && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-900">
                  <strong>Advertencia:</strong> Muchos reintentos pueden afectar el rendimiento.
                  Recomendamos máximo 3-5 intentos.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Recommended Settings */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Configuración Recomendada
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-semibold text-green-900">Clínicas Pequeñas</p>
                  <ul className="mt-1 space-y-0.5 text-green-700">
                    <li>• Duración: 30-60s</li>
                    <li>• Limpieza: 10s</li>
                    <li>• Reintentos: 2-3</li>
                  </ul>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-semibold text-blue-900">Clínicas Grandes</p>
                  <ul className="mt-1 space-y-0.5 text-blue-700">
                    <li>• Duración: 60-90s</li>
                    <li>• Limpieza: 5s</li>
                    <li>• Reintentos: 3-5</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
