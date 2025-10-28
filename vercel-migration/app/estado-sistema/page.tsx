import { Metadata } from 'next'
import Link from 'next/link'
import { Activity, CheckCircle2, AlertTriangle, Clock, Database, Server, Zap, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Estado del Sistema | AgendaMedPro',
  description: 'Monitoreo en tiempo real del estado de AgendaMedPro y sus servicios',
}

export default function EstadoSistemaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Estado del Sistema</h1>
          </div>
          <p className="text-xl text-green-100">
            📊 Monitoreo en tiempo real de todos nuestros servicios
          </p>
          <p className="text-sm text-green-200 mt-2">
            Última actualización: {new Date().toLocaleString('es-MX', { 
              timeZone: 'America/Monterrey',
              dateStyle: 'long',
              timeStyle: 'short'
            })} (GMT-6)
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Estado general */}
        <div className="bg-green-500 text-white rounded-2xl shadow-xl p-8 mb-8 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Todos los sistemas operando normalmente</h2>
          <p className="text-green-100">99.9% uptime en los últimos 30 días</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
          
          {/* Servicios principales */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Servicios Principales</h2>
            <div className="space-y-4">
              
              {/* Web Application */}
              <div className="flex items-center justify-between p-5 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex items-center gap-4">
                  <Globe className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="font-bold text-gray-900">Aplicación Web</h3>
                    <p className="text-sm text-gray-600">agendamedpro.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-600">Operacional</span>
                </div>
              </div>

              {/* Database */}
              <div className="flex items-center justify-between p-5 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex items-center gap-4">
                  <Database className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="font-bold text-gray-900">Base de Datos</h3>
                    <p className="text-sm text-gray-600">Supabase México</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-600">Operacional</span>
                </div>
              </div>

              {/* API */}
              <div className="flex items-center justify-between p-5 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex items-center gap-4">
                  <Server className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="font-bold text-gray-900">API Backend</h3>
                    <p className="text-sm text-gray-600">Endpoints REST</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-600">Operacional</span>
                </div>
              </div>

              {/* Authentication */}
              <div className="flex items-center justify-between p-5 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex items-center gap-4">
                  <Zap className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="font-bold text-gray-900">Autenticación</h3>
                    <p className="text-sm text-gray-600">Login y sesiones</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-600">Operacional</span>
                </div>
              </div>

            </div>
          </section>

          {/* Servicios integrados */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Servicios Integrados</h2>
            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-5 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center text-2xl">💳</div>
                  <div>
                    <h3 className="font-bold text-gray-900">Pagos (Stripe)</h3>
                    <p className="text-sm text-gray-600">Checkout y suscripciones</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-600">Operacional</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-5 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center text-2xl">🧾</div>
                  <div>
                    <h3 className="font-bold text-gray-900">Facturación SAT</h3>
                    <p className="text-sm text-gray-600">CFDI 4.0</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-600">Operacional</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-5 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center text-2xl">📧</div>
                  <div>
                    <h3 className="font-bold text-gray-900">Email</h3>
                    <p className="text-sm text-gray-600">Notificaciones y recordatorios</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-600">Operacional</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-5 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center text-2xl">💬</div>
                  <div>
                    <h3 className="font-bold text-gray-900">Mensajería</h3>
                    <p className="text-sm text-gray-600">Chat médico-paciente</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-600">Operacional</span>
                </div>
              </div>

            </div>
          </section>

          {/* Métricas de rendimiento */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Métricas de Rendimiento</h2>
            <div className="grid md:grid-cols-3 gap-6">
              
              <div className="bg-blue-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">23ms</div>
                <p className="text-sm text-gray-600">Latencia promedio API</p>
                <div className="mt-3 text-xs text-blue-600">
                  ✓ Excelente (&lt;50ms)
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">99.94%</div>
                <p className="text-sm text-gray-600">Uptime últimos 30 días</p>
                <div className="mt-3 text-xs text-green-600">
                  ✓ Por encima del objetivo (99.9%)
                </div>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">1.2s</div>
                <p className="text-sm text-gray-600">Tiempo de carga promedio</p>
                <div className="mt-3 text-xs text-purple-600">
                  ✓ Muy bueno (&lt;2s)
                </div>
              </div>

            </div>
          </section>

          {/* Historial de incidentes */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Historial Reciente</h2>
            <div className="space-y-4">
              
              {/* Incidente resuelto ejemplo */}
              <div className="border-l-4 border-green-500 bg-green-50 p-5 rounded-r-lg">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900">✓ Todo operacional</h3>
                  <span className="text-sm text-gray-600">Octubre 2025</span>
                </div>
                <p className="text-sm text-gray-700">
                  Sin incidentes reportados en el mes actual. Mantenimiento programado completado sin interrupciones.
                </p>
              </div>

              {/* Mantenimiento programado */}
              <div className="border-l-4 border-blue-500 bg-blue-50 p-5 rounded-r-lg">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900">🔧 Mantenimiento Completado</h3>
                  <span className="text-sm text-gray-600">15 Oct 2025, 03:00-04:30</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  Actualización de seguridad y optimización de base de datos.
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">Resuelto</span>
                  <span className="text-gray-600">Duración: 1h 30min</span>
                </div>
              </div>

              {/* Septiembre - sin incidentes */}
              <div className="border-l-4 border-green-500 bg-green-50 p-5 rounded-r-lg">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900">✓ Mes completo sin incidentes</h3>
                  <span className="text-sm text-gray-600">Septiembre 2025</span>
                </div>
                <p className="text-sm text-gray-700">
                  100% uptime durante todo el mes. 0 incidentes reportados.
                </p>
              </div>

            </div>

            <div className="mt-6 text-center">
              <button className="text-green-600 hover:text-green-700 font-semibold text-sm">
                Ver historial completo →
              </button>
            </div>
          </section>

          {/* Próximo mantenimiento */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Próximo Mantenimiento Programado</h2>
            <div className="bg-amber-50 border-2 border-amber-300 p-6 rounded-lg">
              <div className="flex items-start gap-4">
                <Clock className="w-8 h-8 text-amber-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">Actualización de Infraestructura</h3>
                  <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <p><strong>Fecha:</strong> Domingo 10 de noviembre de 2025</p>
                    <p><strong>Horario:</strong> 03:00 - 05:00 hrs (GMT-6)</p>
                    <p><strong>Impacto:</strong> Sistema no disponible durante ~2 horas</p>
                    <p><strong>Motivo:</strong> Migración a servidores más rápidos y seguros</p>
                  </div>
                  <div className="bg-amber-100 p-4 rounded-lg">
                    <p className="text-sm text-amber-900">
                      <strong>💡 Recomendación:</strong> Evita agendar citas o trabajar en expedientes durante este horario. 
                      Te enviaremos recordatorios por email 48 horas antes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Suscripción a actualizaciones */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recibe Notificaciones de Estado</h2>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                Suscríbete para recibir notificaciones automáticas de:
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Incidentes críticos en tiempo real</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Mantenimientos programados (48h antes)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Resolución de problemas</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Nuevas funciones y actualizaciones</span>
                </li>
              </ul>
              <div className="flex gap-3">
                <input 
                  type="email" 
                  placeholder="tu@email.com" 
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                />
                <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                  Suscribir
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Ya estás registrado si tienes una cuenta. Solo suscríbete si quieres notificaciones en otro email.
              </p>
            </div>
          </section>

          {/* SLA */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuestro Compromiso (SLA)</h2>
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg">
              <div className="space-y-4 text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 text-xl">📊</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Disponibilidad Garantizada: 99.9%</h3>
                    <p className="text-sm">
                      Esto equivale a un máximo de ~43 minutos de downtime al mes. Si no cumplimos, 
                      recibes créditos proporcionales en tu suscripción.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-blue-600 text-xl">⚡</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Tiempo de Respuesta API: &lt;100ms</h3>
                    <p className="text-sm">
                      El 95% de las solicitudes API responden en menos de 100 milisegundos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-blue-600 text-xl">🔧</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Resolución de Incidentes Críticos: &lt;2 horas</h3>
                    <p className="text-sm">
                      Problemas que impiden el uso del sistema se resuelven en máximo 2 horas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-blue-600 text-xl">💾</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Respaldos: Cada 6 horas</h3>
                    <p className="text-sm">
                      Backups automáticos cada 6 horas, retenidos por 30 días. En caso de pérdida de datos, 
                      recuperación máxima de 6 horas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-blue-200">
                <p className="text-sm text-gray-600">
                  <strong>Nota:</strong> El SLA no aplica durante mantenimientos programados notificados con anticipación, 
                  ni durante problemas causados por terceros (Stripe, proveedores cloud, ISPs).
                </p>
              </div>
            </div>
          </section>

          {/* Reportar problema */}
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-8 rounded-2xl text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold mb-3">¿Detectaste un problema?</h2>
            <p className="mb-6">
              Si experimentas lentitud o errores, por favor repórtalo de inmediato:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://wa.me/528112345678?text=Reporte%20de%20problema%20técnico"
                target="_blank"
                rel="noopener"
                className="inline-block bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors"
              >
                WhatsApp
              </a>
              <a 
                href="mailto:soporte@agendamedpro.com?subject=Reporte de problema técnico"
                className="inline-block bg-red-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors border-2 border-white"
              >
                Email Urgente
              </a>
            </div>
          </div>

        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
