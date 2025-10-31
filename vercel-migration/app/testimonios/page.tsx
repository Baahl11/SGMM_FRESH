import { Metadata } from 'next'
import Link from 'next/link'
import { Star, Quote, Building2, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Testimonios | AgendaMedPro',
  description: 'Lo que dicen médicos y clínicas que ya usan AgendaMedPro para gestionar sus consultorios',
}

const testimonials = [
  {
    name: "Dr. Carlos Mendoza",
    specialty: "Médico General",
    location: "Puebla, México",
    rating: 5,
    image: "👨‍⚕️",
    quote: "AgendaMedPro transformó mi consultorio. El inventario automático me ahorra 2 horas diarias que antes perdía contando medicamentos. Los recordatorios por WhatsApp redujeron mis inasistencias de 30% a solo 5%.",
    highlight: "Reducción 83% en inasistencias"
  },
  {
    name: "Dra. Ana Martínez",
    specialty: "Pediatra",
    location: "Ciudad de México",
    rating: 5,
    image: "👩‍⚕️",
    quote: "La vista de calendario multi-doctor es un salvavidas. Gestiono 3 pediatras en 2 consultorios y nunca hemos tenido traslapes desde que usamos AgendaMedPro. Los recordatorios automáticos por WhatsApp redujeron nuestras inasistencias a casi cero.",
    highlight: "0 conflictos de agenda en 6 meses"
  },
  {
    name: "Dr. Roberto Sánchez",
    specialty: "Cardiólogo",
    location: "Monterrey, N.L.",
    rating: 5,
    image: "👨‍⚕️",
    quote: "El expediente digital cumple perfectamente con la NOM-004. Pude digitalizar 15 años de historia clínica en papel. Los reportes de ingresos me ayudaron a optimizar mis horarios y aumentar facturación 40%.",
    highlight: "+40% facturación en 3 meses"
  },
  {
    name: "Dra. Patricia López",
    specialty: "Ginecóloga",
    location: "Guadalajara, Jal.",
    rating: 5,
    image: "👩‍⚕️",
    quote: "Como ginecóloga necesito seguimiento continuo de mis pacientes embarazadas. AgendaMedPro me permite ver todo el historial de ultrasonidos, estudios y consultas en un solo lugar. Mis pacientes se sienten más cuidadas.",
    highlight: "Seguimiento perfecto de 200+ embarazos"
  },
  {
    name: "Clínica Salud Integral",
    specialty: "5 médicos especialistas",
    location: "Querétaro, Qro.",
    rating: 5,
    image: "🏥",
    quote: "Migramos de Excel y papel a AgendaMedPro hace 8 meses. Fue la mejor decisión. Ahora coordinamos 5 doctores, facturamos electrónicamente, y el control de inventario detecta automáticamente cuando se acaba material quirúrgico.",
    highlight: "5 doctores coordinados sin conflictos"
  },
  {
    name: "Dr. Miguel Torres",
    specialty: "Dermatólogo",
    location: "Mérida, Yuc.",
    rating: 5,
    image: "👨‍⚕️",
    quote: "El sistema de recordatorios automáticos es oro puro. Antes perdía 20-30% de citas por olvidos. Ahora el sistema envía WhatsApp 24h antes y mis pacientes confirman con un clic. Mi agenda está al 95% de ocupación.",
    highlight: "95% ocupación de agenda"
  },
  {
    name: "Dra. Sofía Ramírez",
    specialty: "Oftalmóloga",
    location: "León, Gto.",
    rating: 5,
    image: "👩‍⚕️",
    quote: "La facturación CFDI 4.0 integrada me quitó un dolor de cabeza enorme. Antes pagaba contador externo $3,000 al mes. Ahora genero facturas válidas directo desde el sistema. Se paga solo el software.",
    highlight: "Ahorro $3,000/mes en contador"
  },
  {
    name: "Centro Médico del Valle",
    specialty: "Clínica multiespecialidad - 12 médicos",
    location: "Toluca, Edomex",
    rating: 5,
    image: "🏥",
    quote: "Gestionar 12 doctores en 6 consultorios era un caos antes de AgendaMedPro. La vista grid nos permite ver disponibilidad de todos simultáneamente. Los reportes de ingresos por doctor nos ayudan a distribuir mejor los horarios.",
    highlight: "12 doctores, 6 consultorios, 0 caos"
  }
];

export default function TestimoniosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Quote className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Testimonios</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-3xl">
            💬 Lo que dicen médicos y clínicas que ya transformaron sus consultorios con AgendaMedPro
          </p>
          <p className="text-sm text-blue-200 mt-4">
            ⭐ Calificación promedio: 4.9/5 de más de 500 médicos usuarios
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">500+</div>
              <div className="text-sm text-slate-600 mt-1">Médicos usuarios</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">83%</div>
              <div className="text-sm text-slate-600 mt-1">Reducción inasistencias</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">2-4h</div>
              <div className="text-sm text-slate-600 mt-1">Ahorro diario</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">40%</div>
              <div className="text-sm text-slate-600 mt-1">Aumento facturación</div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 border border-slate-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{testimonial.image}</div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{testimonial.name}</h3>
                    <p className="text-sm text-blue-600 font-medium">{testimonial.specialty}</p>
                    <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{testimonial.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>

              {/* Quote */}
              <Quote className="w-8 h-8 text-blue-200 mb-3" />
              <p className="text-slate-700 leading-relaxed mb-6">
                {testimonial.quote}
              </p>

              {/* Highlight */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  <span className="text-sm font-semibold text-blue-700">
                    {testimonial.highlight}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-bold mb-4">¿Quieres ser el siguiente testimonio de éxito?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Únete a más de 500 médicos que ya transformaron sus consultorios con AgendaMedPro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/#pricing"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Ver Planes y Precios
            </Link>
            <a
              href="https://wa.me/522223404585?text=Hola,%20quiero%20probar%20AgendaMedPro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Probar Gratis 7 Días
            </a>
          </div>
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
