import { Metadata } from 'next'
import Link from 'next/link'
import { HeadphonesIcon, MessageCircle, Mail, Phone, Clock, Book, Video, HelpCircle } from 'lucide-react'
import { SUPPORT_WHATSAPP_DISPLAY, supportWhatsAppLink } from '@/lib/config/contact' // fable K4

export const metadata: Metadata = {
  title: 'Soporte Técnico | AgendaMedPro',
  description: 'Obtén ayuda rápida y efectiva. Soporte por WhatsApp, email y teléfono 7 días a la semana',
}

export default function SoportePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <HeadphonesIcon className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Soporte Técnico</h1>
          </div>
          <p className="text-xl text-emerald-100">
            🤝 Estamos aquí para ayudarte. Soporte humano real, 7 días a la semana
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Tiempos de respuesta */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Clock className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">WhatsApp</h3>
            <p className="text-2xl font-bold text-emerald-600 mb-1">10 min</p>
            <p className="text-sm text-gray-600">Respuesta promedio</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Mail className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Email</h3>
            <p className="text-2xl font-bold text-emerald-600 mb-1">2 horas</p>
            <p className="text-sm text-gray-600">Respuesta promedio</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Phone className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Teléfono</h3>
            <p className="text-2xl font-bold text-emerald-600 mb-1">Inmediato</p>
            <p className="text-sm text-gray-600">Lun-Vie 9-18h</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
          
          {/* Canales de soporte */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Canales de Atención</h2>
            
            <div className="space-y-6">
              {/* WhatsApp */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-green-500 p-3 rounded-full">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">WhatsApp (Recomendado)</h3>
                    <p className="text-gray-700 mb-4">
                      La forma más rápida de obtener ayuda. Envíanos un mensaje y te respondemos en minutos.
                    </p>
                    <div className="space-y-2 text-sm mb-4">
                      <p><strong>Número:</strong> <a href={supportWhatsAppLink()} target="_blank" rel="noopener" className="text-green-600 hover:underline font-semibold">{SUPPORT_WHATSAPP_DISPLAY}</a></p>
                      <p><strong>Horario:</strong> 7 días a la semana, 8:00 - 22:00 hrs (GMT-6)</p>
                      <p><strong>Ideal para:</strong> Dudas rápidas, problemas urgentes, guías paso a paso con capturas</p>
                    </div>
                    <a 
                      href={supportWhatsAppLink("Hola, necesito ayuda con AgendaMedPro")} 
                      target="_blank"
                      rel="noopener"
                      className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Abrir WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 p-3 rounded-full">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
                    <p className="text-gray-700 mb-4">
                      Para consultas detalladas o que requieran capturas de pantalla extensas.
                    </p>
                    <div className="space-y-2 text-sm mb-4">
                      <p><strong>Email:</strong> <a href="mailto:soporte@agendamedpro.com" className="text-blue-600 hover:underline font-semibold">soporte@agendamedpro.com</a></p>
                      <p><strong>Tiempo de respuesta:</strong> 2 horas en horario laboral, 4 horas fuera de horario</p>
                      <p><strong>Ideal para:</strong> Problemas complejos, solicitudes de funciones, reportes de bugs detallados</p>
                    </div>
                    <div className="bg-blue-100 p-4 rounded-lg text-sm">
                      <p className="font-semibold text-gray-900 mb-2">💡 Tip: Para respuestas más rápidas, incluye:</p>
                      <ul className="space-y-1 text-gray-700">
                        <li>• Tu email de registro en AgendaMedPro</li>
                        <li>• Descripción detallada del problema</li>
                        <li>• Capturas de pantalla si aplica</li>
                        <li>• Navegador y sistema operativo que usas</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teléfono */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-500 p-3 rounded-full">
                    <Phone className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Teléfono</h3>
                    <p className="text-gray-700 mb-4">
                      Para emergencias o problemas críticos que requieran atención inmediata.
                    </p>
                    <div className="space-y-2 text-sm mb-4">
                      {/* fable K4: teléfonos placeholder retirados; OD-6: confirmar líneas reales con negocio */}
                      <p><strong>WhatsApp:</strong> <a href={supportWhatsAppLink()} className="text-purple-600 hover:underline font-semibold">{SUPPORT_WHATSAPP_DISPLAY}</a></p>
                      
                      <p><strong>Horario:</strong> Lunes a Viernes, 9:00 - 18:00 hrs (GMT-6)</p>
                      <p><strong>Ideal para:</strong> Problemas críticos, caídas del servicio, emergencias de facturación</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Recursos de autoayuda */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recursos de Autoayuda</h2>
            <p className="text-gray-700 mb-6">
              Muchas dudas comunes pueden resolverse inmediatamente con nuestros recursos en línea:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-emerald-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Book className="w-8 h-8 text-emerald-600" />
                  <h3 className="font-bold text-gray-900">Centro de Ayuda</h3>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Base de conocimientos con guías paso a paso, FAQs y tutoriales escritos.
                </p>
                <Link 
                  href="/documentacion" 
                  className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm inline-flex items-center gap-1"
                >
                  Ir al Centro de Ayuda →
                </Link>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-emerald-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Video className="w-8 h-8 text-emerald-600" />
                  <h3 className="font-bold text-gray-900">Video Tutoriales</h3>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Videos cortos (2-5 minutos) que muestran cómo usar cada función de AgendaMedPro.
                </p>
                <Link 
                  href="/guias" 
                  className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm inline-flex items-center gap-1"
                >
                  Ver Tutoriales →
                </Link>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-emerald-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <HelpCircle className="w-8 h-8 text-emerald-600" />
                  <h3 className="font-bold text-gray-900">Preguntas Frecuentes</h3>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Las 50 preguntas más comunes con respuestas directas y claras.
                </p>
                <a 
                  href="#faq" 
                  className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm inline-flex items-center gap-1"
                >
                  Ver FAQs →
                </a>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-emerald-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-8 h-8 text-emerald-600" />
                  <h3 className="font-bold text-gray-900">Estado del Sistema</h3>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Verifica en tiempo real si hay problemas conocidos o mantenimientos programados.
                </p>
                <Link 
                  href="/estado-sistema" 
                  className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm inline-flex items-center gap-1"
                >
                  Ver Estado →
                </Link>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Preguntas Frecuentes</h2>
            <div className="space-y-4">
              
              <details className="bg-gray-50 p-5 rounded-lg cursor-pointer hover:bg-gray-100">
                <summary className="font-semibold text-gray-900 list-none flex items-center justify-between">
                  ¿Cómo puedo cambiar mi plan de suscripción?
                  <span className="text-emerald-600 text-2xl">+</span>
                </summary>
                <p className="text-sm text-gray-700 mt-3 pl-4 border-l-2 border-emerald-300">
                  Ve a <strong>Dashboard → Configuración → Suscripción</strong> y haz clic en "Cambiar Plan". 
                  Los cambios son inmediatos y el precio se ajusta proporcionalmente.
                </p>
              </details>

              <details className="bg-gray-50 p-5 rounded-lg cursor-pointer hover:bg-gray-100">
                <summary className="font-semibold text-gray-900 list-none flex items-center justify-between">
                  ¿Puedo exportar todos mis datos si decido cancelar?
                  <span className="text-emerald-600 text-2xl">+</span>
                </summary>
                <p className="text-sm text-gray-700 mt-3 pl-4 border-l-2 border-emerald-300">
                  Sí, puedes exportar toda tu información en formatos CSV, JSON o PDF en cualquier momento desde 
                  <strong> Configuración → Exportar Datos</strong>. Después de cancelar, mantenemos tus datos disponibles 
                  por 90 días adicionales.
                </p>
              </details>

              <details className="bg-gray-50 p-5 rounded-lg cursor-pointer hover:bg-gray-100">
                <summary className="font-semibold text-gray-900 list-none flex items-center justify-between">
                  ¿Cómo recupero mi contraseña?
                  <span className="text-emerald-600 text-2xl">+</span>
                </summary>
                <p className="text-sm text-gray-700 mt-3 pl-4 border-l-2 border-emerald-300">
                  En la página de login, haz clic en "¿Olvidaste tu contraseña?" e ingresa tu email. 
                  Recibirás un enlace para crear una nueva contraseña. El enlace expira en 1 hora.
                </p>
              </details>

              <details className="bg-gray-50 p-5 rounded-lg cursor-pointer hover:bg-gray-100">
                <summary className="font-semibold text-gray-900 list-none flex items-center justify-between">
                  ¿Puedo usar AgendaMedPro en múltiples dispositivos?
                  <span className="text-emerald-600 text-2xl">+</span>
                </summary>
                <p className="text-sm text-gray-700 mt-3 pl-4 border-l-2 border-emerald-300">
                  Sí, puedes acceder desde cualquier dispositivo con internet (PC, Mac, tablet, smartphone). 
                  Tu información se sincroniza automáticamente en todos los dispositivos.
                </p>
              </details>

              <details className="bg-gray-50 p-5 rounded-lg cursor-pointer hover:bg-gray-100">
                <summary className="font-semibold text-gray-900 list-none flex items-center justify-between">
                  ¿Cómo genero facturas CFDI 4.0 para mis pacientes?
                  <span className="text-emerald-600 text-2xl">+</span>
                </summary>
                <p className="text-sm text-gray-700 mt-3 pl-4 border-l-2 border-emerald-300">
                  Primero configura tu RFC y certificados del SAT en <strong>Configuración → Facturación</strong>. 
                  Luego, en cada cita completada, haz clic en "Generar Factura" e ingresa los datos fiscales del paciente. 
                  El CFDI se genera y timbra automáticamente.
                </p>
              </details>

              <details className="bg-gray-50 p-5 rounded-lg cursor-pointer hover:bg-gray-100">
                <summary className="font-semibold text-gray-900 list-none flex items-center justify-between">
                  ¿Qué navegadores son compatibles?
                  <span className="text-emerald-600 text-2xl">+</span>
                </summary>
                <p className="text-sm text-gray-700 mt-3 pl-4 border-l-2 border-emerald-300">
                  AgendaMedPro funciona en todos los navegadores modernos: <strong>Chrome 90+, Firefox 88+, Safari 14+, Edge 90+</strong>. 
                  Para mejor experiencia, recomendamos Chrome o Edge en su última versión.
                </p>
              </details>

              <details className="bg-gray-50 p-5 rounded-lg cursor-pointer hover:bg-gray-100">
                <summary className="font-semibold text-gray-900 list-none flex items-center justify-between">
                  ¿Hay límite de pacientes o citas?
                  <span className="text-emerald-600 text-2xl">+</span>
                </summary>
                <p className="text-sm text-gray-700 mt-3 pl-4 border-l-2 border-emerald-300">
                  Depende de tu plan: <strong>Pro</strong> incluye hasta 10 doctores con operación amplia,
                  y <strong>Enterprise</strong> escala a operación ilimitada para redes y grupos médicos.
                  Puedes ver tu uso actual en el dashboard.
                </p>
              </details>

              <details className="bg-gray-50 p-5 rounded-lg cursor-pointer hover:bg-gray-100">
                <summary className="font-semibold text-gray-900 list-none flex items-center justify-between">
                  ¿Ofrecen capacitación personalizada?
                  <span className="text-emerald-600 text-2xl">+</span>
                </summary>
                <p className="text-sm text-gray-700 mt-3 pl-4 border-l-2 border-emerald-300">
                  Sí, para clientes Enterprise ofrecemos sesiones de capacitación en vivo por Zoom (1-2 horas). 
                  Para otros planes, tenemos tutoriales en video y soporte por WhatsApp que te guía paso a paso.
                </p>
              </details>
            </div>
          </section>

          {/* Niveles de prioridad */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Niveles de Prioridad</h2>
            <div className="space-y-3">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <h3 className="font-bold text-red-900 flex items-center gap-2">
                  🚨 Crítico (Respuesta inmediata)
                </h3>
                <p className="text-sm text-red-800 mt-1">
                  Caída del sistema, pérdida de datos, imposibilidad de facturar. Llámanos directamente.
                </p>
              </div>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <h3 className="font-bold text-orange-900 flex items-center gap-2">
                  ⚡ Alto (Respuesta en 30 min)
                </h3>
                <p className="text-sm text-orange-800 mt-1">
                  Funciones principales no funcionan, errores en agenda, problemas de facturación. WhatsApp o teléfono.
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <h3 className="font-bold text-yellow-900 flex items-center gap-2">
                  ⏰ Medio (Respuesta en 2-4 horas)
                </h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Dudas sobre uso, funciones secundarias con problemas, preguntas sobre planes. WhatsApp o email.
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <h3 className="font-bold text-blue-900 flex items-center gap-2">
                  💡 Bajo (Respuesta en 24 horas)
                </h3>
                <p className="text-sm text-blue-800 mt-1">
                  Sugerencias de funciones, mejoras, preguntas generales. Email preferentemente.
                </p>
              </div>
            </div>
          </section>

          {/* Garantía */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuestra Garantía de Soporte</h2>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border-2 border-emerald-300">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span><strong>Respuesta garantizada:</strong> Todos los tickets reciben respuesta, sin excepciones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span><strong>Humanos reales:</strong> No usamos bots ni respuestas automáticas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span><strong>En español:</strong> Todo nuestro equipo habla español nativo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span><strong>Sin costos ocultos:</strong> El soporte está incluido en tu suscripción</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span><strong>Seguimiento:</strong> Cada caso tiene un número de ticket para seguimiento</span>
                </li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-8 rounded-2xl text-center">
            <h2 className="text-2xl font-bold mb-3">¿Necesitas ayuda ahora?</h2>
            <p className="mb-6">
              Nuestro equipo está listo para asistirte. Elige el canal que prefieras:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href={supportWhatsAppLink("Hola, necesito ayuda con AgendaMedPro")}
                target="_blank"
                rel="noopener"
                className="inline-block bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
              >
                WhatsApp
              </a>
              <a 
                href="mailto:soporte@agendamedpro.com"
                className="inline-block bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-800 transition-colors border-2 border-white"
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
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
