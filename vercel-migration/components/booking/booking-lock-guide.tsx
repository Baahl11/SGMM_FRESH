/**
 * Booking Lock Guide Component
 * 
 * Guía educativa sobre el sistema de prevención de double-booking
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Lock,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Zap,
  RefreshCw,
  Eye,
  Ban
} from 'lucide-react';

export function BookingLockGuide() {
  return (
    <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-purple-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Prevención de Double-Booking</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Sistema inteligente que previene reservas simultáneas del mismo horario
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* ¿Qué es Double-Booking? */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            ¿Qué es Double-Booking?
          </h3>
          <Alert className="bg-white border-amber-200">
            <AlertDescription className="text-sm">
              <strong>Double-booking</strong> ocurre cuando dos o más usuarios intentan reservar
              el mismo slot de tiempo simultáneamente. Sin protección, ambas reservas podrían
              confirmarse, causando conflictos y problemas de agenda.
            </AlertDescription>
          </Alert>
        </div>
        
        {/* Cómo Funciona */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            ¿Cómo Funciona?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                icon: Lock,
                color: 'purple',
                title: '1. Bloqueo Temporal',
                description: 'Cuando empiezas a reservar un slot, se bloquea automáticamente por 60 segundos'
              },
              {
                icon: Users,
                color: 'blue',
                title: '2. Otros Usuarios',
                description: 'Otros usuarios ven el slot como "bloqueado" y no pueden reservarlo simultáneamente'
              },
              {
                icon: CheckCircle2,
                color: 'green',
                title: '3. Confirmación',
                description: 'Al confirmar la reserva, el bloqueo se libera y la cita queda guardada'
              },
              {
                icon: Clock,
                color: 'amber',
                title: '4. Expiración Auto',
                description: 'Si no confirmas en 60s, el bloqueo expira y otros pueden reservar'
              }
            ].map((step, index) => (
              <div key={index} className={`p-4 bg-white rounded-lg border border-${step.color}-200`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 bg-${step.color}-100 rounded-lg flex-shrink-0`}>
                    <step.icon className={`h-4 w-4 text-${step.color}-600`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{step.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Indicadores Visuales */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-600" />
            Indicadores Visuales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-white rounded-lg border-2 border-purple-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm font-semibold">Slot Bloqueado</span>
              </div>
              <p className="text-xs text-gray-600">
                Borde morado indica que el slot está siendo editado por otro usuario
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border-2 border-amber-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
                <span className="text-sm font-semibold">Expirando</span>
              </div>
              <p className="text-xs text-gray-600">
                Parpadeo indica que el bloqueo está a punto de expirar (&lt;15s)
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border-2 border-gray-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-sm font-semibold">Expirado</span>
              </div>
              <p className="text-xs text-gray-600">
                Gris indica que el bloqueo expiró y el slot está disponible nuevamente
              </p>
            </div>
          </div>
        </div>
        
        {/* Características Técnicas */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-600" />
            Características Técnicas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { label: 'Bloqueo automático', icon: Lock },
              { label: 'Expiración temporal', icon: Clock },
              { label: 'Reintentos inteligentes', icon: RefreshCw },
              { label: 'Multi-usuario', icon: Users },
              { label: 'Limpieza auto', icon: RefreshCw },
              { label: 'Override admin', icon: Shield }
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border border-indigo-200">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-xs font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Escenarios Comunes */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Escenarios Comunes
          </h3>
          <div className="space-y-2">
            {[
              {
                scenario: '2 usuarios reservan a la vez',
                solution: 'El primero obtiene el bloqueo, el segundo ve "slot bloqueado"',
                status: 'success'
              },
              {
                scenario: 'Usuario abandona la reserva',
                solution: 'Bloqueo expira en 60s, slot queda disponible automáticamente',
                status: 'info'
              },
              {
                scenario: 'Conflicto con buffer time',
                solution: 'Sistema detecta overlap y muestra mensaje específico',
                status: 'warning'
              },
              {
                scenario: 'Admin necesita override',
                solution: 'Admin puede forzar bloqueo si está habilitado en configuración',
                status: 'admin'
              }
            ].map((item, index) => (
              <Alert key={index} className={
                item.status === 'success' ? 'bg-green-50 border-green-200' :
                item.status === 'info' ? 'bg-blue-50 border-blue-200' :
                item.status === 'warning' ? 'bg-amber-50 border-amber-200' :
                'bg-purple-50 border-purple-200'
              }>
                <AlertDescription className="text-xs">
                  <strong className="text-sm">Escenario:</strong> {item.scenario}
                  <br />
                  <strong className="text-sm">Solución:</strong> {item.solution}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
        
        {/* Mejores Prácticas */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Mejores Prácticas
          </h3>
          <Alert className="bg-white border-green-200">
            <AlertDescription>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Confirma rápido:</strong> Completa reservas en &lt;60s para evitar expiración</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Observa indicadores:</strong> Presta atención a slots con borde morado (bloqueados)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Espera si hay conflicto:</strong> Si ves "slot bloqueado", espera a que expire</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Usa reintentos:</strong> Sistema reintenta automáticamente 3 veces si hay conflicto temporal</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Ajusta duración:</strong> Clínicas grandes pueden necesitar bloqueos de 90s</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Limpieza frecuente:</strong> Mantén intervalo de limpieza en 5-10s para mejor rendimiento</span>
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
        
        {/* Beneficios */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Beneficios
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                icon: Ban,
                title: 'Cero Double-Bookings',
                description: 'Elimina completamente reservas duplicadas del mismo slot',
                color: 'red'
              },
              {
                icon: Users,
                title: 'Multi-Usuario Seguro',
                description: 'Múltiples recepcionistas pueden trabajar sin conflictos',
                color: 'blue'
              },
              {
                icon: Zap,
                title: 'Automático y Rápido',
                description: 'No requiere intervención manual, funciona en segundo plano',
                color: 'yellow'
              },
              {
                icon: Shield,
                title: 'Protección Robusta',
                description: 'Maneja race conditions y conflictos complejos',
                color: 'green'
              }
            ].map((benefit, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className={`p-2 bg-${benefit.color}-100 rounded-lg flex-shrink-0`}>
                    <benefit.icon className={`h-5 w-5 text-${benefit.color}-600`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{benefit.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{benefit.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Compatibilidad */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Compatibilidad</h3>
          <div className="flex flex-wrap gap-2">
            {[
              'Chrome',
              'Firefox',
              'Safari',
              'Edge',
              'Móviles iOS',
              'Móviles Android',
              'Múltiples Pestañas',
              'Supabase Real-time'
            ].map((platform, index) => (
              <Badge key={index} variant="secondary" className="gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {platform}
              </Badge>
            ))}
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
}
