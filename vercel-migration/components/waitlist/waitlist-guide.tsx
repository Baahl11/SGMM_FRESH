"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Bell, CalendarCheck, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

export function WaitlistGuide() {
  return (
    <Card className="border-gradient-to-r from-purple-200 to-pink-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Users className="h-5 w-5" />
          Lista de Espera Automática
        </CardTitle>
        <CardDescription className="text-purple-700">
          Sistema inteligente de gestión de lista de espera con notificaciones automáticas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* How it works */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-purple-900 mb-1">
                Agregar Pacientes a la Lista
              </h4>
              <p className="text-sm text-purple-700">
                Los pacientes pueden agregarse manualmente con sus preferencias de horario, 
                doctor específico, y nivel de prioridad (Baja, Normal, Alta, Urgente).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-purple-900 mb-1">
                Detección Automática de Espacios
              </h4>
              <p className="text-sm text-purple-700">
                Cuando se cancela una cita o se libera un espacio, el sistema busca automáticamente 
                pacientes en lista de espera que coincidan con el horario, doctor y tipo de cita.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Bell className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-purple-900 mb-1">
                Notificación Inteligente
              </h4>
              <p className="text-sm text-purple-700">
                Los pacientes reciben notificaciones por email, SMS o WhatsApp según su prioridad. 
                Los pacientes urgentes son notificados primero.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CalendarCheck className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-purple-900 mb-1">
                Confirmación y Auto-Agenda
              </h4>
              <p className="text-sm text-purple-700">
                Los pacientes tienen un tiempo limitado para confirmar. Los pacientes urgentes 
                pueden ser agendados automáticamente sin esperar confirmación.
              </p>
            </div>
          </div>
        </div>

        {/* Priority Levels */}
        <div className="space-y-3">
          <h4 className="font-medium text-purple-900 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Niveles de Prioridad
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                Baja
              </Badge>
              <span className="text-xs text-purple-700">Sin urgencia</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                Normal
              </Badge>
              <span className="text-xs text-purple-700">Estándar</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                Alta
              </Badge>
              <span className="text-xs text-purple-700">Atención pronta</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                Urgente
              </Badge>
              <span className="text-xs text-purple-700">Inmediato</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h4 className="font-medium text-purple-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Características
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span className="text-purple-700">
                <strong>Preferencias de horario:</strong> Fechas específicas, rangos horarios, días de la semana
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span className="text-purple-700">
                <strong>Matching inteligente:</strong> Coincidencia automática con slots disponibles
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span className="text-purple-700">
                <strong>Multi-canal:</strong> Notificaciones por email, SMS y WhatsApp
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span className="text-purple-700">
                <strong>Auto-booking:</strong> Agendación automática para pacientes prioritarios
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span className="text-purple-700">
                <strong>Dashboard completo:</strong> Vista unificada con filtros por estado y prioridad
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span className="text-purple-700">
                <strong>Expiración configurable:</strong> Tiempo límite personalizable para respuesta
              </span>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="bg-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <div className="text-sm text-purple-900">
              <p className="font-medium mb-1">💡 Consejo</p>
              <p>
                Usa prioridades estratégicamente: pacientes con citas de seguimiento urgentes 
                o VIPs pueden tener prioridad "Alta" o "Urgente" para asegurar que sean notificados 
                primero cuando se liberen espacios.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
