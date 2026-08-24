"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, CheckCircle2, Bell, DollarSign, AlertCircle } from 'lucide-react';

export function SmsRemindersGuide() {
  return (
    <Card className="border-white/20 bg-white/[0.04] text-white shadow-[0_25px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <MessageSquare className="h-5 w-5" />
          Recordatorios Automáticos por SMS
        </CardTitle>
        <CardDescription className="text-white/70">
          Reduce las ausencias enviando recordatorios de citas por mensaje de texto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* How it works */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-cyan-500/15 p-2">
              <Bell className="h-5 w-5 text-cyan-200" />
            </div>
            <div className="flex-1">
              <h4 className="mb-1 font-medium text-white">
                Recordatorios Automáticos
              </h4>
              <p className="text-sm text-white/75">
                El sistema envía SMS automáticamente según los horarios configurados (24h, 12h, 2h antes, etc.). 
                No necesitas hacer nada manualmente.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-500/15 p-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-200" />
            </div>
            <div className="flex-1">
              <h4 className="mb-1 font-medium text-white">
                Confirmación de Citas
              </h4>
              <p className="text-sm text-white/75">
                Los pacientes pueden confirmar su asistencia respondiendo "SI" al mensaje. 
                Las confirmaciones se registran automáticamente en el sistema.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-violet-500/15 p-2">
              <Clock className="h-5 w-5 text-violet-200" />
            </div>
            <div className="flex-1">
              <h4 className="mb-1 font-medium text-white">
                Horarios Inteligentes
              </h4>
              <p className="text-sm text-white/75">
                Configura horarios de silencio (ej: 10pm - 8am) para no molestar a los pacientes 
                fuera del horario comercial. Los mensajes se ajustan automáticamente.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-500/15 p-2">
              <DollarSign className="h-5 w-5 text-amber-200" />
            </div>
            <div className="flex-1">
              <h4 className="mb-1 font-medium text-white">
                Costos Transparentes
              </h4>
              <p className="text-sm text-white/75">
                Elige entre Twilio ($0.0075/SMS), MessageBird ($0.006/SMS) o Vonage ($0.0057/SMS). 
                Calcula tu gasto mensual estimado en la configuración.
              </p>
            </div>
          </div>
        </div>

        {/* Timing Options */}
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 font-medium text-white">
            <Clock className="h-4 w-4" />
            Horarios de Recordatorio
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-cyan-300/30 bg-cyan-500/15 text-cyan-100">
                24 horas antes
              </Badge>
              <span className="text-xs text-white/70">Recordatorio principal</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-cyan-300/30 bg-cyan-500/15 text-cyan-100">
                12 horas antes
              </Badge>
              <span className="text-xs text-white/70">Medio día</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-cyan-300/30 bg-cyan-500/15 text-cyan-100">
                2 horas antes
              </Badge>
              <span className="text-xs text-white/70">Recordatorio final</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-cyan-300/30 bg-cyan-500/15 text-cyan-100">
                1 hora antes
              </Badge>
              <span className="text-xs text-white/70">Última oportunidad</span>
            </div>
          </div>
          <p className="text-xs text-white/70">
            Puedes activar múltiples recordatorios y configurar horarios personalizados
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 font-medium text-white">
            <CheckCircle2 className="h-4 w-4" />
            Características Principales
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-200" />
              <span className="text-white/75">
                <strong>Multi-proveedor:</strong> Twilio, MessageBird, Vonage o modo manual
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-200" />
              <span className="text-white/75">
                <strong>Mensajes personalizables:</strong> Incluye nombre del paciente, doctor, fecha, hora, ubicación
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-200" />
              <span className="text-white/75">
                <strong>Confirmación bidireccional:</strong> Los pacientes responden "SI" para confirmar
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-200" />
              <span className="text-white/75">
                <strong>Horarios de silencio:</strong> No envía SMS durante la noche o fines de semana
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-200" />
              <span className="text-white/75">
                <strong>Dashboard completo:</strong> Monitorea enviados, pendientes, fallidos y confirmaciones
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-200" />
              <span className="text-white/75">
                <strong>Estadísticas en tiempo real:</strong> Tasa de entrega, confirmaciones, costos estimados
              </span>
            </div>
          </div>
        </div>

        {/* Message Examples */}
        <div className="space-y-3">
          <h4 className="font-medium text-white">Ejemplos de Mensajes</h4>
          <div className="space-y-2">
            <div className="rounded-lg border border-white/15 bg-white/5 p-3">
              <div className="mb-1 text-xs font-medium text-cyan-200">Confirmación de Cita</div>
              <p className="text-sm text-white/85">
                Hola María, tu cita con Dr. García ha sido confirmada para el Lunes 30 de Octubre a las 10:00. ¡Te esperamos!
              </p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/5 p-3">
              <div className="mb-1 text-xs font-medium text-cyan-200">Recordatorio 24h</div>
              <p className="text-sm text-white/85">
                Recordatorio: Tienes cita mañana Martes 31 de Octubre a las 15:00 con Dr. García. Responde SI para confirmar.
              </p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/5 p-3">
              <div className="mb-1 text-xs font-medium text-cyan-200">Recordatorio 2h</div>
              <p className="text-sm text-white/85">
                ⏰ Tu cita con Dr. García es en 2 horas (15:00). Te esperamos en Consultorio 3.
              </p>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="rounded-lg border border-cyan-300/30 bg-cyan-500/12 p-4">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-cyan-200" />
            <div className="text-sm text-white/85">
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
