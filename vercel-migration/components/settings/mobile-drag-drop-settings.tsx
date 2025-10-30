"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Info, Smartphone, Hand, Vibrate, Eye, Shield } from 'lucide-react';
import { MobileDragConfig } from '@/lib/utils/mobile-drag-drop';

interface MobileDragDropSettingsProps {
  config: MobileDragConfig;
  onConfigChange: (config: Partial<MobileDragConfig>) => void;
}

export function MobileDragDropSettings({ config, onConfigChange }: MobileDragDropSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Arrastrar y Soltar en Móviles
          </CardTitle>
          <CardDescription>
            Optimiza la experiencia táctil para dispositivos móviles y tablets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Long Press Duration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Hand className="h-4 w-4" />
                  Duración de Presión Prolongada
                </Label>
                <p className="text-sm text-muted-foreground">
                  Tiempo que debe mantener presionado para iniciar arrastre
                </p>
              </div>
              <Badge variant="secondary">{config.longPressDuration}ms</Badge>
            </div>
            <Slider
              value={[config.longPressDuration]}
              onValueChange={(value) => onConfigChange({ longPressDuration: value[0] })}
              min={300}
              max={1000}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rápido (300ms)</span>
              <span>Lento (1000ms)</span>
            </div>
          </div>

          {/* Long Press Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tolerancia de Movimiento</Label>
                <p className="text-sm text-muted-foreground">
                  Movimiento permitido sin cancelar la presión prolongada
                </p>
              </div>
              <Badge variant="secondary">{config.longPressThreshold}px</Badge>
            </div>
            <Slider
              value={[config.longPressThreshold]}
              onValueChange={(value) => onConfigChange({ longPressThreshold: value[0] })}
              min={5}
              max={30}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sensible (5px)</span>
              <span>Tolerante (30px)</span>
            </div>
          </div>

          {/* Haptic Feedback */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Vibrate className="h-4 w-4" />
                Vibración Táctil
              </Label>
              <p className="text-sm text-muted-foreground">
                Vibración al iniciar arrastre y al soltar en zona válida
              </p>
            </div>
            <Switch
              checked={config.hapticFeedback}
              onCheckedChange={(checked) => onConfigChange({ hapticFeedback: checked })}
            />
          </div>

          {/* Visual Feedback */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Feedback Visual Mejorado
              </Label>
              <p className="text-sm text-muted-foreground">
                Escala, sombras y animaciones al arrastrar
              </p>
            </div>
            <Switch
              checked={config.visualFeedback}
              onCheckedChange={(checked) => onConfigChange({ visualFeedback: checked })}
            />
          </div>

          {/* Prevent Scroll */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Prevenir Scroll Durante Arrastre
              </Label>
              <p className="text-sm text-muted-foreground">
                Bloquea el desplazamiento de página al arrastrar
              </p>
            </div>
            <Switch
              checked={config.preventScroll}
              onCheckedChange={(checked) => onConfigChange({ preventScroll: checked })}
            />
          </div>

          {/* Scroll Speed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Velocidad de Auto-Scroll</Label>
                <p className="text-sm text-muted-foreground">
                  Velocidad de desplazamiento al acercarse al borde
                </p>
              </div>
              <Badge variant="secondary">{config.scrollSpeed}px/frame</Badge>
            </div>
            <Slider
              value={[config.scrollSpeed]}
              onValueChange={(value) => onConfigChange({ scrollSpeed: value[0] })}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Lento (1)</span>
              <span>Rápido (10)</span>
            </div>
          </div>

          {/* Scroll Zone Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tamaño de Zona de Scroll</Label>
                <p className="text-sm text-muted-foreground">
                  Área cerca del borde que activa auto-scroll
                </p>
              </div>
              <Badge variant="secondary">{config.scrollZoneSize}px</Badge>
            </div>
            <Slider
              value={[config.scrollZoneSize]}
              onValueChange={(value) => onConfigChange({ scrollZoneSize: value[0] })}
              min={20}
              max={100}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pequeña (20px)</span>
              <span>Grande (100px)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-900">
              <p className="font-medium">Experiencia Táctil Optimizada</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li><strong>Presión prolongada</strong>: Mantén presionado 500ms para iniciar el arrastre</li>
                <li><strong>Retroalimentación háptica</strong>: Vibración al iniciar arrastre y al soltar correctamente</li>
                <li><strong>Visual mejorado</strong>: El elemento se escala y añade sombra al arrastrar</li>
                <li><strong>Auto-scroll</strong>: Al acercarte al borde superior/inferior, la página se desplaza automáticamente</li>
                <li><strong>Zonas de soltar</strong>: Verde = válido, Rojo = inválido</li>
                <li><strong>Compatible</strong>: iOS, Android, tablets y dispositivos táctiles</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Detection */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-purple-900">
            <Smartphone className="h-4 w-4" />
            Detección de Dispositivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-purple-700">Soporte táctil:</span>
            <Badge variant={typeof window !== 'undefined' && 'ontouchstart' in window ? 'default' : 'secondary'}>
              {typeof window !== 'undefined' && 'ontouchstart' in window ? 'Detectado' : 'No detectado'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700">Ancho de pantalla:</span>
            <span className="font-medium text-purple-900">
              {typeof window !== 'undefined' ? `${window.innerWidth}px` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700">Tipo de dispositivo:</span>
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              {typeof window !== 'undefined' && window.innerWidth <= 768 ? 'Móvil/Tablet' : 'Escritorio'}
            </Badge>
          </div>
          <p className="text-xs text-purple-700 pt-2">
            El sistema detecta automáticamente si el usuario está en un dispositivo móvil 
            y activa la funcionalidad táctil correspondiente.
          </p>
        </CardContent>
      </Card>

      {/* Recommended Settings */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-sm text-green-900">
            Configuraciones Recomendadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="space-y-1">
            <p className="font-medium text-green-900">Para iOS (iPhone/iPad):</p>
            <ul className="ml-4 list-disc text-green-700 space-y-0.5">
              <li>Presión prolongada: 600ms</li>
              <li>Tolerancia: 10px</li>
              <li>Vibración: Activada</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-green-900">Para Android:</p>
            <ul className="ml-4 list-disc text-green-700 space-y-0.5">
              <li>Presión prolongada: 500ms</li>
              <li>Tolerancia: 15px</li>
              <li>Vibración: Activada</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-green-900">Para Tablets:</p>
            <ul className="ml-4 list-disc text-green-700 space-y-0.5">
              <li>Presión prolongada: 400ms</li>
              <li>Tolerancia: 20px</li>
              <li>Auto-scroll rápido: 5px/frame</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
