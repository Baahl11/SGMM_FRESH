import { Metadata } from 'next'
import Link from 'next/link'
import { Book, Search, Calendar, Users, FileText, Package, CreditCard, Settings, HelpCircle, ListOrdered } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Documentación | Centro de Ayuda AgendaMedPro',
  description: 'Guías completas, tutoriales y documentación para aprovechar al máximo AgendaMedPro',
}

export default function DocumentacionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Book className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Centro de Ayuda</h1>
          </div>
          <p className="text-xl text-purple-100 mb-6">
            📚 Encuentra respuestas, aprende nuevas funciones y domina AgendaMedPro
          </p>
          
          {/* Search bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="search"
                placeholder="Buscar en la documentación... (ej: 'cómo facturar', 'agendar cita')"
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Quick links */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <Link href="#primeros-pasos" className="bg-white hover:bg-purple-50 p-6 rounded-xl shadow-lg text-center transition-colors border-2 border-transparent hover:border-purple-300">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="font-bold text-gray-900">Primeros Pasos</h3>
          </Link>

          <Link href="#tutoriales-detallados" className="bg-white hover:bg-purple-50 p-6 rounded-xl shadow-lg text-center transition-colors border-2 border-transparent hover:border-purple-300">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ListOrdered className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900">Tutoriales Paso a Paso</h3>
          </Link>

          <Link href="#preguntas-frecuentes" className="bg-white hover:bg-purple-50 p-6 rounded-xl shadow-lg text-center transition-colors border-2 border-transparent hover:border-purple-300">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900">FAQs</h3>
          </Link>

          <Link href="/soporte" className="bg-white hover:bg-purple-50 p-6 rounded-xl shadow-lg text-center transition-colors border-2 border-transparent hover:border-purple-300">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="font-bold text-gray-900">Contactar Soporte</h3>
          </Link>
        </div>

        <div className="space-y-12">
          
          {/* Primeros Pasos */}
          <section id="primeros-pasos" className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🚀</span>
              <h2 className="text-3xl font-bold text-gray-900">Primeros Pasos</h2>
            </div>
            <p className="text-gray-700 mb-8">
              Guías rápidas para empezar a usar AgendaMedPro en menos de 10 minutos.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 p-3 rounded-lg">
                    <span className="text-2xl">1️⃣</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">Crear tu cuenta</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Regístrate con email, verifica tu cédula profesional y completa tu perfil médico.
                    </p>
                    <span className="text-xs text-blue-600 font-semibold">⏱️ 3 minutos</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="bg-green-500 p-3 rounded-lg">
                    <span className="text-2xl">2️⃣</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">Configurar tu consultorio</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Define horarios de atención, duraciones de cita, especialidades y tarifas.
                    </p>
                    <span className="text-xs text-green-600 font-semibold">⏱️ 5 minutos</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-500 p-3 rounded-lg">
                    <span className="text-2xl">3️⃣</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">Agendar tu primera cita</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Crea un paciente, agenda su cita en el calendario y envía confirmación automática.
                    </p>
                    <span className="text-xs text-purple-600 font-semibold">⏱️ 2 minutos</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-500 p-3 rounded-lg">
                    <span className="text-2xl">4️⃣</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">Generar tu primera factura</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Configura RFC, certificados SAT y emite CFDI 4.0 compliant directamente desde la plataforma.
                    </p>
                    <span className="text-xs text-amber-600 font-semibold">⏱️ 7 minutos</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Guías por Módulo */}
          <section className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Guías por Módulo</h2>

            <div className="space-y-8">
              
              {/* Calendario y Citas */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-8 h-8 text-blue-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Calendario y Citas</h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 ml-11">
                  <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Crear cita</h4>
                    <p className="text-xs text-gray-600">Agendar nueva cita manualmente</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Modificar/Cancelar cita</h4>
                    <p className="text-xs text-gray-600">Cambiar horario o cancelar</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Recordatorios automáticos</h4>
                    <p className="text-xs text-gray-600">Configurar notificaciones por email</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Citas recurrentes</h4>
                    <p className="text-xs text-gray-600">Agendar series de citas</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Lista de espera</h4>
                    <p className="text-xs text-gray-600">Gestionar pacientes en espera</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Bloquear horarios</h4>
                    <p className="text-xs text-gray-600">Vacaciones y días festivos</p>
                  </div>
                </div>
              </div>

              {/* Pacientes */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Gestión de Pacientes</h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 ml-11">
                  <div className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Registrar paciente</h4>
                    <p className="text-xs text-gray-600">Crear ficha de nuevo paciente</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Historial clínico</h4>
                    <p className="text-xs text-gray-600">Ver todas las consultas previas</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Búsqueda avanzada</h4>
                    <p className="text-xs text-gray-600">Filtrar por nombre, edad, diagnóstico</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Exportar datos</h4>
                    <p className="text-xs text-gray-600">Descargar información en CSV/PDF</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Etiquetas y categorías</h4>
                    <p className="text-xs text-gray-600">Organizar pacientes por grupos</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Fusionar duplicados</h4>
                    <p className="text-xs text-gray-600">Unir fichas repetidas</p>
                  </div>
                </div>
              </div>

              {/* Expediente Clínico */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-8 h-8 text-purple-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Expediente Clínico (NOM-004)</h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 ml-11">
                  <div className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Nota de consulta</h4>
                    <p className="text-xs text-gray-600">Formato NOM-004 completo</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Recetas médicas</h4>
                    <p className="text-xs text-gray-600">Generar receta con firma digital</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Adjuntar estudios</h4>
                    <p className="text-xs text-gray-600">Subir radiografías, análisis, etc</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Plantillas personalizadas</h4>
                    <p className="text-xs text-gray-600">Crear formatos por especialidad</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Consentimientos informados</h4>
                    <p className="text-xs text-gray-600">Documentos legales firmados</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Exportar expediente</h4>
                    <p className="text-xs text-gray-600">PDF completo para el paciente</p>
                  </div>
                </div>
              </div>

              {/* Inventario */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Package className="w-8 h-8 text-amber-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Control de Inventario</h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 ml-11">
                  <div className="bg-amber-50 p-4 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Agregar productos</h4>
                    <p className="text-xs text-gray-600">Medicamentos e insumos médicos</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Control de stock</h4>
                    <p className="text-xs text-gray-600">Entradas y salidas</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Alertas de stock bajo</h4>
                    <p className="text-xs text-gray-600">Notificaciones automáticas</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Vencimientos</h4>
                    <p className="text-xs text-gray-600">Control de fechas de caducidad</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Reportes de consumo</h4>
                    <p className="text-xs text-gray-600">Análisis de uso mensual</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Proveedores</h4>
                    <p className="text-xs text-gray-600">Gestión de compras</p>
                  </div>
                </div>
              </div>

              {/* Facturación */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-8 h-8 text-indigo-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Facturación CFDI 4.0</h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 ml-11">
                  <div className="bg-indigo-50 p-4 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Configurar SAT</h4>
                    <p className="text-xs text-gray-600">RFC y certificados .cer/.key</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Generar factura</h4>
                    <p className="text-xs text-gray-600">CFDI 4.0 timbrado automático</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Cancelar factura</h4>
                    <p className="text-xs text-gray-600">Proceso de cancelación SAT</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Envío por email</h4>
                    <p className="text-xs text-gray-600">XML y PDF automático</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Reportes fiscales</h4>
                    <p className="text-xs text-gray-600">Para declaración mensual</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Nota de crédito</h4>
                    <p className="text-xs text-gray-600">Devoluciones y ajustes</p>
                  </div>
                </div>
              </div>

              {/* Configuración */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Settings className="w-8 h-8 text-gray-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Configuración y Personalización</h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 ml-11">
                  <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Perfil médico</h4>
                    <p className="text-xs text-gray-600">Cédula, especialidades, foto</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Horarios de atención</h4>
                    <p className="text-xs text-gray-600">Configurar disponibilidad</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Tipos de cita</h4>
                    <p className="text-xs text-gray-600">Duración y precios personalizados</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Usuarios adicionales</h4>
                    <p className="text-xs text-gray-600">Secretarias y asistentes</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Seguridad (2FA)</h4>
                    <p className="text-xs text-gray-600">Autenticación de dos factores</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-1">Exportar todo</h4>
                    <p className="text-xs text-gray-600">Backup completo de datos</p>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Tutoriales Detallados Paso a Paso */}
          <section id="tutoriales-detallados" className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <ListOrdered className="w-8 h-8 text-blue-600" />
              <h2 className="text-3xl font-bold text-gray-900">Tutoriales Paso a Paso</h2>
            </div>
            <p className="text-gray-700 mb-8">
              Guías detalladas con instrucciones precisas para dominar cada función de AgendaMedPro.
            </p>

            <div className="space-y-6">
              {/* Tutorial 1: Agendar Cita */}
              <details className="bg-white p-6 rounded-xl shadow-lg">
                <summary className="font-bold text-lg text-gray-900 cursor-pointer list-none flex items-center justify-between hover:text-blue-600">
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    Cómo agendar una cita (paso a paso)
                  </span>
                  <span className="text-blue-600 text-2xl">+</span>
                </summary>
                <div className="mt-4 pl-11 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 1</span>
                    <p className="text-sm text-gray-700">En el menú lateral, haz clic en <strong>"Agenda"</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 2</span>
                    <p className="text-sm text-gray-700">Clic en el día/hora deseada, o botón <strong>"+ Nueva Cita"</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 3</span>
                    <p className="text-sm text-gray-700">Selecciona paciente existente o crea uno nuevo con nombre, teléfono y email</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 4</span>
                    <p className="text-sm text-gray-700">Elige tipo de cita (primera vez / seguimiento), doctor y consultorio</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 5</span>
                    <p className="text-sm text-gray-700">Define fecha/hora. El sistema detecta automáticamente conflictos</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 6</span>
                    <p className="text-sm text-gray-700">Activa <strong>"Enviar recordatorio por WhatsApp"</strong> para confirmación automática 24h antes</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 7</span>
                    <p className="text-sm text-gray-700">Clic en <strong>"Guardar"</strong> - ¡Listo! La cita aparecerá en tu calendario</p>
                  </div>
                </div>
              </details>

              {/* Tutorial 2: Control de Inventario */}
              <details className="bg-white p-6 rounded-xl shadow-lg">
                <summary className="font-bold text-lg text-gray-900 cursor-pointer list-none flex items-center justify-between hover:text-blue-600">
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">📦</span>
                    Configurar inventario automático
                  </span>
                  <span className="text-blue-600 text-2xl">+</span>
                </summary>
                <div className="mt-4 pl-11 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 1</span>
                    <p className="text-sm text-gray-700">Menú lateral → <strong>"Inventario"</strong> → botón <strong>"+ Agregar Producto"</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 2</span>
                    <p className="text-sm text-gray-700">Llena: nombre, categoría (medicamento/insumo/equipo), cantidad inicial, precio</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 3</span>
                    <p className="text-sm text-gray-700">Configura <strong>"Stock mínimo"</strong> para recibir alertas automáticas cuando baje</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 4</span>
                    <p className="text-sm text-gray-700">En cada consulta, al registrar tratamiento, selecciona productos usados</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 5</span>
                    <p className="text-sm text-gray-700">El sistema descuenta automáticamente del inventario y registra el movimiento</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 6</span>
                    <p className="text-sm text-gray-700">Recibe alerta por WhatsApp cuando un producto llegue al stock mínimo</p>
                  </div>
                </div>
              </details>

              {/* Tutorial 3: Facturación CFDI */}
              <details className="bg-white p-6 rounded-xl shadow-lg">
                <summary className="font-bold text-lg text-gray-900 cursor-pointer list-none flex items-center justify-between hover:text-blue-600">
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">🧾</span>
                    Generar factura CFDI 4.0
                  </span>
                  <span className="text-blue-600 text-2xl">+</span>
                </summary>
                <div className="mt-4 pl-11 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 1</span>
                    <p className="text-sm text-gray-700">Configura una vez: <strong>Configuración</strong> → <strong>Facturación</strong> → sube certificados SAT (.cer y .key)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 2</span>
                    <p className="text-sm text-gray-700">Registra RFC, razón social, código postal y régimen fiscal</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 3</span>
                    <p className="text-sm text-gray-700">En cita completada, clic en <strong>"Facturar"</strong> (o desde Caja/Pagos)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 4</span>
                    <p className="text-sm text-gray-700">Ingresa RFC del paciente (o usa público en general: XAXX010101000)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 5</span>
                    <p className="text-sm text-gray-700">Selecciona forma de pago, método de pago y uso de CFDI</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 6</span>
                    <p className="text-sm text-gray-700">Clic en <strong>"Timbrar"</strong> - Se genera XML + PDF válidos para SAT</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 7</span>
                    <p className="text-sm text-gray-700">Envía automáticamente al email del paciente o descarga archivos</p>
                  </div>
                </div>
              </details>

              {/* Tutorial 4: Recordatorios WhatsApp */}
              <details className="bg-white p-6 rounded-xl shadow-lg">
                <summary className="font-bold text-lg text-gray-900 cursor-pointer list-none flex items-center justify-between hover:text-blue-600">
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">💬</span>
                    Activar recordatorios por WhatsApp
                  </span>
                  <span className="text-blue-600 text-2xl">+</span>
                </summary>
                <div className="mt-4 pl-11 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 1</span>
                    <p className="text-sm text-gray-700"><strong>Configuración</strong> → <strong>Notificaciones</strong> → activa <strong>"Recordatorios por WhatsApp"</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 2</span>
                    <p className="text-sm text-gray-700">Define tiempo de anticipación (recomendado: 24 horas antes de la cita)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 3</span>
                    <p className="text-sm text-gray-700">Personaliza mensaje: incluye nombre del paciente, doctor, fecha/hora, dirección consultorio</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 4</span>
                    <p className="text-sm text-gray-700">El sistema enviará automáticamente a todos los pacientes con teléfono registrado</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Paso 5</span>
                    <p className="text-sm text-gray-700">Paciente confirma con "Sí" o "No" - Se actualiza automáticamente en tu agenda</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">Resultado</span>
                    <p className="text-sm text-gray-700 font-semibold">Reducción promedio del 80% en inasistencias 🎯</p>
                  </div>
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mt-4">
                    <p className="text-xs text-amber-800"><strong>⚠️ Nota legal:</strong> No envíes recetas médicas ni indicaciones de tratamiento por WhatsApp. Solo información administrativa (recordatorios, confirmaciones, ubicación).</p>
                  </div>
                </div>
              </details>
            </div>

            <div className="text-center mt-8 bg-white p-6 rounded-xl">
              <p className="text-gray-600 mb-4">¿Necesitas ayuda con algún tutorial?</p>
              <a
                href="https://wa.me/522223404585?text=Hola,%20necesito%20ayuda%20con%20un%20tutorial%20de%20AgendaMedPro"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contactar Soporte Técnico
              </a>
            </div>
          </section>

          {/* Preguntas Frecuentes */}
          <section id="preguntas-frecuentes" className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="w-8 h-8 text-purple-600" />
              <h2 className="text-3xl font-bold text-gray-900">Preguntas Frecuentes</h2>
            </div>

            <div className="space-y-3">
              <details className="bg-purple-50 p-5 rounded-lg cursor-pointer hover:bg-purple-100 group">
                <summary className="font-semibold text-gray-900 list-none flex items-center justify-between">
                  ¿Cuánto tiempo toma implementar AgendaMedPro?
                  <span className="text-purple-600 text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-gray-700 mt-3 pl-4 border-l-2 border-purple-300">
                  La mayoría de médicos están operando en menos de 10 minutos. El proceso incluye: registro (2 min), 
                  configuración básica (5 min), primera cita agendada (3 min). No requiere capacitación previa.
                </p>
              </details>

              <details className="bg-purple-50 p-5 rounded-lg cursor-pointer hover:bg-purple-100 group">
                <summary className="font-semibold text-gray-900 list-none flex items-center justify-between">
                  ¿Necesito conocimientos técnicos?
                  <span className="text-purple-600 text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-gray-700 mt-3 pl-4 border-l-2 border-purple-300">
                  No. Si sabes usar Facebook o WhatsApp, sabes usar AgendaMedPro. La interfaz es intuitiva y 
                  cada función tiene ayuda contextual. Además, nuestro soporte está disponible por WhatsApp 
                  para cualquier duda.
                </p>
              </details>

              <details className="bg-purple-50 p-5 rounded-lg cursor-pointer hover:bg-purple-100 group">
                <summary className="font-semibold text-gray-900 list-none flex items-center justify-between">
                  ¿Puedo importar mis pacientes actuales?
                  <span className="text-purple-600 text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-gray-700 mt-3 pl-4 border-l-2 border-purple-300">
                  Sí. Puedes importar pacientes desde un archivo Excel/CSV. También ofrecemos migración asistida 
                  (incluida en plan Enterprise) donde nuestro equipo te ayuda a transferir toda tu información.
                </p>
              </details>

              <details className="bg-purple-50 p-5 rounded-lg cursor-pointer hover:bg-purple-100 group">
                <summary className="font-semibold text-gray-900 list-none flex items-center justify-between">
                  ¿Qué pasa si mi internet falla durante una consulta?
                  <span className="text-purple-600 text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-gray-700 mt-3 pl-4 border-l-2 border-purple-300">
                  AgendaMedPro guarda automáticamente cada cambio que haces. Si se cae tu conexión, cuando vuelva 
                  recuperarás exactamente donde te quedaste. Para contingencias, recomendamos tener un respaldo 
                  de internet móvil.
                </p>
              </details>

              <details className="bg-purple-50 p-5 rounded-lg cursor-pointer hover:bg-purple-100 group">
                <summary className="font-semibold text-gray-900 list-none flex items-center justify-between">
                  ¿Los pacientes pueden agendar citas directamente?
                  <span className="text-purple-600 text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-gray-700 mt-3 pl-4 border-l-2 border-purple-300">
                  Actualmente, las citas se agendan desde el dashboard del médico. Estamos desarrollando una app 
                  para pacientes (Q1 2026) donde podrán agendar directamente según tu disponibilidad. Te notificaremos 
                  cuando esté lista.
                </p>
              </details>
            </div>

            <div className="text-center mt-8">
              <Link 
                href="/soporte#faq"
                className="inline-block text-purple-600 hover:text-purple-700 font-semibold"
              >
                Ver Todas las FAQs (50+) →
              </Link>
            </div>
          </section>

          {/* CTA Final */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-12 rounded-2xl text-center">
            <h2 className="text-3xl font-bold mb-4">¿No encontraste lo que buscabas?</h2>
            <p className="text-lg mb-8">
              Nuestro equipo de soporte está listo para ayudarte con cualquier duda
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://wa.me/528112345678?text=Tengo%20una%20pregunta%20sobre%20AgendaMedPro"
                target="_blank"
                rel="noopener"
                className="inline-block bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                WhatsApp Soporte
              </a>
              <a 
                href="mailto:soporte@agendamedpro.com"
                className="inline-block bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-purple-800 transition-colors border-2 border-white"
              >
                Email
              </a>
            </div>
          </div>

        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
