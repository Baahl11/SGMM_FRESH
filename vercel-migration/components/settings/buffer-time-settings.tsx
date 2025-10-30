'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
    // Load saved config on mount
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <CardTitle>Buffer Time entre Citas</CardTitle>
        </div>
        <CardDescription>
          Configura tiempo de buffer automático entre citas para evitar agendar citas seguidas sin descanso
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enable/Disable Buffer Time */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="buffer-enabled" className="text-base font-semibold">
              Activar Buffer Time
            </Label>
            <p className="text-sm text-muted-foreground">
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
            <Separator />

            {/* Global Buffer Setting */}
            <div className="space-y-3">
              <Label htmlFor="global-buffer" className="text-base font-semibold">
                Buffer Global (Default)
              </Label>
              <Select
                value={config.globalBufferMinutes.toString()}
                onValueChange={(value) => updateConfig({ globalBufferMinutes: parseInt(value) })}
              >
                <SelectTrigger id="global-buffer">
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
              <p className="text-sm text-muted-foreground">
                Tiempo de buffer aplicado por defecto a todas las citas
              </p>
            </div>

            <Separator />

            {/* Buffer Position */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Aplicar Buffer
              </Label>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="buffer-before">Antes de la cita</Label>
                    <p className="text-xs text-muted-foreground">
                      Bloquea slots antes del inicio de la cita
                    </p>
                  </div>
                  <Switch
                    id="buffer-before"
                    checked={config.applyBeforeAppointment || false}
                    onCheckedChange={(checked) => updateConfig({ applyBeforeAppointment: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="buffer-after">Después de la cita</Label>
                    <p className="text-xs text-muted-foreground">
                      Bloquea slots después del fin de la cita (recomendado)
                    </p>
                  </div>
                  <Switch
                    id="buffer-after"
                    checked={config.applyAfterAppointment !== false}
                    onCheckedChange={(checked) => updateConfig({ applyAfterAppointment: checked })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Info Box */}
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm text-blue-900">
                  <p className="font-medium">¿Cómo funciona el Buffer Time?</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Los slots de buffer se marcan como no disponibles automáticamente</li>
                    <li>Puedes configurar buffers diferentes por doctor o tipo de cita (próximamente)</li>
                    <li>El buffer se aplica solo entre citas, no al inicio/fin del día</li>
                    <li>Ejemplo: Con 10 min de buffer, después de una cita de 9:00-9:30, el slot 9:30-9:40 queda bloqueado</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Current Preview */}
            <div className="rounded-lg bg-gray-50 p-4 border">
              <p className="text-sm font-medium mb-2">Vista Previa de Configuración:</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{getBufferTimeLabel(config.globalBufferMinutes)}</Badge>
                  <span className="text-muted-foreground">
                    {config.applyBeforeAppointment && config.applyAfterAppointment && 'antes y después de cada cita'}
                    {config.applyBeforeAppointment && !config.applyAfterAppointment && 'antes de cada cita'}
                    {!config.applyBeforeAppointment && config.applyAfterAppointment && 'después de cada cita'}
                    {!config.applyBeforeAppointment && !config.applyAfterAppointment && '(sin aplicar - configura al menos uno)'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-2 pt-4">
          {saved && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Guardado correctamente</span>
            </div>
          )}
          <Button onClick={handleSave} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Guardar Configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
