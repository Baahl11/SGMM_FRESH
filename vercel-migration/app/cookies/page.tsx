import { Metadata } from 'next'
import Link from 'next/link'
import { Cookie, Shield, Eye, Settings, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Cookies | AgendaMedPro',
  description: 'Información sobre el uso de cookies y tecnologías similares en AgendaMedPro',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Cookie className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Política de Cookies</h1>
          </div>
          <p className="text-xl text-orange-100">
            🍪 Información transparente sobre cómo usamos cookies y tecnologías de seguimiento
          </p>
          <p className="text-sm text-orange-200 mt-2">
            Última actualización: 24 de octubre de 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
          
          {/* Qué son las cookies */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">¿Qué son las cookies?</h2>
            </div>
            <div className="text-gray-700 space-y-4">
              <p>
                Las cookies son pequeños archivos de texto que se almacenan en tu navegador cuando visitas un sitio web. 
                Nos permiten recordar tus preferencias, mantener tu sesión activa y mejorar tu experiencia de uso.
              </p>
              <div className="bg-orange-50 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">🔍 Información que NO almacenamos en cookies:</h3>
                <ul className="text-sm space-y-1">
                  <li>❌ Datos médicos de pacientes</li>
                  <li>❌ Contraseñas o credenciales</li>
                  <li>❌ Información financiera o de tarjetas</li>
                  <li>❌ Datos sensibles de salud</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Cookies que usamos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies que utilizamos</h2>
            
            {/* Estrictamente necesarias */}
            <div className="mb-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-lg mb-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Cookies Estrictamente Necesarias (No puedes desactivarlas)
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Son esenciales para que el sitio funcione correctamente. Sin ellas, no podrías iniciar sesión 
                  ni acceder a áreas seguras.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">sb-access-token</h4>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Necesaria</span>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-2 text-gray-600 w-32">Propósito:</td>
                        <td className="py-2">Token de autenticación de Supabase para mantener tu sesión activa</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Duración:</td>
                        <td className="py-2">7 días</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Dominio:</td>
                        <td className="py-2">agendamedpro.com</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Proveedor:</td>
                        <td className="py-2">Supabase (infraestructura en México)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">sb-refresh-token</h4>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Necesaria</span>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-2 text-gray-600 w-32">Propósito:</td>
                        <td className="py-2">Renovación automática del token de acceso para mantener sesión segura</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Duración:</td>
                        <td className="py-2">30 días</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Dominio:</td>
                        <td className="py-2">agendamedpro.com</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Proveedor:</td>
                        <td className="py-2">Supabase</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">next-auth.session-token</h4>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Necesaria</span>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-2 text-gray-600 w-32">Propósito:</td>
                        <td className="py-2">Gestión de sesión de Next.js para rutas protegidas</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Duración:</td>
                        <td className="py-2">30 días</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Dominio:</td>
                        <td className="py-2">agendamedpro.com</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Proveedor:</td>
                        <td className="py-2">NextAuth.js</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Funcionales */}
            <div className="mb-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg mb-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Cookies Funcionales (Recomendadas)
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Mejoran tu experiencia recordando tus preferencias y configuraciones.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">theme-preference</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Funcional</span>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-2 text-gray-600 w-32">Propósito:</td>
                        <td className="py-2">Recordar tu preferencia de tema claro/oscuro</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Duración:</td>
                        <td className="py-2">1 año</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Dominio:</td>
                        <td className="py-2">agendamedpro.com</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">calendar-view-preference</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Funcional</span>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-2 text-gray-600 w-32">Propósito:</td>
                        <td className="py-2">Recordar tu vista preferida del calendario (día/semana/mes)</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Duración:</td>
                        <td className="py-2">90 días</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Dominio:</td>
                        <td className="py-2">agendamedpro.com</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">language-preference</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Funcional</span>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-2 text-gray-600 w-32">Propósito:</td>
                        <td className="py-2">Guardar tu preferencia de idioma (cuando esté disponible)</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Duración:</td>
                        <td className="py-2">1 año</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Dominio:</td>
                        <td className="py-2">agendamedpro.com</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Cookies de terceros */}
            <div className="mb-6">
              <div className="bg-purple-50 border-l-4 border-purple-500 p-5 rounded-r-lg mb-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  Cookies de Terceros
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Servicios externos que nos ayudan a procesar pagos y mejorar el rendimiento.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Stripe Cookies</h4>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Pagos</span>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-2 text-gray-600 w-32">Cookies:</td>
                        <td className="py-2">__stripe_sid, __stripe_mid</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Propósito:</td>
                        <td className="py-2">Procesamiento seguro de pagos y prevención de fraude</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Duración:</td>
                        <td className="py-2">30 minutos (sid), 1 año (mid)</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Proveedor:</td>
                        <td className="py-2">Stripe, Inc. (PCI DSS Level 1 certificado)</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Política:</td>
                        <td className="py-2">
                          <a href="https://stripe.com/privacy" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                            stripe.com/privacy
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Vercel Analytics</h4>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Rendimiento</span>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-2 text-gray-600 w-32">Cookies:</td>
                        <td className="py-2">__vercel_analytics_id</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Propósito:</td>
                        <td className="py-2">Análisis de rendimiento del sitio (sin datos personales)</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Duración:</td>
                        <td className="py-2">2 años</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Proveedor:</td>
                        <td className="py-2">Vercel Inc.</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Política:</td>
                        <td className="py-2">
                          <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                            vercel.com/legal/privacy-policy
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* NO usamos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Lo que NO usamos</h2>
            <div className="bg-green-50 p-6 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <h3 className="font-semibold text-gray-900">No usamos Google Analytics</h3>
                  <p className="text-sm text-gray-700">
                    Por respeto a tu privacidad, NO usamos Google Analytics ni ningún servicio de tracking de Google.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <h3 className="font-semibold text-gray-900">No usamos Facebook Pixel</h3>
                  <p className="text-sm text-gray-700">
                    No compartimos tu información con redes sociales ni plataformas publicitarias.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <h3 className="font-semibold text-gray-900">No vendemos datos a terceros</h3>
                  <p className="text-sm text-gray-700">
                    Tus datos NUNCA se venden, alquilan o comparten con fines comerciales.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <h3 className="font-semibold text-gray-900">No hacemos retargeting</h3>
                  <p className="text-sm text-gray-700">
                    No te "seguimos" por internet con anuncios después de visitar nuestro sitio.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Cómo gestionar cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cómo gestionar las cookies</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                Puedes controlar y eliminar las cookies a través de la configuración de tu navegador:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">🌐 Google Chrome</h3>
                  <p className="text-sm">
                    Configuración → Privacidad y seguridad → Cookies y otros datos de sitios
                  </p>
                  <a 
                    href="https://support.google.com/chrome/answer/95647" 
                    target="_blank" 
                    rel="noopener"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Ver guía completa →
                  </a>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">🦊 Mozilla Firefox</h3>
                  <p className="text-sm">
                    Opciones → Privacidad y seguridad → Cookies y datos del sitio
                  </p>
                  <a 
                    href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" 
                    target="_blank" 
                    rel="noopener"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Ver guía completa →
                  </a>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">🧭 Safari</h3>
                  <p className="text-sm">
                    Preferencias → Privacidad → Gestionar datos de sitios web
                  </p>
                  <a 
                    href="https://support.apple.com/es-mx/guide/safari/sfri11471/mac" 
                    target="_blank" 
                    rel="noopener"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Ver guía completa →
                  </a>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">🌊 Microsoft Edge</h3>
                  <p className="text-sm">
                    Configuración → Cookies y permisos del sitio → Cookies y datos del sitio
                  </p>
                  <a 
                    href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" 
                    target="_blank" 
                    rel="noopener"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Ver guía completa →
                  </a>
                </div>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg">
                <p className="text-sm text-amber-900">
                  ⚠️ <strong>Importante:</strong> Si bloqueas o eliminas las cookies esenciales, 
                  es posible que no puedas iniciar sesión o acceder a algunas funciones de AgendaMedPro.
                </p>
              </div>
            </div>
          </section>

          {/* Tus derechos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tus derechos según la LFPDPPP</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                De acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, 
                tienes derecho a:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>Saber qué cookies estamos usando en tu navegador</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>Solicitar que eliminemos cookies no esenciales</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>Revocar tu consentimiento para cookies funcionales</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>Recibir una copia de los datos asociados a tus cookies</span>
                </li>
              </ul>

              <div className="bg-orange-50 p-5 rounded-lg mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">📧 Para ejercer estos derechos:</h3>
                <p className="text-sm">
                  Envía un correo a <a href="mailto:privacidad@agendamedpro.com" className="text-orange-600 hover:underline font-medium">privacidad@agendamedpro.com</a> con 
                  el asunto "Derechos ARCO - Cookies" y responderemos en un plazo máximo de 20 días hábiles.
                </p>
              </div>
            </div>
          </section>

          {/* Cambios */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cambios en esta política</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Podemos actualizar esta Política de Cookies ocasionalmente para reflejar cambios en las 
                tecnologías que utilizamos o en las regulaciones aplicables.
              </p>
              <p>
                <strong>Fecha de última actualización: 24 de octubre de 2025</strong>
              </p>
              <p className="text-sm">
                Te notificaremos de cambios significativos mediante un aviso en el dashboard o por correo electrónico.
              </p>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-8 rounded-2xl text-center">
            <h2 className="text-2xl font-bold mb-3">¿Dudas sobre cookies?</h2>
            <p className="mb-6">
              Si tienes preguntas sobre cómo usamos cookies o quieres más información, estamos aquí para ayudarte.
            </p>
            <a 
              href="mailto:privacidad@agendamedpro.com" 
              className="inline-block bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              Contactar Privacidad
            </a>
          </div>

        </div>

        {/* Links relacionados */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/privacidad" className="text-orange-600 hover:text-orange-700 font-medium">
            Política de Privacidad
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/terminos" className="text-orange-600 hover:text-orange-700 font-medium">
            Términos y Condiciones
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
