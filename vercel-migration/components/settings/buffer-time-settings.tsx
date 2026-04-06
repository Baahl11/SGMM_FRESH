'use client';

import React, { useState, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Clock, Info, CheckCircle2 } from 'lucide-react';
import {
  BufferTimeConfig,
  DEFAULT_BUFFER_CONFIG,
  loadBufferConfig,
  saveBufferConfig,
  getBufferTimeLabel,
  BUFFER_TIME_PRESETS
} from '@/lib/utils/buffer-time';

export default function BufferTimeSettings() {
  const [config, setConfig] = useState<BufferTimeConfig>(DEFAULT_BUFFER_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadedConfig = loadBufferConfig();
    setConfig(loadedConfig);
  }, []);

  const handleSave = () => {
    saveBufferConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateConfig = (updates: Partial<BufferTimeConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <GlassPanel className="border-white/10 bg-white/5 p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <Clock className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Buffer Time entre Citas</h3>
          <p className="text-sm text-white/60">Configura tiempo de buffer automático entre citas para evitar agendar citas seguidas sin descanso</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
          <div className="space-y-1">
            <Label htmlFor="buffer-enabled" className="text-base font-semibold text-white">
              Activar Buffer Time
            </Label>
            <p className="text-sm text-white/60">
              Bloquea automáticamente slots de tiempo entre citas
            </p>
          </div>
          <Switch
            id="buffer-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => updateConfig({ enabled: checked })}
          />
        </div>

        {config.enabled && (
          <>
            <div className="h-px bg-white/10" />

            {/* Global Buffer */}
            <div className="space-y-3">
              <Label htmlFor="global-buffer" className="text-base font-semibold text-white">
                Buffer Global (Default)
              </Label>
              <Select
                value={config.globalBufferMinutes.toString()}
                onValueChange={(value) => updateConfig({ globalBufferMinutes: parseInt(value) })}
              >
                <SelectTrigger id="global-buffer" className="bg-white/5 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUFFER_TIME_PRESETS.map(preset => (
                    <SelectItem key={preset.value} value={preset.value.toString()}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-white/60">
                Tiempo de buffer aplicado por defecto a todas las citas
              </p>
            </div>

            <div className="h-px bg-white/10" />

            {/* Buffer Position */}
            <div className="space-y-4">
              <Label className="text-base font-semibold text-white">Aplicar Buffer</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
                  <div className="space-y-0.5">
                    <Label htmlFor="buffer-before" className="text-white">Antes de la cita</Label>
                    <p className="text-xs text-white/50">Bloquea slots antes del inicio de la cita</p>
                  </div>
                  <Switch
                    id="buffer-before"
                    checked={config.applyBeforeAppointment || false}
                    onCheckedChange={(checked) => updateConfig({ applyBeforeAppointment: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
                  <div className="space-y-0.5">
                    <Label htmlFor="buffer-after" className="text-white">Después de la cita</Label>
                    <p className="text-xs text-white/50">Bloquea slots después del fin de la cita (recomendado)</p>
                  </div>
                  <Switch
                    id="buffer-after"
                    checked={config.applyAfterAppointment !== false}
                    onCheckedChange={(checked) => updateConfig({ applyAfterAppointment: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-white/10" />

            {/* Info Box */}
            <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm text-white/80">
                  <p className="font-medium text-blue-300">¿Cómo funciona el Buffer Time?</p>
                  <ul className="list-disc list-inside space-y-1 text-white/60">
                    <li>Los slots de buffer se marcan como no disponibles automáticamente</li>
                    <li>El buffer se aplica solo entre citas, no al inicio/fin del día</li>
                    <li>Ejemplo: Con 10 min de buffer, después de una cita de 9:00-9:30, el slot 9:30-9:40 queda bloqueado</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-sm font-medium mb-2 text-white/80">Vista Previa:</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium">
                  {getBufferTimeLabel(config.globalBufferMinutes)}
                </span>
                <span className="text-white/60">
                  {config.applyBeforeAppointment && config.applyAfterAppointment && 'antes y después de cada cita'}
                  {config.applyBeforeAppointment && !config.applyAfterAppointment && 'antes de cada cita'}
                  {!config.applyBeforeAppointment && config.applyAfterAppointment && 'después de cada cita'}
                  {!config.applyBeforeAppointment && !config.applyAfterAppointment && '(configura al menos uno)'}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-2">
          {saved && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Guardado</span>
            </div>
          )}
          <Button 
            onClick={handleSave} 
            className="gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:opacity-90"
          >
            <CheckCircle2 className="h-4 w-4" />
            Guardar Configuración
          </Button>
        </div>
      </div>
    </GlassPanel>
  );
}
