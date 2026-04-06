"use client";

import { GlassPanel } from '@/components/ui/glass-panel';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Info, Smartphone, Hand, Vibrate, Eye } from 'lucide-react';
import { MobileDragConfig } from '@/lib/utils/mobile-drag-drop';

interface MobileDragDropSettingsProps {
  config: MobileDragConfig;
  onConfigChange: (config: Partial<MobileDragConfig>) => void;
}

export function MobileDragDropSettings({ config, onConfigChange }: MobileDragDropSettingsProps) {
  return (
    <GlassPanel className="border-white/10 bg-white/5 p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
          <Smartphone className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Arrastrar y Soltar en Móviles</h3>
          <p className="text-sm text-white/60">Optimiza la experiencia táctil para dispositivos móviles y tablets</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Long Press Duration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2 text-white">
                <Hand className="h-4 w-4" />
                Duración de Presión Prolongada
              </Label>
              <p className="text-sm text-white/60">Tiempo que debe mantener presionado para iniciar arrastre</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm font-medium">
              {config.longPressDuration}ms
            </span>
          </div>
          <Slider
            value={[config.longPressDuration]}
            onValueChange={(value) => onConfigChange({ longPressDuration: value[0] })}
            min={300}
            max={1000}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-white/50">
            <span>Rápido (300ms)</span>
            <span>Lento (1000ms)</span>
          </div>
        </div>

        <div className="h-px bg-white/10" />

        {/* Long Press Threshold */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-white">Tolerancia de Movimiento</Label>
              <p className="text-sm text-white/60">Movimiento permitido sin cancelar la presión prolongada</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm font-medium">
              {config.longPressThreshold}px
            </span>
          </div>
          <Slider
            value={[config.longPressThreshold]}
            onValueChange={(value) => onConfigChange({ longPressThreshold: value[0] })}
            min={5}
            max={30}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-white/50">
            <span>Sensible (5px)</span>
            <span>Tolerante (30px)</span>
          </div>
        </div>

        <div className="h-px bg-white/10" />

        {/* Haptic Feedback */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2 text-white">
              <Vibrate className="h-4 w-4" />
              Vibración Háptica
            </Label>
            <p className="text-sm text-white/60">Vibrar al iniciar y soltar arrastre (si el dispositivo lo soporta)</p>
          </div>
          <Switch
            checked={config.hapticFeedback}
            onCheckedChange={(checked) => onConfigChange({ hapticFeedback: checked })}
          />
        </div>

        {/* Show Touch Indicator */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2 text-white">
              <Eye className="h-4 w-4" />
              Indicador Visual de Arrastre
            </Label>
            <p className="text-sm text-white/60">Mostrar indicador visual durante el arrastre</p>
          </div>
          <Switch
            checked={true}
            onCheckedChange={() => {}}
          />
        </div>

        {/* Info Box */}
        <div className="rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-white/80">
              <p className="font-medium text-orange-300">Consejos para Móviles</p>
              <ul className="list-disc list-inside space-y-1 text-white/60">
                <li>Mantén presionado sobre una cita para iniciar el arrastre</li>
                <li>Arrastra a la nueva hora/día deseado</li>
                <li>Suelta para confirmar el cambio</li>
                <li>La vibración te ayuda a saber cuándo puedes arrastrar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
