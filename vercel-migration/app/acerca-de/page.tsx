import { Metadata } from 'next'
import Link from 'next/link'
import { Heart, Users, Target, Lightbulb, Award, TrendingUp, Shield, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Acerca de AgendaMedPro | Nuestra Historia',
  description: 'Conoce la historia de AgendaMedPro, nuestra misión de digitalizar la salud en México y el equipo detrás de la plataforma',
}

export default function AcercaDePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Acerca de AgendaMedPro</h1>
          </div>
          <p className="text-xl text-blue-100">
            💙 Digitalizando la gestión médica en México, un consultorio a la vez
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Estadísticas */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">2025</div>
            <p className="text-sm text-gray-600">Año de fundación</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">1,500+</div>
            <p className="text-sm text-gray-600">Médicos activos</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">15K+</div>
            <p className="text-sm text-gray-600">Citas agendadas/mes</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
            <p className="text-sm text-gray-600">Uptime garantizado</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
          
          {/* Nuestra historia */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Nuestra Historia</h2>
            </div>
            <div className="text-gray-700 space-y-4">
              <p className="text-lg">
                AgendaMedPro nació en 2025 con una visión clara: <strong>hacer que la tecnología médica 
                sea accesible para todos los profesionales de la salud en México</strong>, sin importar el 
                tamaño de su consultorio.
              </p>
              
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-bold text-gray-900 mb-3">🎯 El Problema que Vimos</h3>
                <p className="text-sm">
                  Durante años, las soluciones tecnológicas para consultorios médicos en México han sido:
                </p>
                <ul className="text-sm space-y-2 mt-3 ml-4">
                  <li>❌ Demasiado costosas ($5,000 - $15,000 MXN/mes)</li>
                  <li>❌ Complejas de implementar (3-6 meses de capacitación)</li>
                  <li>❌ Con datos almacenados en servidores extranjeros</li>
                  <li>❌ Diseñadas para hospitales, no para consultorios pequeños</li>
                  <li>❌ Sin integración real con el SAT para facturación</li>
                </ul>
              </div>

              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                <h3 className="font-bold text-gray-900 mb-3">✨ Nuestra Solución</h3>
                <p className="text-sm">
                  Creamos AgendaMedPro con principios fundamentales:
                </p>
                <ul className="text-sm space-y-2 mt-3 ml-4">
                  <li>✓ <strong>Precio justo:</strong> Desde $499 MXN/mes (menos que un café diario)</li>
                  <li>✓ <strong>Fácil de usar:</strong> Sin capacitación, intuitivo desde el día 1</li>
                  <li>✓ <strong>100% mexicano:</strong> Datos almacenados en México, cumplimiento total LFPDPPP</li>
                  <li>✓ <strong>Para consultorios pequeños:</strong> Diseñado para médicos independientes</li>
                  <li>✓ <strong>Facturación integrada:</strong> CFDI 4.0 nativo con el SAT</li>
                  <li>✓ <strong>NOM-004 compliant:</strong> Expediente clínico electrónico certificado</li>
                </ul>
              </div>

              <p>
                Hoy, miles de médicos en todo México confían en AgendaMedPro para gestionar sus consultorios, 
                desde dermatólogos en Guadalajara hasta pediatras en Monterrey y ginecólogos en la CDMX.
              </p>
            </div>
          </section>

          {/* Misión */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Nuestra Misión</h2>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-8 rounded-xl">
              <p className="text-lg text-gray-900 leading-relaxed">
                "Democratizar la tecnología médica en México, permitiendo que cada profesional de la salud 
                —sin importar su especialidad o ubicación— tenga acceso a herramientas digitales de clase 
                mundial para brindar mejor atención a sus pacientes."
              </p>
            </div>
          </section>

          {/* Visión */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Nuestra Visión</h2>
            </div>
            <div className="text-gray-700 space-y-3">
              <p>
                Para 2028, buscamos ser <strong>la plataforma número 1 en México para consultorios médicos independientes</strong>, 
                ayudando a más de 50,000 profesionales de la salud a:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Reducir tiempo administrativo en un 60%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Aumentar ingresos mensuales en promedio 25%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Mejorar satisfacción de pacientes mediante mejor comunicación</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Cumplir 100% con normativa mexicana (NOM-004, LFPDPPP, SAT)</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Valores */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Nuestros Valores</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-8 h-8 text-blue-600" />
                  <h3 className="font-bold text-gray-900">Privacidad Primero</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Los datos médicos son sagrados. Almacenamiento 100% en México, cifrado militar, 
                  cumplimiento total LFPDPPP. Tus datos nunca salen del país ni se venden a terceros.
                </p>
              </div>

              <div className="bg-green-50 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="w-8 h-8 text-green-600" />
                  <h3 className="font-bold text-gray-900">Empatía con el Usuario</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Entendemos que los médicos están ocupados. Por eso, cada función se diseña para ser 
                  intuitiva, sin necesidad de manuales ni capacitaciones largas.
                </p>
              </div>

              <div className="bg-purple-50 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-8 h-8 text-purple-600" />
                  <h3 className="font-bold text-gray-900">Innovación Continua</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Lanzamos nuevas funciones cada mes basadas en feedback real de nuestra comunidad médica. 
                  La mejora continua está en nuestro ADN.
                </p>
              </div>

              <div className="bg-amber-50 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-8 h-8 text-amber-600" />
                  <h3 className="font-bold text-gray-900">Comunidad Médica</h3>
                </div>
                <p className="text-sm text-gray-700">
                  No solo vendemos software. Construimos una comunidad donde médicos comparten mejores 
                  prácticas, aprenden y crecen juntos.
                </p>
              </div>
            </div>
          </section>

          {/* Equipo */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Nuestro Equipo</h2>
            </div>
            <div className="text-gray-700 space-y-4">
              <p>
                AgendaMedPro es desarrollado por un equipo multidisciplinario con sede en <strong>Monterrey, 
                Nuevo León</strong>, que combina experiencia en:
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white border-2 border-blue-200 rounded-lg p-5 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">👨‍💻</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Desarrollo</h3>
                  <p className="text-sm text-gray-600">
                    Ingenieros con 10+ años en SaaS y healthcare tech
                  </p>
                </div>

                <div className="bg-white border-2 border-green-200 rounded-lg p-5 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">⚕️</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Medicina</h3>
                  <p className="text-sm text-gray-600">
                    Médicos asesores que validan flujos clínicos
                  </p>
                </div>

                <div className="bg-white border-2 border-purple-200 rounded-lg p-5 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">⚖️</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Legal</h3>
                  <p className="text-sm text-gray-600">
                    Abogados especializados en salud digital y privacidad
                  </p>
                </div>

                <div className="bg-white border-2 border-amber-200 rounded-lg p-5 text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🎨</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Diseño UX/UI</h3>
                  <p className="text-sm text-gray-600">
                    Diseñadores enfocados en usabilidad médica
                  </p>
                </div>

                <div className="bg-white border-2 border-red-200 rounded-lg p-5 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Seguridad</h3>
                  <p className="text-sm text-gray-600">
                    Expertos en ciberseguridad y protección de datos
                  </p>
                </div>

                <div className="bg-white border-2 border-cyan-200 rounded-lg p-5 text-center">
                  <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">💬</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Soporte</h3>
                  <p className="text-sm text-gray-600">
                    Equipo dedicado 24/7 para asistir médicos
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Diferenciadores */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Por qué somos diferentes?</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                <span className="text-2xl">🇲🇽</span>
                <div>
                  <h3 className="font-semibold text-gray-900">100% Hecho en México, para México</h3>
                  <p className="text-sm text-gray-700">
                    No somos una solución genérica adaptada. Cada función está diseñada específicamente 
                    para el sistema de salud mexicano, con integración nativa SAT, NOM-004, y LFPDPPP.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <span className="text-2xl">💰</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Precio Transparente y Justo</h3>
                  <p className="text-sm text-gray-700">
                    Sin contratos anuales forzosos, sin comisiones ocultas, sin cobros por "implementación". 
                    Paga lo que usas, cancela cuando quieras.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <span className="text-2xl">🚀</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Setup en Minutos, No Meses</h3>
                  <p className="text-sm text-gray-700">
                    Crea tu cuenta, personaliza tu consultorio, y empieza a agendar citas en menos de 10 minutos. 
                    Sin instalaciones complejas ni capacitaciones eternas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                <span className="text-2xl">🤝</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Soporte Humano Real</h3>
                  <p className="text-sm text-gray-700">
                    Cuando tienes una duda, hablas con una persona real en México (no un chatbot). 
                    Soporte por WhatsApp, email y teléfono 7 días a la semana.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Reconocimientos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reconocimientos y Certificaciones</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">🏆 Startup del Año 2025</h3>
                <p className="text-sm text-gray-700">
                  Finalistas en la categoría HealthTech del premio nacional de startups tecnológicas
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">✓ Registro COFEPRIS</h3>
                <p className="text-sm text-gray-700">
                  Software médico certificado por COFEPRIS (en proceso de obtención)
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">🔒 ISO 27001</h3>
                <p className="text-sm text-gray-700">
                  Certificación en seguridad de la información (en proceso, estimado Q2 2026)
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">⭐ 4.8/5 Estrellas</h3>
                <p className="text-sm text-gray-700">
                  Calificación promedio de más de 500 médicos usuarios en nuestras encuestas
                </p>
              </div>
            </div>
          </section>

          {/* Roadmap */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Qué sigue? Roadmap 2025-2026</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-900">✅ Q4 2025 (En desarrollo)</h3>
                <ul className="text-sm text-gray-700 mt-2 space-y-1">
                  <li>• App móvil para médicos (iOS y Android)</li>
                  <li>• Telemedicina integrada con videollamadas HD</li>
                  <li>• Integración con laboratorios y farmacias</li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-900">🔵 Q1 2026 (Planeado)</h3>
                <ul className="text-sm text-gray-700 mt-2 space-y-1">
                  <li>• App para pacientes (agendar citas, ver resultados)</li>
                  <li>• Recordatorios automáticos por WhatsApp</li>
                  <li>• Firma electrónica avanzada FIEL del SAT</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-900">🟣 Q2-Q4 2026 (Investigación)</h3>
                <ul className="text-sm text-gray-700 mt-2 space-y-1">
                  <li>• IA para sugerencias de diagnóstico</li>
                  <li>• Marketplace de seguros médicos</li>
                  <li>• Expansión a otros países de LATAM</li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-8 rounded-2xl text-center">
            <h2 className="text-2xl font-bold mb-3">¿Quieres ser parte de nuestra historia?</h2>
            <p className="mb-6">
              Únete a miles de médicos que ya transformaron su práctica con AgendaMedPro
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/pricing"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Ver Planes y Precios
              </Link>
              <a 
                href="mailto:contacto@agendamedpro.com"
                className="inline-block bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-white"
              >
                Contactar Ventas
              </a>
            </div>
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
