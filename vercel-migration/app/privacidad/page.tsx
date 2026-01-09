import { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Lock, Eye, Database, UserCheck, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Aviso de Privacidad | AgendaMedPro',
  description: 'Aviso de privacidad de AgendaMedPro conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden py-20">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-purple-500/40 blur-[140px]" />
          <div className="absolute -bottom-36 left-0 h-96 w-96 rounded-full bg-blue-500/40 blur-[160px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-12 h-12 text-blue-300" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">Aviso de Privacidad</h1>
          </div>
          <p className="text-xl text-white/80">
            Tu información personal está protegida conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares
          </p>
          <p className="mt-4 text-sm text-white/60">
            Última actualización: 6 de enero de 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 md:p-12 space-y-8 text-white">
          
          {/* Identidad y Domicilio */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-blue-300" />
              <h2 className="text-2xl font-bold">1. Identidad y Domicilio del Responsable</h2>
            </div>
            <div className="text-white/80 space-y-3 pl-9">
              <p>
                <strong>AgendaMedPro</strong> (en adelante, "el Responsable"), es una plataforma SaaS de gestión médica 
                desarrollada por Memo Labs, con domicilio fiscal en México.
              </p>
              <p>
                <strong>Contacto de Privacidad:</strong> gmelgarejom@gmail.com
              </p>
              <p>
                <strong>Soporte:</strong> Disponible dentro de la plataforma
              </p>
            </div>
          </section>

          {/* Datos Personales */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-blue-300" />
              <h2 className="text-2xl font-bold">2. Datos Personales que Recabamos</h2>
            </div>
            <div className="text-white/80 space-y-4 pl-9">
              <p>Para las finalidades señaladas en este aviso de privacidad, podemos recabar sus datos personales de distintas formas:</p>
              
              <div className="backdrop-blur-md bg-blue-500/10 border border-blue-400/20 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Datos de Identificación y Contacto:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-white/70">
                  <li>Nombre completo</li>
                  <li>Correo electrónico</li>
                  <li>Teléfono</li>
                  <li>Dirección</li>
                </ul>
              </div>

              <div className="backdrop-blur-md bg-purple-500/10 border border-purple-400/20 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Datos Profesionales (Para Médicos):</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-white/70">
                  <li>Cédula profesional</li>
                  <li>Especialidad médica</li>
                  <li>Institución donde labora</li>
                  <li>Años de experiencia</li>
                </ul>
              </div>

              <div className="backdrop-blur-md bg-green-500/10 border border-green-400/20 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Datos de Facturación:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-white/70">
                  <li>RFC</li>
                  <li>Razón social</li>
                  <li>Régimen fiscal</li>
                  <li>Código postal</li>
                </ul>
              </div>

              <div className="backdrop-blur-md bg-amber-500/10 border border-amber-400/20 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Datos de Pacientes (Introducidos por el Médico):</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-white/70">
                  <li>Nombre, edad, sexo</li>
                  <li>Historial médico</li>
                  <li>Diagnósticos y tratamientos</li>
                  <li>Estudios y resultados clínicos</li>
                </ul>
                <p className="mt-2 text-xs text-amber-200/80">
                  <strong>Nota:</strong> Los datos de pacientes son propiedad exclusiva del médico tratante. 
                  AgendaMedPro actúa únicamente como encargado del tratamiento de dichos datos.
                </p>
              </div>
            </div>
          </section>

          {/* Finalidades */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-blue-300" />
              <h2 className="text-2xl font-bold">3. Finalidades del Tratamiento</h2>
            </div>
            <div className="text-white/80 space-y-3 pl-9">
              <p><strong className="text-white">Finalidades Primarias (Necesarias para el servicio):</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-white/70">
                <li>Proveer los servicios de gestión de agenda médica</li>
                <li>Gestionar citas y recordatorios</li>
                <li>Procesar pagos y emitir facturas</li>
                <li>Brindar soporte técnico</li>
                <li>Cumplir con obligaciones legales y fiscales</li>
              </ul>

              <p className="mt-4"><strong className="text-white">Finalidades Secundarias (Opcionales):</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-white/70">
                <li>Enviar información promocional y descuentos</li>
                <li>Realizar encuestas de satisfacción</li>
                <li>Mejorar nuestros servicios mediante análisis estadísticos</li>
              </ul>

              <p className="mt-4 text-sm italic text-white/60">
                Si no desea que sus datos sean tratados para finalidades secundarias, puede manifestarlo enviando un correo a: 
                gmelgarejom@gmail.com
              </p>
            </div>
          </section>

          {/* Transferencias */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-blue-300" />
              <h2 className="text-2xl font-bold">4. Transferencias de Datos</h2>
            </div>
            <div className="text-white/80 space-y-3 pl-9">
              <p>
                Sus datos personales pueden ser compartidos con terceros en los siguientes casos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-white/70">
                <li><strong className="text-white">Proveedores de servicios en la nube:</strong> Para almacenamiento y procesamiento de datos (Supabase, Vercel)</li>
                <li><strong className="text-white">Procesadores de pago:</strong> Para gestionar transacciones financieras (Stripe)</li>
                <li><strong className="text-white">Autoridades competentes:</strong> Cuando sea requerido por ley</li>
              </ul>
              <p className="mt-4 text-white/70">
                Todas las transferencias se realizan con medidas de seguridad apropiadas y contratos que garantizan 
                la protección de sus datos personales.
              </p>
            </div>
          </section>

          {/* Derechos ARCO */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-blue-300" />
              <h2 className="text-2xl font-bold">5. Derechos ARCO</h2>
            </div>
            <div className="text-white/80 space-y-3 pl-9">
              <p>Usted tiene derecho a:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-white/70">
                <li><strong className="text-white">Acceder</strong> a sus datos personales</li>
                <li><strong className="text-white">Rectificar</strong> datos inexactos o incompletos</li>
                <li><strong className="text-white">Cancelar</strong> su registro y solicitar la eliminación de sus datos</li>
                <li><strong className="text-white">Oponerse</strong> al tratamiento de sus datos para finalidades específicas</li>
              </ul>
              <p className="mt-4 text-white/70">
                Para ejercer sus derechos ARCO, envíe un correo a: <strong className="text-white">gmelgarejom@gmail.com</strong> con 
                el asunto "Derechos ARCO" y su solicitud será atendida en un plazo máximo de 20 días hábiles.
              </p>
            </div>
          </section>

          {/* Seguridad */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-300" />
              <h2 className="text-2xl font-bold">6. Medidas de Seguridad</h2>
            </div>
            <div className="text-white/80 space-y-3 pl-9">
              <p>
                AgendaMedPro implementa medidas de seguridad físicas, técnicas y administrativas para proteger sus 
                datos personales contra daño, pérdida, alteración, destrucción o uso no autorizado:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-white/70">
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
            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-3">7. Uso de Cookies y Tecnologías de Rastreo</h2>
              <p className="text-white/70 text-sm">
                Utilizamos cookies y tecnologías similares para mejorar su experiencia en nuestra plataforma. 
                Puede conocer más sobre esto en nuestra <Link href="/cookies" className="text-blue-300 hover:text-blue-200 underline">Política de Cookies</Link>.
              </p>
            </div>
          </section>

          {/* Cambios al Aviso */}
          <section>
            <h2 className="text-xl font-bold mb-3">8. Cambios al Aviso de Privacidad</h2>
            <p className="text-white/70 text-sm">
              Nos reservamos el derecho de modificar este aviso de privacidad. Las modificaciones estarán disponibles 
              en esta página con la fecha de última actualización. Le recomendamos revisarlo periódicamente.
            </p>
          </section>

          {/* Consentimiento */}
          <div className="backdrop-blur-md bg-blue-500/10 border-l-4 border-blue-400 p-6 rounded-r-lg mt-8">
            <p className="font-semibold mb-2">Consentimiento</p>
            <p className="text-white/70 text-sm">
              Al utilizar nuestros servicios, usted acepta los términos de este aviso de privacidad. 
              Si no está de acuerdo, le solicitamos abstenerse de proporcionar sus datos personales.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 font-medium transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
