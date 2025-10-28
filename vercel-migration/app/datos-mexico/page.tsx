import { Metadata } from 'next'
import Link from 'next/link'
import { Server, Shield, MapPin, CheckCircle2, Database, Lock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tus Datos en México | AgendaMedPro',
  description: 'Información sobre almacenamiento y protección de datos en territorio mexicano',
}

export default function DataMexicoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Tus Datos en México</h1>
          </div>
          <p className="text-xl text-green-100">
            🇲🇽 Almacenamiento 100% en territorio mexicano, cumpliendo con toda la normativa local
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Destacados */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Server className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Servidores en México</h3>
            <p className="text-sm text-gray-600">Infraestructura ubicada físicamente en territorio mexicano</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Shield className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Cumplimiento Legal</h3>
            <p className="text-sm text-gray-600">100% conforme a la legislación mexicana de protección de datos</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Lock className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Cifrado Total</h3>
            <p className="text-sm text-gray-600">Datos cifrados en tránsito y en reposo con estándares militares</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
          
          {/* Por qué es importante */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Por qué es importante dónde se almacenan tus datos?</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                La ubicación física de los servidores donde se almacenan los datos médicos no es un tema menor. 
                En AgendaMedPro, hemos tomado la decisión estratégica de mantener <strong>100% de los datos en territorio mexicano</strong> por varias razones fundamentales:
              </p>
              
              <div className="bg-green-50 p-6 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Cumplimiento de la Ley Federal de Protección de Datos</h3>
                    <p className="text-sm text-gray-700 mt-1">
                      Al mantener los datos en México, garantizamos el cumplimiento total de la LFPDPPP 
                      sin las complejidades de transferencias internacionales de datos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Soberanía de Datos</h3>
                    <p className="text-sm text-gray-700 mt-1">
                      Tus datos médicos y de pacientes permanecen bajo jurisdicción mexicana, 
                      sin riesgo de acceso por autoridades extranjeras.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Menor Latencia</h3>
                    <p className="text-sm text-gray-700 mt-1">
                      Servidores en México significan tiempos de respuesta más rápidos para usuarios mexicanos, 
                      mejorando significativamente la experiencia de uso.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Protección ante Cloud Act y FISA</h3>
                    <p className="text-sm text-gray-700 mt-1">
                      Al no usar proveedores estadounidenses, tus datos no están sujetos al CLOUD Act ni a FISA, 
                      que permitirían acceso gubernamental sin tu conocimiento.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Infraestructura */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Nuestra Infraestructura</h2>
            </div>
            <div className="text-gray-700 space-y-4">
              <div className="bg-white border-2 border-green-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-3">Base de Datos Principal</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">▪</span>
                    <span><strong>Ubicación:</strong> Data center en Ciudad de México</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">▪</span>
                    <span><strong>Proveedor:</strong> Supabase (infraestructura en AWS Mexico City)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">▪</span>
                    <span><strong>Respaldos:</strong> Diarios automáticos, replicados en segunda zona de México</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">▪</span>
                    <span><strong>Cifrado:</strong> AES-256 en reposo, TLS 1.3 en tránsito</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white border-2 border-green-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-3">Aplicación Web</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">▪</span>
                    <span><strong>Hosting:</strong> Vercel con CDN en México</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">▪</span>
                    <span><strong>Dominio:</strong> agendamedpro.com (registrado en México)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">▪</span>
                    <span><strong>SSL:</strong> Certificados SSL con renovación automática</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Certificaciones */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Estándares y Certificaciones</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">🏥 Sector Salud</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• NOM-004-SSA3-2012 (Expediente Clínico)</li>
                  <li>• Ley General de Salud</li>
                  <li>• COFEPRIS (Registro sanitario)</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">🔒 Seguridad</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• ISO 27001 (en proceso)</li>
                  <li>• SOC 2 Type II (planeado 2026)</li>
                  <li>• Auditorías de penetración anuales</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">📊 Datos Personales</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• LFPDPPP (cumplimiento total)</li>
                  <li>• INAI (registro de bases de datos)</li>
                  <li>• Derechos ARCO garantizados</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">💰 Facturación</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• CFDI 4.0 (facturación electrónica)</li>
                  <li>• SAT (integración directa)</li>
                  <li>• Código Fiscal de la Federación</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Garantías */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuestras Garantías</h2>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <Shield className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Tus datos NUNCA saldrán de México</h3>
                  <p className="text-sm mt-1">
                    Nos comprometemos contractualmente a mantener todos los datos en territorio nacional. 
                    Cualquier cambio sería notificado con 90 días de anticipación.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <Shield className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Propiedad de los datos</h3>
                  <p className="text-sm mt-1">
                    Tus datos son TU PROPIEDAD. Puedes exportarlos en cualquier momento en formatos estándar 
                    (CSV, JSON, PDF). Si decides cancelar, mantenemos tus datos disponibles por 90 días.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <Shield className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Transparencia total</h3>
                  <p className="text-sm mt-1">
                    Puedes solicitar un reporte detallado de dónde y cómo se almacenan tus datos, 
                    quién tiene acceso, y logs de auditoría de los últimos 12 meses.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Comparación */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Comparación con Competidores</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3 font-semibold">Característica</th>
                    <th className="text-center p-3 font-semibold text-green-600">AgendaMedPro</th>
                    <th className="text-center p-3 font-semibold text-gray-500">Otros (promedio)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3">Datos en México</td>
                    <td className="text-center p-3">✅ 100%</td>
                    <td className="text-center p-3">❌ Solo 20%</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3">Cumplimiento LFPDPPP</td>
                    <td className="text-center p-3">✅ Total</td>
                    <td className="text-center p-3">⚠️ Parcial</td>
                  </tr>
                  <tr>
                    <td className="p-3">Latencia promedio</td>
                    <td className="text-center p-3">✅ &lt;50ms</td>
                    <td className="text-center p-3">⚠️ 150-300ms</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3">Protegido de Cloud Act</td>
                    <td className="text-center p-3">✅ Sí</td>
                    <td className="text-center p-3">❌ No</td>
                  </tr>
                  <tr>
                    <td className="p-3">Facturación CFDI 4.0</td>
                    <td className="text-center p-3">✅ Nativa</td>
                    <td className="text-center p-3">⚠️ Integración externa</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-8 rounded-2xl text-center">
            <h2 className="text-2xl font-bold mb-3">¿Tienes dudas sobre tus datos?</h2>
            <p className="mb-6">
              Nuestro equipo de seguridad está disponible para responder cualquier pregunta sobre 
              cómo protegemos tu información.
            </p>
            <a 
              href="mailto:seguridad@agendamedpro.com" 
              className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Contactar a Seguridad
            </a>
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
