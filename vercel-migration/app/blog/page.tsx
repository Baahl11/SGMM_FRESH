import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Calendar, Clock, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog | AgendaMedPro',
  description: 'Guías, consejos y mejores prácticas para optimizar tu consultorio médico',
}

const blogPosts = [
  {
    title: "10 formas de reducir inasistencias en tu consultorio médico",
    excerpt: "Las inasistencias cuestan miles de pesos al mes. Descubre estrategias probadas para reducirlas hasta un 80% usando recordatorios automáticos, confirmaciones por WhatsApp, y políticas claras.",
    category: "Gestión",
    readTime: "8 min",
    date: "24 Octubre 2025",
    image: "📅",
    slug: "reducir-inasistencias-consultorio"
  },
  {
    title: "Cómo implementar expediente clínico electrónico cumpliendo la NOM-004",
    excerpt: "Guía completa para digitalizar tu consultorio cumpliendo con la NOM-004-SSA3-2012. Requisitos legales, estructura del expediente, y mejores prácticas de seguridad de datos médicos.",
    category: "Normatividad",
    readTime: "12 min",
    date: "20 Octubre 2025",
    image: "📋",
    slug: "expediente-electronico-nom-004"
  },
  {
    title: "Inventario automático: Nunca más te quedes sin insumos médicos",
    excerpt: "Sistema de alertas inteligentes, descuentos automáticos al usar productos en consulta, control de caducidades, y reportes de consumo. Ahorra 2-3 horas diarias en conteo manual.",
    category: "Optimización",
    readTime: "10 min",
    date: "18 Octubre 2025",
    image: "📦",
    slug: "inventario-automatico-medico"
  },
  {
    title: "WhatsApp Business para consultorios: Guía completa 2025",
    excerpt: "Cómo usar WhatsApp Business legalmente en tu consultorio. Recordatorios automáticos, confirmaciones de citas, y notificaciones de cambios que tus pacientes amarán.",
    category: "Tecnología",
    readTime: "15 min",
    date: "15 Octubre 2025",
    image: "💬",
    slug: "whatsapp-business-consultorios"
  },
  {
    title: "Facturación CFDI 4.0: Todo lo que necesitas saber como médico",
    excerpt: "Guía actualizada sobre facturación electrónica para profesionales de la salud. Requisitos del SAT, complementos de pago, catálogos de productos y servicios médicos.",
    category: "Fiscal",
    readTime: "10 min",
    date: "12 Octubre 2025",
    image: "🧾",
    slug: "facturacion-cfdi-medicos"
  },
  {
    title: "5 métricas clave que todo consultorio debe monitorear",
    excerpt: "Tasa de ocupación, ingresos por hora, costo de adquisición de pacientes, lifetime value, y tasa de retención. Cómo medir y mejorar la rentabilidad de tu consultorio.",
    category: "Análisis",
    readTime: "12 min",
    date: "8 Octubre 2025",
    image: "📊",
    slug: "metricas-clave-consultorio"
  },
  {
    title: "Gestión multi-doctor: Cómo coordinar varios especialistas sin caos",
    excerpt: "Mejores prácticas para clínicas con múltiples doctores. Configuración de horarios, manejo de consultorios compartidos, facturación individual, y reportes por médico.",
    category: "Gestión",
    readTime: "14 min",
    date: "5 Octubre 2025",
    image: "👥",
    slug: "gestion-multi-doctor"
  },
  {
    title: "Protección de datos médicos: LFPDPPP para consultorios",
    excerpt: "Cumplimiento de la Ley Federal de Protección de Datos Personales en tu consultorio. Aviso de privacidad, derechos ARCO, medidas de seguridad obligatorias.",
    category: "Legal",
    readTime: "11 min",
    date: "1 Octubre 2025",
    image: "🔒",
    slug: "proteccion-datos-medicos-lfpdppp"
  },
  {
    title: "Cómo aumentar la facturación de tu consultorio en 40%",
    excerpt: "Estrategias probadas: optimizar horarios pico, reducir huecos en agenda, implementar paquetes de tratamiento, mejorar seguimiento de pacientes, y análisis de rentabilidad.",
    category: "Crecimiento",
    readTime: "16 min",
    date: "28 Septiembre 2025",
    image: "💰",
    slug: "aumentar-facturacion-consultorio"
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Blog</h1>
          </div>
          <p className="text-xl text-purple-100 max-w-3xl">
            📚 Guías, consejos y mejores prácticas para optimizar tu consultorio médico
          </p>
          <p className="text-sm text-purple-200 mt-4">
            Artículos escritos por médicos y expertos en gestión de salud
          </p>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm">
              Todos
            </button>
            <button className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium text-sm transition-colors">
              Gestión
            </button>
            <button className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium text-sm transition-colors">
              Tecnología
            </button>
            <button className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium text-sm transition-colors">
              Normatividad
            </button>
            <button className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium text-sm transition-colors">
              Fiscal
            </button>
            <button className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium text-sm transition-colors">
              Legal
            </button>
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <article
              key={index}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 group cursor-not-allowed"
            >
              {/* Image/Icon */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-12 flex items-center justify-center border-b border-slate-200">
                <div className="text-8xl group-hover:scale-110 transition-transform duration-300">
                  {post.image}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Meta */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {post.title}
                </h2>

                {/* Excerpt */}
                <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Coming Soon Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-amber-600 text-sm font-semibold flex items-center gap-1">
                    <span className="animate-pulse">📝</span> Próximamente
                  </span>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white shadow-2xl">
          <div className="text-6xl mb-4">✍️</div>
          <h2 className="text-3xl font-bold mb-4">Blog en construcción</h2>
          <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
            Estamos preparando contenido de calidad para ayudarte a optimizar tu consultorio. 
            Los primeros artículos estarán disponibles en noviembre 2025.
          </p>
          <p className="text-blue-200 mb-8">
            ¿Hay algún tema específico que te gustaría que cubramos?
          </p>
          <a
            href="https://wa.me/522223404585?text=Hola,%20me%20gustaría%20sugerir%20un%20tema%20para%20el%20blog"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Sugerir un tema
          </a>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
          <h3 className="text-2xl font-bold text-slate-900 mb-4 text-center">
            📬 Suscríbete al Newsletter
          </h3>
          <p className="text-slate-600 text-center mb-6">
            Recibe guías, consejos y novedades directamente en tu correo
          </p>
          <form className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="tu@correo.com"
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled
            />
            <button
              type="button"
              disabled
              className="px-6 py-3 bg-slate-400 text-white font-semibold rounded-lg cursor-not-allowed"
            >
              Próximamente
            </button>
          </form>
        </div>
      </div>

      {/* Back to Home */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  )
}
