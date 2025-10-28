import { Metadata } from 'next'
import Link from 'next/link'
import { Video, Play, Clock, TrendingUp, BookOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Guías y Tutoriales | AgendaMedPro',
  description: 'Videos tutoriales paso a paso para dominar todas las funciones de AgendaMedPro',
}

export default function GuiasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Video className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Guías y Tutoriales</h1>
          </div>
          <p className="text-xl text-red-100">
            🎬 Aprende visualmente con nuestros tutoriales en video paso a paso
          </p>
          <p className="text-sm text-red-200 mt-2">
            Más de 50 videos • Duración total: 4 horas • Actualizados constantemente
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Video className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-red-600 mb-2">52</div>
            <p className="text-sm text-gray-600">Videos disponibles</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Clock className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-red-600 mb-2">4.2h</div>
            <p className="text-sm text-gray-600">Duración total</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <TrendingUp className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-red-600 mb-2">8.5K</div>
            <p className="text-sm text-gray-600">Visualizaciones</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <BookOpen className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-red-600 mb-2">8</div>
            <p className="text-sm text-gray-600">Categorías</p>
          </div>
        </div>

        <div className="space-y-12">
          
          {/* Serie: Primeros Pasos */}
          <section className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">🚀 Serie: Primeros Pasos</h2>
                <p className="text-sm text-gray-600 mt-1">4 videos • 18 minutos • Ideal para nuevos usuarios</p>
              </div>
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                Recomendado
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="group cursor-pointer">
                <div className="relative aspect-video bg-gradient-to-br from-red-100 to-rose-100 rounded-xl mb-3 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-600 hover:bg-red-700 transition-colors rounded-full p-4">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs">
                    2:45
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                  1. Crear tu cuenta y verificar cédula
                </h3>
                <p className="text-sm text-gray-600 mt-1">Registro paso a paso y verificación de identidad profesional</p>
              </div>

              <div className="group cursor-pointer">
                <div className="relative aspect-video bg-gradient-to-br from-red-100 to-rose-100 rounded-xl mb-3 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-600 hover:bg-red-700 transition-colors rounded-full p-4">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs">
                    4:20
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                  2. Configurar tu consultorio
                </h3>
                <p className="text-sm text-gray-600 mt-1">Horarios, tipos de cita, tarifas y preferencias</p>
              </div>

              <div className="group cursor-pointer">
                <div className="relative aspect-video bg-gradient-to-br from-red-100 to-rose-100 rounded-xl mb-3 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-600 hover:bg-red-700 transition-colors rounded-full p-4">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs">
                    3:10
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                  3. Tu primera cita agendada
                </h3>
                <p className="text-sm text-gray-600 mt-1">Crear paciente y agendar cita en el calendario</p>
              </div>

              <div className="group cursor-pointer">
                <div className="relative aspect-video bg-gradient-to-br from-red-100 to-rose-100 rounded-xl mb-3 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-600 hover:bg-red-700 transition-colors rounded-full p-4">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs">
                    7:50
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                  4. Tour completo del dashboard
                </h3>
                <p className="text-sm text-gray-600 mt-1">Recorrido por todas las secciones principales</p>
              </div>
            </div>
          </section>

          {/* Calendario y Citas */}
          <section className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">📅 Calendario y Gestión de Citas</h2>
                <p className="text-sm text-gray-600 mt-1">8 videos • 35 minutos</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Agendar cita manualmente", duration: "3:15", views: "1.2K" },
                { title: "Modificar y cancelar citas", duration: "2:45", views: "980" },
                { title: "Citas recurrentes", duration: "4:30", views: "750" },
                { title: "Configurar recordatorios automáticos", duration: "5:20", views: "1.5K" },
                { title: "Lista de espera y reprogramación", duration: "3:50", views: "620" },
                { title: "Bloquear días y horarios", duration: "2:30", views: "890" },
                { title: "Vistas del calendario (día/semana/mes)", duration: "3:05", views: "1.1K" },
                { title: "Exportar calendario a Google/Outlook", duration: "4:45", views: "540" },
              ].map((video, idx) => (
                <div key={idx} className="group cursor-pointer">
                  <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl mb-3 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-full p-3">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                      {video.duration}
                    </div>
                    <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {video.views}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                    {video.title}
                  </h3>
                </div>
              ))}
            </div>
          </section>

          {/* Expediente Clínico */}
          <section className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">📋 Expediente Clínico NOM-004</h2>
                <p className="text-sm text-gray-600 mt-1">10 videos • 48 minutos</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Crear nota de consulta NOM-004", duration: "6:20", views: "2.1K", popular: true },
                { title: "Historia clínica completa", duration: "5:45", views: "1.8K" },
                { title: "Generar receta médica", duration: "3:30", views: "2.5K", popular: true },
                { title: "Adjuntar estudios (rayos X, análisis)", duration: "4:10", views: "920" },
                { title: "Plantillas personalizadas por especialidad", duration: "7:15", views: "1.3K" },
                { title: "Consentimientos informados", duration: "5:00", views: "1.1K" },
                { title: "Signos vitales y exploración física", duration: "4:40", views: "980" },
                { title: "Diagnósticos CIE-10", duration: "3:55", views: "850" },
                { title: "Exportar expediente PDF", duration: "2:45", views: "1.6K" },
                { title: "Firma electrónica avanzada", duration: "5:30", views: "740" },
              ].map((video, idx) => (
                <div key={idx} className="group cursor-pointer">
                  <div className="relative aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl mb-3 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-purple-600 hover:bg-purple-700 transition-colors rounded-full p-3">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                    {video.popular && (
                      <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded text-xs font-bold">
                        ⭐ Popular
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                      {video.duration}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors text-sm">
                    {video.title}
                  </h3>
                </div>
              ))}
            </div>
          </section>

          {/* Facturación */}
          <section className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">🧾 Facturación CFDI 4.0</h2>
                <p className="text-sm text-gray-600 mt-1">7 videos • 42 minutos</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Configurar RFC y certificados SAT", duration: "8:45", views: "1.9K", important: true },
                { title: "Generar factura CFDI 4.0", duration: "6:30", views: "2.3K", important: true },
                { title: "Cancelar facturas en el SAT", duration: "5:15", views: "1.2K" },
                { title: "Notas de crédito", duration: "4:50", views: "890" },
                { title: "Reportes fiscales mensuales", duration: "7:20", views: "1.5K" },
                { title: "Integración con contabilidad", duration: "5:40", views: "720" },
                { title: "Complementos de pago", duration: "4:30", views: "650" },
              ].map((video, idx) => (
                <div key={idx} className="group cursor-pointer">
                  <div className="relative aspect-video bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl mb-3 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-full p-3">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                    {video.important && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        ⚠️ Importante
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                      {video.duration}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm">
                    {video.title}
                  </h3>
                </div>
              ))}
            </div>
          </section>

          {/* Gestión de Pacientes */}
          <section className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">👥 Gestión de Pacientes</h2>
                <p className="text-sm text-gray-600 mt-1">6 videos • 28 minutos</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Registrar nuevo paciente", duration: "3:45", views: "1.7K" },
                { title: "Historial clínico completo", duration: "5:20", views: "1.4K" },
                { title: "Búsqueda y filtros avanzados", duration: "4:15", views: "980" },
                { title: "Importar pacientes desde Excel", duration: "6:30", views: "1.1K" },
                { title: "Etiquetas y categorías", duration: "3:50", views: "720" },
                { title: "Exportar datos de pacientes", duration: "4:35", views: "890" },
              ].map((video, idx) => (
                <div key={idx} className="group cursor-pointer">
                  <div className="relative aspect-video bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl mb-3 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-green-600 hover:bg-green-700 transition-colors rounded-full p-3">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                      {video.duration}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors text-sm">
                    {video.title}
                  </h3>
                </div>
              ))}
            </div>
          </section>

          {/* Control de Inventario */}
          <section className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">📦 Control de Inventario</h2>
                <p className="text-sm text-gray-600 mt-1">5 videos • 22 minutos</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Agregar productos al inventario", duration: "4:20", views: "1.3K" },
                { title: "Entradas y salidas de stock", duration: "5:15", views: "990" },
                { title: "Alertas de stock bajo", duration: "3:30", views: "850" },
                { title: "Control de vencimientos", duration: "4:50", views: "760" },
                { title: "Reportes de consumo", duration: "4:25", views: "680" },
              ].map((video, idx) => (
                <div key={idx} className="group cursor-pointer">
                  <div className="relative aspect-video bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl mb-3 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-amber-600 hover:bg-amber-700 transition-colors rounded-full p-3">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                      {video.duration}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors text-sm">
                    {video.title}
                  </h3>
                </div>
              ))}
            </div>
          </section>

          {/* Reportes y Análisis */}
          <section className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">📊 Reportes y Análisis</h2>
                <p className="text-sm text-gray-600 mt-1">6 videos • 31 minutos</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Dashboard de métricas", duration: "5:45", views: "1.5K" },
                { title: "Reporte de ingresos", duration: "4:50", views: "1.8K" },
                { title: "Análisis de citas", duration: "5:20", views: "1.2K" },
                { title: "Diagnósticos más frecuentes", duration: "4:15", views: "890" },
                { title: "Exportar reportes a Excel", duration: "3:40", views: "1.1K" },
                { title: "Gráficas personalizadas", duration: "7:25", views: "670" },
              ].map((video, idx) => (
                <div key={idx} className="group cursor-pointer">
                  <div className="relative aspect-video bg-gradient-to-br from-cyan-100 to-teal-100 rounded-xl mb-3 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-cyan-600 hover:bg-cyan-700 transition-colors rounded-full p-3">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                      {video.duration}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-cyan-600 transition-colors text-sm">
                    {video.title}
                  </h3>
                </div>
              ))}
            </div>
          </section>

          {/* Configuración Avanzada */}
          <section className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">⚙️ Configuración Avanzada</h2>
                <p className="text-sm text-gray-600 mt-1">6 videos • 34 minutos</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Usuarios adicionales y permisos", duration: "6:20", views: "920" },
                { title: "Autenticación de dos factores (2FA)", duration: "4:45", views: "1.1K" },
                { title: "Backup y exportación completa", duration: "7:15", views: "850" },
                { title: "Integraciones con terceros", duration: "5:50", views: "680" },
                { title: "Personalizar notificaciones", duration: "4:30", views: "790" },
                { title: "API para desarrolladores", duration: "5:45", views: "420" },
              ].map((video, idx) => (
                <div key={idx} className="group cursor-pointer">
                  <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-slate-200 rounded-xl mb-3 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gray-600 hover:bg-gray-700 transition-colors rounded-full p-3">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                      {video.duration}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-gray-600 transition-colors text-sm">
                    {video.title}
                  </h3>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white p-12 rounded-2xl text-center">
            <Video className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">¿Necesitas ayuda con algo específico?</h2>
            <p className="text-lg mb-8">
              Si no encuentras el tutorial que buscas, contáctanos y crearemos uno personalizado
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://wa.me/528112345678?text=Me%20gustaría%20un%20tutorial%20sobre..."
                target="_blank"
                rel="noopener"
                className="inline-block bg-white text-red-600 px-8 py-4 rounded-lg font-semibold hover:bg-red-50 transition-colors"
              >
                Solicitar Tutorial
              </a>
              <Link 
                href="/documentacion"
                className="inline-block bg-red-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-red-800 transition-colors border-2 border-white"
              >
                Ver Documentación Escrita
              </Link>
            </div>
          </div>

        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
