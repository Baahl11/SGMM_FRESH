'use client';

import React from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Lock, 
  Unlock, 
  Shield, 
  Clock,
  RefreshCw,
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
    <GlassPanel className="border-white/10 bg-white/5 p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Prevención de Double-Booking</h3>
            <p className="text-sm text-white/60">Sistema de bloqueo temporal para evitar reservas simultáneas</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${
          config.enabled 
            ? 'bg-emerald-500/20 text-emerald-300' 
            : 'bg-white/10 text-white/60'
        }`}>
          {config.enabled ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          {config.enabled ? 'Activo' : 'Desactivado'}
        </span>
      </div>
      
      <div className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
          <div className="space-y-0.5">
            <Label className="text-white font-medium">Activar Sistema de Bloqueo</Label>
            <p className="text-sm text-white/60">Previene que dos personas reserven el mismo horario simultáneamente</p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => onConfigChange({ enabled: checked })}
          />
        </div>

        {config.enabled && (
          <>
            <div className="h-px bg-white/10" />

            {/* Lock Duration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2 text-white">
                    <Clock className="h-4 w-4" />
                    Duración del Bloqueo
                  </Label>
                  <p className="text-sm text-white/60">Tiempo que se mantiene reservado el slot mientras el usuario completa el formulario</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-sm font-medium">
                  {lockDurationSeconds}s
                </span>
              </div>
              <Slider
                value={[config.lockDuration]}
                onValueChange={(value) => onConfigChange({ lockDuration: value[0] })}
                min={30000}
                max={300000}
                step={10000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/50">
                <span>30 segundos</span>
                <span>5 minutos</span>
              </div>
            </div>

            <div className="h-px bg-white/10" />

            {/* Retry Delay */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2 text-white">
                    <RefreshCw className="h-4 w-4" />
                    Espera para Reintentar
                  </Label>
                  <p className="text-sm text-white/60">Tiempo de espera antes de permitir otro intento si el slot está bloqueado</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium">
                  {retryDelaySeconds}s
                </span>
              </div>
              <Slider
                value={[config.retryDelay]}
                onValueChange={(value) => onConfigChange({ retryDelay: value[0] })}
                min={1000}
                max={10000}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/50">
                <span>1 segundo</span>
                <span>10 segundos</span>
              </div>
            </div>

            <div className="h-px bg-white/10" />

            {/* Show Locked Indicator */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
              <div className="space-y-0.5">
                <Label className="text-white">Mostrar Indicador de Bloqueo</Label>
                <p className="text-sm text-white/60">Mostrar visualmente cuando un slot está siendo reservado por otro usuario</p>
              </div>
              <Switch
                checked={true}
                onCheckedChange={() => {}}
              />
            </div>

            {/* Allow Admin Override */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
              <div className="space-y-0.5">
                <Label className="text-white">Permitir Override por Admin</Label>
                <p className="text-sm text-white/60">Los administradores pueden reservar slots bloqueados</p>
              </div>
              <Switch
                checked={config.allowAdminOverride}
                onCheckedChange={(checked) => onConfigChange({ allowAdminOverride: checked })}
              />
            </div>

            {/* Notify on Block */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2 text-white">
                  <Bell className="h-4 w-4" />
                  Notificar al Usuario
                </Label>
                <p className="text-sm text-white/60">Mostrar mensaje cuando un slot está temporalmente bloqueado</p>
              </div>
              <Switch
                checked={true}
                onCheckedChange={() => {}}
              />
            </div>

            {/* Info Box */}
            <div className="rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-violet-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm text-white/80">
                  <p className="font-medium text-violet-300">¿Cómo funciona?</p>
                  <ul className="list-disc list-inside space-y-1 text-white/60">
                    <li>Cuando un usuario selecciona un horario, se bloquea temporalmente</li>
                    <li>Otros usuarios verán ese horario como &quot;en proceso&quot;</li>
                    <li>Si el usuario no completa la reserva, el bloqueo expira automáticamente</li>
                    <li>Esto evita que dos personas reserven el mismo horario</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Active Locks */}
            {activeLocks > 0 && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                <div className="flex items-center gap-2 text-amber-300 text-sm">
                  <Lock className="h-4 w-4" />
                  <span className="font-medium">{activeLocks} bloqueo(s) activo(s)</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </GlassPanel>
  );
}
