import { Metadata } from 'next'
import Link from 'next/link'
import { Scale, Building2, Mail, MapPin, FileText, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Aviso Legal | AgendaMedPro',
  description: 'Información legal sobre AgendaMedPro y cumplimiento normativo en México',
}

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Aviso Legal</h1>
          </div>
          <p className="text-xl text-blue-100">
            ⚖️ Información legal y cumplimiento normativo de AgendaMedPro
          </p>
          <p className="text-sm text-blue-200 mt-2">
            Última actualización: 24 de octubre de 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
          
          {/* Objeto social */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Objeto y Servicios</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                AgendaMedPro es una plataforma tecnológica SaaS (Software as a Service) especializada en la 
                gestión integral de consultorios médicos en México. Nuestros servicios incluyen:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Gestión de citas y agenda médica</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Expediente clínico electrónico conforme a NOM-004-SSA3-2012</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Control de inventario de insumos médicos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Facturación electrónica CFDI 4.0</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Reportes y análisis de consultas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Sistema de mensajería entre médicos y pacientes</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Normativa aplicable */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Normativa Aplicable</h2>
            </div>
            <div className="text-gray-700 space-y-4">
              <p>
                AgendaMedPro cumple con toda la legislación mexicana aplicable al sector salud y tecnologías de la información:
              </p>

              <div className="space-y-4">
                <div className="bg-white border-2 border-blue-200 rounded-lg p-5">
                  <h3 className="font-bold text-gray-900 mb-2">🏥 Sector Salud</h3>
                  <ul className="text-sm space-y-2">
                    <li>
                      <strong>Ley General de Salud</strong> - Artículos 100 bis, 101, 103 (prestación de servicios de salud)
                    </li>
                    <li>
                      <strong>NOM-004-SSA3-2012</strong> - Del expediente clínico electrónico
                    </li>
                    <li>
                      <strong>NOM-024-SSA3-2012</strong> - Sistemas de información de registro electrónico para la salud
                    </li>
                    <li>
                      <strong>Reglamento de Insumos para la Salud</strong> - Control de medicamentos e insumos
                    </li>
                  </ul>
                </div>

                <div className="bg-white border-2 border-purple-200 rounded-lg p-5">
                  <h3 className="font-bold text-gray-900 mb-2">🔒 Protección de Datos</h3>
                  <ul className="text-sm space-y-2">
                    <li>
                      <strong>LFPDPPP</strong> - Ley Federal de Protección de Datos Personales en Posesión de los Particulares
                    </li>
                    <li>
                      <strong>Reglamento de la LFPDPPP</strong> - Disposiciones reglamentarias
                    </li>
                    <li>
                      <strong>Lineamientos del Aviso de Privacidad</strong> (INAI)
                    </li>
                    <li>
                      <strong>Código Penal Federal</strong> - Artículos 211 bis (protección de datos)
                    </li>
                  </ul>
                </div>

                <div className="bg-white border-2 border-green-200 rounded-lg p-5">
                  <h3 className="font-bold text-gray-900 mb-2">💰 Facturación y Fiscal</h3>
                  <ul className="text-sm space-y-2">
                    <li>
                      <strong>Código Fiscal de la Federación</strong> - Artículo 29 (comprobantes fiscales digitales)
                    </li>
                    <li>
                      <strong>Resolución Miscelánea Fiscal</strong> - Reglas de facturación electrónica
                    </li>
                    <li>
                      <strong>Anexo 20 (CFDI 4.0)</strong> - Especificaciones técnicas del SAT
                    </li>
                    <li>
                      <strong>Ley del IVA</strong> - Aplicación de impuestos en servicios digitales
                    </li>
                  </ul>
                </div>

                <div className="bg-white border-2 border-amber-200 rounded-lg p-5">
                  <h3 className="font-bold text-gray-900 mb-2">💻 Comercio Electrónico</h3>
                  <ul className="text-sm space-y-2">
                    <li>
                      <strong>Ley Federal de Protección al Consumidor</strong> - Capítulo VIII Bis (comercio electrónico)
                    </li>
                    <li>
                      <strong>Código de Comercio</strong> - Título Segundo (comercio electrónico)
                    </li>
                    <li>
                      <strong>Ley Federal del Derecho de Autor</strong> - Protección de software
                    </li>
                    <li>
                      <strong>NOM-151-SCFI-2016</strong> - Requisitos para sitios web de comercio electrónico
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Propiedad intelectual */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Propiedad Intelectual</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Todos los derechos de propiedad intelectual del sitio web <strong>agendamedpro.com</strong>, 
                su código fuente, diseño gráfico, estructura, y contenidos son propiedad exclusiva de 
                <strong> AgendaMedPro</strong>.
              </p>

              <div className="bg-blue-50 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Derechos Reservados:</h3>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">©</span>
                    <span><strong>Marca registrada:</strong> "AgendaMedPro" (Registro IMPI en trámite)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">©</span>
                    <span><strong>Software:</strong> Código fuente protegido por Ley Federal del Derecho de Autor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">©</span>
                    <span><strong>Diseño:</strong> Interfaces y elementos gráficos registrados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">©</span>
                    <span><strong>Contenidos:</strong> Textos, imágenes, videos, documentación</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm">
                Queda prohibida la reproducción, distribución, comunicación pública y transformación de cualquier 
                elemento de esta plataforma sin autorización expresa por escrito de AgendaMedPro.
              </p>
            </div>
          </section>

          {/* Responsabilidad */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitación de Responsabilidad</h2>
            <div className="text-gray-700 space-y-3">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg">
                <h3 className="font-semibold text-gray-900 mb-2">⚕️ Relación Médico-Paciente</h3>
                <p className="text-sm">
                  AgendaMedPro es una herramienta de gestión administrativa. La responsabilidad profesional 
                  sobre el diagnóstico, tratamiento y atención médica recae exclusivamente en el médico tratante. 
                  No sustituimos la relación directa médico-paciente ni la práctica médica presencial.
                </p>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg">
                <h3 className="font-semibold text-gray-900 mb-2">🔧 Disponibilidad del Servicio</h3>
                <p className="text-sm">
                  Aunque nos esforzamos por mantener un uptime del 99.9%, no garantizamos disponibilidad 
                  ininterrumpida. Podemos suspender temporalmente el servicio por mantenimiento programado 
                  (notificado con 48h de anticipación) o por causas de fuerza mayor.
                </p>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg">
                <h3 className="font-semibold text-gray-900 mb-2">💾 Respaldo de Información</h3>
                <p className="text-sm">
                  Realizamos respaldos diarios automáticos, pero recomendamos a los usuarios exportar 
                  periódicamente su información crítica. En caso de pérdida de datos por causas no imputables 
                  a AgendaMedPro, nuestra responsabilidad se limita al reembolso proporcional de la suscripción.
                </p>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg">
                <h3 className="font-semibold text-gray-900 mb-2">🔗 Enlaces a Terceros</h3>
                <p className="text-sm">
                  Nuestro sitio puede contener enlaces a sitios web de terceros (Stripe, Supabase). 
                  No nos hacemos responsables del contenido, políticas de privacidad o prácticas de estos sitios externos.
                </p>
              </div>
            </div>
          </section>

          {/* Condiciones de uso */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Condiciones de Uso del Sitio</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                El acceso y uso de <strong>agendamedpro.com</strong> implica la aceptación plena de estos términos:
              </p>

              <div className="bg-blue-50 p-5 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-xl mt-1">1.</span>
                  <div>
                    <h3 className="font-semibold">Uso Autorizado</h3>
                    <p className="text-sm">
                      El servicio está diseñado exclusivamente para profesionales de la salud legalmente autorizados 
                      para ejercer en México (cédula profesional vigente).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-xl mt-1">2.</span>
                  <div>
                    <h3 className="font-semibold">Veracidad de Datos</h3>
                    <p className="text-sm">
                      Los usuarios se comprometen a proporcionar información verdadera, completa y actualizada 
                      en su registro. La falsificación de identidad puede constituir un delito.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-xl mt-1">3.</span>
                  <div>
                    <h3 className="font-semibold">Seguridad de Credenciales</h3>
                    <p className="text-sm">
                      El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. 
                      Cualquier actividad realizada desde su cuenta será de su exclusiva responsabilidad.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-xl mt-1">4.</span>
                  <div>
                    <h3 className="font-semibold">Uso Prohibido</h3>
                    <p className="text-sm">
                      Queda prohibido: usar la plataforma para fines ilícitos, intentar vulnerar la seguridad, 
                      realizar ingeniería inversa del software, revender accesos, o sobrecargar los servidores.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-xl mt-1">5.</span>
                  <div>
                    <h3 className="font-semibold">Edad Mínima</h3>
                    <p className="text-sm">
                      Los usuarios deben ser mayores de 18 años y tener capacidad legal para contratar 
                      conforme al Código Civil Federal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Jurisdicción */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Jurisdicción y Ley Aplicable</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Este Aviso Legal se rige por las leyes de los <strong>Estados Unidos Mexicanos</strong>. 
                Cualquier controversia derivada del uso de esta plataforma será competencia exclusiva de los 
                tribunales de <strong>Puebla, México</strong>, renunciando expresamente 
                las partes a cualquier otro fuero que pudiera corresponderles.
              </p>

              <div className="bg-gray-100 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">📍 Tribunales Competentes:</h3>
                <p className="text-sm">
                  Juzgados de Primera Instancia en Materia Civil y Mercantil del Distrito Judicial de Puebla.
                </p>
              </div>
            </div>
          </section>

          {/* Modificaciones */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Modificaciones al Aviso Legal</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                AgendaMedPro se reserva el derecho de modificar este Aviso Legal en cualquier momento. 
                Los cambios significativos serán notificados a través del dashboard o por correo electrónico 
                con al menos 15 días de anticipación.
              </p>
              <p>
                El uso continuado de la plataforma después de la publicación de cambios constituye la 
                aceptación de los términos modificados.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Versión actual:</strong> 1.0<br />
                  <strong>Fecha de vigencia:</strong> 24 de octubre de 2025<br />
                  <strong>Última revisión:</strong> 24 de octubre de 2025
                </p>
              </div>
            </div>
          </section>

          {/* Contacto legal */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-3">¿Consultas Legales?</h2>
            <p className="mb-6">
              Para cualquier consulta relacionada con este Aviso Legal o aspectos jurídicos de nuestro servicio:
            </p>
            <div className="space-y-2 text-sm">
              <p>📧 Email: <a href="mailto:legal@agendamedpro.com" className="underline hover:text-blue-100">legal@agendamedpro.com</a></p>
              <p>📞 Teléfono: <a href="https://wa.me/522223404585" target="_blank" rel="noopener" className="underline hover:text-blue-100">+52 2223 404585</a></p>
              <p>📍 Ubicación: Puebla, México</p>
              <p className="text-xs text-blue-100 mt-4">
                Horario de atención: Lunes a Viernes de 9:00 a 18:00 hrs (GMT-6)
              </p>
            </div>
          </div>

        </div>

        {/* Links relacionados */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/privacidad" className="text-blue-600 hover:text-blue-700 font-medium">
            Política de Privacidad
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/terminos" className="text-blue-600 hover:text-blue-700 font-medium">
            Términos y Condiciones
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/cookies" className="text-blue-600 hover:text-blue-700 font-medium">
            Política de Cookies
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
