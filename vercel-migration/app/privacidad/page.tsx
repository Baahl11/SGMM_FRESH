import { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Lock, Eye, Database, UserCheck, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Aviso de Privacidad | AgendaMedPro',
  description: 'Aviso de privacidad de AgendaMedPro conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Aviso de Privacidad</h1>
          </div>
          <p className="text-xl text-blue-100">
            Tu información personal está protegida conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares
          </p>
          <p className="mt-4 text-sm text-blue-200">
            Última actualización: 24 de octubre de 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
          
          {/* Identidad y Domicilio */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">1. Identidad y Domicilio del Responsable</h2>
            </div>
            <div className="text-gray-700 space-y-3 pl-9">
              <p>
                <strong>AgendaMedPro</strong> (en adelante, "el Responsable"), con domicilio en Puebla, México,
                es el responsable del tratamiento de sus datos personales.
              </p>
              <p>
                <strong>Contacto:</strong> contacto@agendamedpro.com
              </p>
            </div>
          </section>

          {/* Datos Personales */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">2. Datos Personales que Recabamos</h2>
            </div>
            <div className="text-gray-700 space-y-4 pl-9">
              <p>Para las finalidades señaladas en este aviso de privacidad, podemos recabar sus datos personales de distintas formas:</p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Datos de Identificación y Contacto:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Nombre completo</li>
                  <li>Correo electrónico</li>
                  <li>Teléfono</li>
                  <li>Dirección</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Datos Profesionales (Para Médicos):</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Cédula profesional</li>
                  <li>Especialidad médica</li>
                  <li>Institución donde labora</li>
                  <li>Años de experiencia</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Datos de Facturación:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>RFC</li>
                  <li>Razón social</li>
                  <li>Régimen fiscal</li>
                  <li>Código postal</li>
                </ul>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Datos de Pacientes (Introducidos por el Médico):</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Nombre, edad, sexo</li>
                  <li>Historial médico</li>
                  <li>Diagnósticos y tratamientos</li>
                  <li>Estudios y resultados clínicos</li>
                </ul>
                <p className="mt-2 text-xs text-amber-800">
                  <strong>Nota:</strong> Los datos de pacientes son propiedad exclusiva del médico tratante. 
                  AgendaMedPro actúa únicamente como encargado del tratamiento de dichos datos.
                </p>
              </div>
            </div>
          </section>

          {/* Finalidades */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">3. Finalidades del Tratamiento</h2>
            </div>
            <div className="text-gray-700 space-y-3 pl-9">
              <p><strong>Finalidades Primarias (Necesarias para el servicio):</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Proveer los servicios de gestión de agenda médica</li>
                <li>Gestionar citas y recordatorios</li>
                <li>Procesar pagos y emitir facturas</li>
                <li>Brindar soporte técnico</li>
                <li>Cumplir con obligaciones legales y fiscales</li>
              </ul>

              <p className="mt-4"><strong>Finalidades Secundarias (Opcionales):</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Enviar información promocional y descuentos</li>
                <li>Realizar encuestas de satisfacción</li>
                <li>Mejorar nuestros servicios mediante análisis estadísticos</li>
              </ul>

              <p className="mt-4 text-sm italic">
                Si no desea que sus datos sean tratados para finalidades secundarias, puede manifestarlo enviando un correo a: 
                contacto@agendamedpro.com
              </p>
            </div>
          </section>

          {/* Transferencias */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">4. Transferencias de Datos</h2>
            </div>
            <div className="text-gray-700 space-y-3 pl-9">
              <p>
                Sus datos personales pueden ser compartidos con terceros en los siguientes casos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Proveedores de servicios en la nube:</strong> Para almacenamiento y procesamiento de datos (Supabase, Vercel)</li>
                <li><strong>Procesadores de pago:</strong> Para gestionar transacciones financieras (Stripe)</li>
                <li><strong>Autoridades competentes:</strong> Cuando sea requerido por ley</li>
              </ul>
              <p className="mt-4">
                Todas las transferencias se realizan con medidas de seguridad apropiadas y contratos que garantizan 
                la protección de sus datos personales.
              </p>
            </div>
          </section>

          {/* Derechos ARCO */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">5. Derechos ARCO</h2>
            </div>
            <div className="text-gray-700 space-y-3 pl-9">
              <p>Usted tiene derecho a:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Acceder</strong> a sus datos personales</li>
                <li><strong>Rectificar</strong> datos inexactos o incompletos</li>
                <li><strong>Cancelar</strong> su registro y solicitar la eliminación de sus datos</li>
                <li><strong>Oponerse</strong> al tratamiento de sus datos para finalidades específicas</li>
              </ul>
              <p className="mt-4">
                Para ejercer sus derechos ARCO, envíe un correo a: <strong>contacto@agendamedpro.com</strong> con 
                el asunto "Derechos ARCO" y su solicitud será atendida en un plazo máximo de 20 días hábiles.
              </p>
            </div>
          </section>

          {/* Seguridad */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">6. Medidas de Seguridad</h2>
            </div>
            <div className="text-gray-700 space-y-3 pl-9">
              <p>
                AgendaMedPro implementa medidas de seguridad físicas, técnicas y administrativas para proteger sus 
                datos personales contra daño, pérdida, alteración, destrucción o uso no autorizado:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cifrado de datos en tránsito y en reposo (SSL/TLS)</li>
                <li>Autenticación de dos factores</li>
                <li>Auditorías de seguridad periódicas</li>
                <li>Capacitación del personal en protección de datos</li>
                <li>Respaldos automáticos diarios</li>
              </ul>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Uso de Cookies y Tecnologías de Rastreo</h2>
              <p className="text-gray-700 text-sm">
                Utilizamos cookies y tecnologías similares para mejorar su experiencia en nuestra plataforma. 
                Puede conocer más sobre esto en nuestra <Link href="/cookies" className="text-blue-600 hover:underline">Política de Cookies</Link>.
              </p>
            </div>
          </section>

          {/* Cambios al Aviso */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Cambios al Aviso de Privacidad</h2>
            <p className="text-gray-700 text-sm">
              Nos reservamos el derecho de modificar este aviso de privacidad. Las modificaciones estarán disponibles 
              en esta página con la fecha de última actualización. Le recomendamos revisarlo periódicamente.
            </p>
          </section>

          {/* Consentimiento */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg mt-8">
            <p className="text-gray-900 font-semibold mb-2">Consentimiento</p>
            <p className="text-gray-700 text-sm">
              Al utilizar nuestros servicios, usted acepta los términos de este aviso de privacidad. 
              Si no está de acuerdo, le solicitamos abstenerse de proporcionar sus datos personales.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
