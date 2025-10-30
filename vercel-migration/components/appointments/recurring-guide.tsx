'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Repeat, Calendar, Edit, Trash2, Ban } from 'lucide-react';

export default function RecurringAppointmentsGuide() {
  return (
    <Card className="w-full bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Repeat className="h-5 w-5 text-purple-600" />
          Citas Recurrentes
        </CardTitle>
        <CardDescription>
          Crea series de citas que se repiten automáticamente
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Crear serie recurrente</p>
              <p className="text-sm text-gray-600">
                Al crear una cita, activa el switch "Cita Recurrente" y elige la frecuencia: diaria, semanal, quincenal o mensual
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Edit className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Editar serie</p>
              <p className="text-sm text-gray-600">
                Al editar una cita de una serie, elige si quieres modificar solo esa cita, esa y las siguientes, o toda la serie
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Ban className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Cancelar citas</p>
              <p className="text-sm text-gray-600">
                Puedes cancelar una sola cita de la serie sin afectar las demás, o cancelar el resto de la serie
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Trash2 className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Eliminar serie</p>
              <p className="text-sm text-gray-600">
                Al eliminar, puedes quitar solo una cita, las futuras, o eliminar toda la serie completa
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-purple-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Patrones disponibles:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              Diario
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              Semanal
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              Quincenal
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              Mensual
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              Personalizado
            </Badge>
          </div>
        </div>

        <div className="rounded-lg bg-purple-100 border border-purple-300 p-3">
          <p className="text-xs text-purple-900">
            <strong>💡 Tip:</strong> Las citas recurrentes son perfectas para terapias, tratamientos continuos, 
            o seguimientos periódicos. El sistema genera automáticamente todas las citas futuras según el patrón elegido.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
