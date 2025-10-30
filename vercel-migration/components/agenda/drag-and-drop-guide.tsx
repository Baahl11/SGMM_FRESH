'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, CheckCircle2, AlertCircle, Ban } from 'lucide-react';

export default function DragAndDropGuide() {
  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <GripVertical className="h-5 w-5 text-blue-600" />
          Arrastrar y Soltar Citas
        </CardTitle>
        <CardDescription>
          Mueve citas fácilmente arrastrándolas a nuevos horarios
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <GripVertical className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Cómo arrastrar</p>
              <p className="text-sm text-gray-600">
                Haz clic y mantén presionado sobre el icono de agarre (⠿) o sobre la cita, luego arrastra a un nuevo horario
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Zona válida</p>
              <p className="text-sm text-gray-600">
                Los slots válidos se iluminan en verde. Suelta la cita para confirmar el movimiento
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Conflictos</p>
              <p className="text-sm text-gray-600">
                Los slots con conflictos se muestran en rojo. El sistema te avisará si hay un problema
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Ban className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Restricciones</p>
              <p className="text-sm text-gray-600">
                No se pueden mover: citas completadas, canceladas, o en fechas pasadas
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-blue-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Estados visuales:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-400">
              ✓ Soltar aquí
            </Badge>
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-400">
              ⚠ Conflicto
            </Badge>
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
              ⏱️ Buffer
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
