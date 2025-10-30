"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, CheckCircle2, Bell, DollarSign, AlertCircle } from 'lucide-react';

export function SmsRemindersGuide() {
  return (
    <Card className="border-gradient-to-r from-blue-200 to-cyan-200 bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <MessageSquare className="h-5 w-5" />
          Recordatorios Automáticos por SMS
        </CardTitle>
        <CardDescription className="text-blue-700">
          Reduce las ausencias enviando recordatorios de citas por mensaje de texto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* How it works */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">
                Recordatorios Automáticos
              </h4>
              <p className="text-sm text-blue-700">
                El sistema envía SMS automáticamente según los horarios configurados (24h, 12h, 2h antes, etc.). 
                No necesitas hacer nada manualmente.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">
                Confirmación de Citas
              </h4>
              <p className="text-sm text-blue-700">
                Los pacientes pueden confirmar su asistencia respondiendo "SI" al mensaje. 
                Las confirmaciones se registran automáticamente en el sistema.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">
                Horarios Inteligentes
              </h4>
              <p className="text-sm text-blue-700">
                Configura horarios de silencio (ej: 10pm - 8am) para no molestar a los pacientes 
                fuera del horario comercial. Los mensajes se ajustan automáticamente.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">
                Costos Transparentes
              </h4>
              <p className="text-sm text-blue-700">
                Elige entre Twilio ($0.0075/SMS), MessageBird ($0.006/SMS) o Vonage ($0.0057/SMS). 
                Calcula tu gasto mensual estimado en la configuración.
              </p>
            </div>
          </div>
        </div>

        {/* Timing Options */}
        <div className="space-y-3">
          <h4 className="font-medium text-blue-900 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horarios de Recordatorio
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                24 horas antes
              </Badge>
              <span className="text-xs text-blue-700">Recordatorio principal</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                12 horas antes
              </Badge>
              <span className="text-xs text-blue-700">Medio día</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                2 horas antes
              </Badge>
              <span className="text-xs text-blue-700">Recordatorio final</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                1 hora antes
              </Badge>
              <span className="text-xs text-blue-700">Última oportunidad</span>
            </div>
          </div>
          <p className="text-xs text-blue-700">
            Puedes activar múltiples recordatorios y configurar horarios personalizados
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h4 className="font-medium text-blue-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Características Principales
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-blue-700">
                <strong>Multi-proveedor:</strong> Twilio, MessageBird, Vonage o modo manual
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-blue-700">
                <strong>Mensajes personalizables:</strong> Incluye nombre del paciente, doctor, fecha, hora, ubicación
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-blue-700">
                <strong>Confirmación bidireccional:</strong> Los pacientes responden "SI" para confirmar
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-blue-700">
                <strong>Horarios de silencio:</strong> No envía SMS durante la noche o fines de semana
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-blue-700">
                <strong>Dashboard completo:</strong> Monitorea enviados, pendientes, fallidos y confirmaciones
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-blue-700">
                <strong>Estadísticas en tiempo real:</strong> Tasa de entrega, confirmaciones, costos estimados
              </span>
            </div>
          </div>
        </div>

        {/* Message Examples */}
        <div className="space-y-3">
          <h4 className="font-medium text-blue-900">Ejemplos de Mensajes</h4>
          <div className="space-y-2">
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-xs text-blue-600 font-medium mb-1">Confirmación de Cita</div>
              <p className="text-sm text-blue-900">
                Hola María, tu cita con Dr. García ha sido confirmada para el Lunes 30 de Octubre a las 10:00. ¡Te esperamos!
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-xs text-blue-600 font-medium mb-1">Recordatorio 24h</div>
              <p className="text-sm text-blue-900">
                Recordatorio: Tienes cita mañana Martes 31 de Octubre a las 15:00 con Dr. García. Responde SI para confirmar.
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-xs text-blue-600 font-medium mb-1">Recordatorio 2h</div>
              <p className="text-sm text-blue-900">
                ⏰ Tu cita con Dr. García es en 2 horas (15:00). Te esperamos en Consultorio 3.
              </p>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">💡 Mejores Prácticas</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Envía recordatorios 24h y 2h antes para mejores resultados</li>
                <li>Mantén los mensajes cortos y claros (menos de 160 caracteres)</li>
                <li>Incluye el nombre del doctor para recordar al paciente quién lo verá</li>
                <li>Solicita confirmación para reducir ausencias hasta un 40%</li>
                <li>Revisa las estadísticas semanalmente para optimizar los horarios</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
