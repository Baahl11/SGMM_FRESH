import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, CheckCircle, AlertTriangle, Scale, Ban } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Términos y Condiciones | AgendaMedPro',
  description: 'Términos y condiciones de uso de la plataforma AgendaMedPro',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Términos y Condiciones</h1>
          </div>
          <p className="text-xl text-purple-100">
            Acuerdo legal entre usted y AgendaMedPro para el uso de nuestros servicios
          </p>
          <p className="mt-4 text-sm text-purple-200">
            Última actualización: 24 de octubre de 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
          
          {/* Aceptación */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">1. Aceptación de los Términos</h2>
            </div>
            <div className="text-gray-700 space-y-3 pl-9">
              <p>
                Al acceder y utilizar AgendaMedPro, usted acepta estar sujeto a estos Términos y Condiciones, 
                todas las leyes y regulaciones aplicables, y acepta que es responsable del cumplimiento de 
                todas las leyes locales aplicables.
              </p>
              <p>
                Si no está de acuerdo con alguno de estos términos, no debe usar o acceder a este sitio.
              </p>
            </div>
          </section>

          {/* Descripción del Servicio */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">2. Descripción del Servicio</h2>
            </div>
            <div className="text-gray-700 space-y-3 pl-9">
              <p>
                AgendaMedPro es una plataforma SaaS (Software as a Service) que proporciona herramientas para 
                la gestión de consultorios médicos, incluyendo:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Gestión de agenda y citas</li>
                <li>Administración de pacientes y expedientes clínicos</li>
                <li>Control de inventario médico</li>
                <li>Generación de reportes y estadísticas</li>
                <li>Facturación electrónica (CFDI 4.0)</li>
                <li>Recordatorios automáticos</li>
              </ul>
            </div>
          </section>

          {/* Registro y Cuenta */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">3. Registro y Cuenta de Usuario</h2>
            </div>
            <div className="text-gray-700 space-y-3 pl-9">
              <p><strong>3.1. Requisitos:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Debe ser mayor de 18 años</li>
                <li>Proporcionar información veraz y actualizada</li>
                <li>Ser profesional de la salud con cédula profesional válida (para usuarios médicos)</li>
              </ul>

              <p className="mt-4"><strong>3.2. Responsabilidad de la Cuenta:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Usted es responsable de mantener la confidencialidad de su contraseña</li>
                <li>Es responsable de todas las actividades que ocurran bajo su cuenta</li>
                <li>Debe notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
              </ul>

              <p className="mt-4"><strong>3.3. Suspensión:</strong></p>
              <p className="ml-4">
                Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos, 
                incluido el uso fraudulento o abusivo del servicio.
              </p>
            </div>
          </section>

          {/* Planes y Pagos */}
          <section>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Planes, Pagos y Facturación</h2>
              <div className="text-gray-700 space-y-3 text-sm">
                <p><strong>4.1. Planes de Suscripción:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Plan Básico:</strong> $499 MXN/mes o $4,990 MXN/año</li>
                  <li><strong>Plan Pro:</strong> $999 MXN/mes o $9,990 MXN/año</li>
                  <li><strong>Plan Enterprise:</strong> $2,999 MXN/mes o $29,990 MXN/año</li>
                  <li><strong>Licencia Lifetime:</strong> Pago único de $19,999 MXN</li>
                </ul>

                <p className="mt-4"><strong>4.2. Facturación:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Los cargos se realizan de forma automática al inicio de cada periodo</li>
                  <li>Los precios incluyen IVA</li>
                  <li>Se emite factura electrónica (CFDI 4.0) automáticamente</li>
                  <li>No hay reembolsos por cancelaciones anticipadas</li>
                </ul>

                <p className="mt-4"><strong>4.3. Cancelación:</strong></p>
                <p className="ml-4">
                  Puede cancelar su suscripción en cualquier momento desde su panel de control. 
                  El servicio permanecerá activo hasta el final del periodo pagado.
                </p>
              </div>
            </div>
          </section>

          {/* Uso Aceptable */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Ban className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">5. Uso Aceptable</h2>
            </div>
            <div className="text-gray-700 space-y-3 pl-9">
              <p><strong>Está prohibido:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Utilizar el servicio para fines ilegales o no autorizados</li>
                <li>Intentar acceder a áreas restringidas del sistema</li>
                <li>Compartir credenciales de acceso con terceros</li>
                <li>Realizar ingeniería inversa del software</li>
                <li>Extraer datos mediante scraping o métodos automatizados</li>
                <li>Sobrecargar o dañar los servidores</li>
                <li>Cargar contenido malicioso o virus</li>
              </ul>
            </div>
          </section>

          {/* Propiedad Intelectual */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Propiedad Intelectual</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                Todo el contenido, características y funcionalidad de AgendaMedPro (incluido pero no limitado a 
                software, texto, gráficos, logotipos, iconos e imágenes) son propiedad exclusiva de AgendaMedPro 
                y están protegidos por derechos de autor y otras leyes de propiedad intelectual.
              </p>
              <p className="font-semibold text-gray-900">
                Propiedad de los Datos del Usuario:
              </p>
              <p>
                Usted mantiene todos los derechos sobre los datos que introduce en el sistema, incluyendo 
                información de pacientes y registros médicos. AgendaMedPro actúa únicamente como procesador 
                de dichos datos.
              </p>
            </div>
          </section>

          {/* Garantías y Limitaciones */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Garantías y Limitaciones de Responsabilidad</h2>
            <div className="text-gray-700 space-y-3">
              <p><strong>7.1. Disponibilidad del Servicio:</strong></p>
              <p className="ml-4">
                Nos esforzamos por mantener una disponibilidad del 99.9%, pero no garantizamos que el servicio 
                esté libre de interrupciones, errores o virus.
              </p>

              <p className="mt-4"><strong>7.2. Respaldos:</strong></p>
              <p className="ml-4">
                Realizamos respaldos automáticos diarios, pero recomendamos que usted también mantenga copias 
                de seguridad de sus datos críticos.
              </p>

              <p className="mt-4"><strong>7.3. Limitación de Responsabilidad:</strong></p>
              <p className="ml-4">
                AgendaMedPro no será responsable por daños indirectos, incidentales, especiales o consecuentes 
                que resulten del uso o incapacidad de usar el servicio. Nuestra responsabilidad máxima se limita 
                al monto pagado por el servicio en los últimos 12 meses.
              </p>
            </div>
          </section>

          {/* Cumplimiento Legal */}
          <section>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Cumplimiento Legal y Normativo</h2>
              <div className="text-gray-700 space-y-3 text-sm">
                <p>AgendaMedPro cumple con:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</li>
                  <li>Norma Oficial Mexicana NOM-004-SSA3-2012 del expediente clínico</li>
                  <li>Código Fiscal de la Federación (CFDI 4.0)</li>
                  <li>Ley General de Salud</li>
                </ul>
                <p className="mt-3">
                  El usuario médico es responsable de cumplir con todas las regulaciones aplicables a su práctica profesional.
                </p>
              </div>
            </div>
          </section>

          {/* Modificaciones */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Modificaciones a los Términos</h2>
            <p className="text-gray-700 text-sm">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán 
              notificados por correo electrónico y publicados en esta página con 30 días de anticipación. 
              El uso continuado del servicio después de la fecha efectiva constituye aceptación de los nuevos términos.
            </p>
          </section>

          {/* Ley Aplicable */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Ley Aplicable y Jurisdicción</h2>
            <p className="text-gray-700 text-sm">
              Estos términos se regirán e interpretarán de acuerdo con las leyes de México. 
              Cualquier disputa será sometida a la jurisdicción exclusiva de los tribunales de Puebla, México.
            </p>
          </section>

          {/* Contacto */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-600 p-6 rounded-r-lg mt-8">
            <p className="text-gray-900 font-semibold mb-2">Contacto</p>
            <p className="text-gray-700 text-sm">
              Si tiene preguntas sobre estos Términos y Condiciones, contáctenos en: 
              <a href="mailto:contacto@agendamedpro.com" className="text-purple-600 hover:underline ml-1">
                contacto@agendamedpro.com
              </a>
            </p>
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
