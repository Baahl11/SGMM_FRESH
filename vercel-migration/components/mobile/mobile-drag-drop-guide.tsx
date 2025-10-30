"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Hand, Vibrate, Eye, Move, ZoomIn, CheckCircle2, AlertCircle } from 'lucide-react';

export function MobileDragDropGuide() {
  return (
    <Card className="border-gradient-to-r from-purple-200 to-indigo-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Smartphone className="h-5 w-5" />
          Arrastrar y Soltar en Dispositivos Móviles
        </CardTitle>
        <CardDescription className="text-purple-700">
          Mueve citas fácilmente con gestos táctiles optimizados para pantallas touch
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* How to Use */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Hand className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-purple-900 mb-1">
                Presión Prolongada para Arrastrar
              </h4>
              <p className="text-sm text-purple-700">
                Mantén presionado el dedo sobre una cita durante medio segundo. 
                Sentirás una vibración que indica que puedes comenzar a arrastrarla.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Move className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-purple-900 mb-1">
                Arrastre Fluido con Visual Mejorado
              </h4>
              <p className="text-sm text-purple-700">
                Al arrastrar, verás una copia del elemento que sigue tu dedo con efecto de elevación. 
                La cita original se atenúa para indicar que está siendo movida.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-purple-900 mb-1">
                Zonas de Soltar con Feedback Visual
              </h4>
              <p className="text-sm text-purple-700">
                Las zonas donde puedes soltar se iluminan en <strong className="text-green-700">verde</strong> si el movimiento es válido, 
                o en <strong className="text-red-600">rojo</strong> si hay conflictos. Suelta el dedo para completar el movimiento.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <ZoomIn className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-purple-900 mb-1">
                Auto-Scroll en Bordes
              </h4>
              <p className="text-sm text-purple-700">
                Al acercarte al borde superior o inferior de la pantalla mientras arrastras, 
                la página se desplazará automáticamente para que puedas alcanzar más horarios.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Indicators */}
        <div className="space-y-3">
          <h4 className="font-medium text-purple-900 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Indicadores Visuales
          </h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-purple-200">
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900">Cita Original Atenuada</p>
                <p className="text-xs text-purple-700">Indica que la cita está siendo arrastrada</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-green-200">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900">Zona Verde</p>
                <p className="text-xs text-purple-700">Movimiento válido, puedes soltar aquí</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-red-200">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900">Zona Roja</p>
                <p className="text-xs text-purple-700">Conflicto detectado, no puedes soltar aquí</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-blue-200">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <div className="w-4 h-4 rounded bg-blue-500 shadow-lg"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900">Elemento Flotante</p>
                <p className="text-xs text-purple-700">Copia elevada que sigue tu dedo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Haptic Feedback */}
        <div className="space-y-3">
          <h4 className="font-medium text-purple-900 flex items-center gap-2">
            <Vibrate className="h-4 w-4" />
            Retroalimentación Háptica
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2 p-2 rounded bg-purple-100">
              <Badge variant="outline" className="bg-purple-200 text-purple-800 border-purple-300 text-xs">
                Vibración Media
              </Badge>
              <span className="text-purple-900">Al iniciar el arrastre (presión prolongada completada)</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded bg-purple-100">
              <Badge variant="outline" className="bg-purple-200 text-purple-800 border-purple-300 text-xs">
                Vibración Ligera
              </Badge>
              <span className="text-purple-900">Al entrar en una zona de soltar válida</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded bg-purple-100">
              <Badge variant="outline" className="bg-purple-200 text-purple-800 border-purple-300 text-xs">
                Vibración Fuerte
              </Badge>
              <span className="text-purple-900">Al soltar exitosamente en una zona válida</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h4 className="font-medium text-purple-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Características Móviles
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span className="text-purple-700">
                <strong>Detección automática:</strong> El sistema detecta dispositivos táctiles y activa el modo móvil
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span className="text-purple-700">
                <strong>Presión prolongada configurable:</strong> Ajusta la duración de 300ms a 1000ms
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span className="text-purple-700">
                <strong>Tolerancia de movimiento:</strong> Evita activaciones accidentales al desplazar
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span className="text-purple-700">
                <strong>Auto-scroll inteligente:</strong> Velocidad configurable de 1-10 px/frame
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span className="text-purple-700">
                <strong>Prevención de scroll:</strong> Bloquea el desplazamiento accidental durante arrastre
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span className="text-purple-700">
                <strong>Compatible:</strong> iOS (iPhone/iPad), Android, tablets y cualquier dispositivo touch
              </span>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <div className="text-sm text-purple-900">
              <p className="font-medium mb-1">💡 Consejos para Uso Móvil</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Mantén el dedo firme durante medio segundo antes de arrastrar</li>
                <li>Usa el dedo índice o pulgar para mayor precisión</li>
                <li>Si el arrastre no inicia, verifica que no estés moviendo el dedo</li>
                <li>En pantallas pequeñas, usa vista de día o semana para más espacio</li>
                <li>La vibración te confirma cuando el arrastre ha iniciado correctamente</li>
                <li>Zoom de pantalla: usa pellizcar si necesitas ver mejor los detalles</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Device Compatibility */}
        <div className="space-y-2">
          <h4 className="font-medium text-purple-900">Compatibilidad</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded bg-white border border-purple-200">
              <Badge variant="default" className="bg-green-600">✓</Badge>
              <span className="text-sm text-purple-900">iOS Safari</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-white border border-purple-200">
              <Badge variant="default" className="bg-green-600">✓</Badge>
              <span className="text-sm text-purple-900">Chrome Android</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-white border border-purple-200">
              <Badge variant="default" className="bg-green-600">✓</Badge>
              <span className="text-sm text-purple-900">Samsung Internet</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-white border border-purple-200">
              <Badge variant="default" className="bg-green-600">✓</Badge>
              <span className="text-sm text-purple-900">Firefox Mobile</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
