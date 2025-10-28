import { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, Users, Calendar, Package, DollarSign, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Casos de Éxito | AgendaMedPro',
  description: 'Historias reales de médicos y clínicas que multiplicaron su eficiencia con AgendaMedPro',
}

const successStories = [
  {
    title: "Clínica Salud Integral: De Excel a sistema profesional en 2 semanas",
    clinic: "Clínica Multiespecialidad",
    doctors: 5,
    location: "Querétaro, Qro.",
    duration: "8 meses usando AgendaMedPro",
    image: "🏥",
    challenge: "Gestionar 5 doctores con Excel y papel generaba conflictos constantes de horarios, pérdida de citas, inventario descontrolado, y facturación manual que tomaba días.",
    solution: "Implementaron AgendaMedPro con calendario multi-doctor, inventario automático, facturación CFDI 4.0, y recordatorios por WhatsApp.",
    results: [
      { metric: "0 conflictos", description: "de agenda en 8 meses", icon: Calendar, color: "blue" },
      { metric: "+35%", description: "aumento en citas mensuales", icon: TrendingUp, color: "green" },
      { metric: "90%", description: "reducción en inasistencias", icon: Users, color: "purple" },
      { metric: "3h/día", description: "ahorro en tareas administrativas", icon: Clock, color: "orange" }
    ],
    testimonial: "Pasamos de caos total a organización perfecta. Ahora coordinamos 5 doctores sin un solo conflicto y nuestros pacientes aman los recordatorios por WhatsApp.",
    author: "Dr. Luis Hernández, Director Médico"
  },
  {
    title: "Dr. Carlos Mendoza: Duplicó su facturación optimizando agenda",
    clinic: "Consultorio Médico General",
    doctors: 1,
    location: "Puebla, Pue.",
    duration: "1 año usando AgendaMedPro",
    image: "👨‍⚕️",
    challenge: "Agenda desorganizada con muchos huecos vacíos por inasistencias. Inventario manual que consumía 2 horas diarias. Pérdida de pacientes por falta de seguimiento.",
    solution: "Implementó sistema de recordatorios automáticos, inventario automático, y reportes de ingresos para optimizar horarios pico.",
    results: [
      { metric: "+120%", description: "aumento en facturación anual", icon: DollarSign, color: "green" },
      { metric: "5%", description: "tasa de inasistencias (antes 30%)", icon: Users, color: "blue" },
      { metric: "95%", description: "ocupación de agenda", icon: Calendar, color: "purple" },
      { metric: "2h/día", description: "recuperadas para atender más pacientes", icon: Clock, color: "orange" }
    ],
    testimonial: "AgendaMedPro no solo me organizó, me hizo más rentable. Identifiqué mis horarios pico, reduje inasistencias, y ahora atiendo 40% más pacientes por semana.",
    author: "Dr. Carlos Mendoza"
  },
  {
    title: "Dra. Ana Martínez: Cero errores de medicación con inventario automático",
    clinic: "Consultorio Pediátrico",
    doctors: 3,
    location: "CDMX",
    duration: "6 meses usando AgendaMedPro",
    image: "👩‍⚕️",
    challenge: "Control manual de inventario generaba errores frecuentes: recetar medicamentos agotados, no detectar caducidades, pérdidas por mal conteo.",
    solution: "Implementó módulo de inventario con descuentos automáticos al usar productos en consulta, alertas de bajo stock, y control de caducidades.",
    results: [
      { metric: "0 errores", description: "de medicación por desabasto", icon: Package, color: "red" },
      { metric: "100%", description: "trazabilidad de cada producto", icon: TrendingUp, color: "green" },
      { metric: "$15,000", description: "ahorro mensual evitando caducidades", icon: DollarSign, color: "green" },
      { metric: "1.5h/día", description: "ahorro en conteo manual", icon: Clock, color: "orange" }
    ],
    testimonial: "Como pediatra no puedo darme el lujo de equivocarme con medicamentos. El inventario automático me da paz mental total y ha evitado pérdidas por caducidades.",
    author: "Dra. Ana Martínez"
  },
  {
    title: "Centro Médico del Valle: Coordinó 12 doctores sin administrador dedicado",
    clinic: "Clínica Multiespecialidad Grande",
    doctors: 12,
    location: "Toluca, Edomex",
    duration: "10 meses usando AgendaMedPro",
    image: "🏥",
    challenge: "12 especialistas en 6 consultorios generaban conflictos diarios. Tenían una persona dedicada solo a coordinar horarios. Pacientes se quejaban de esperas por mala organización.",
    solution: "Vista grid multi-doctor para ver disponibilidad de todos simultáneamente. Configuración de horarios automáticos por especialista con detección de conflictos.",
    results: [
      { metric: "$25,000", description: "ahorro mensual en coordinador", icon: DollarSign, color: "green" },
      { metric: "0 conflictos", description: "desde implementación", icon: Calendar, color: "blue" },
      { metric: "-60%", description: "reducción en tiempos de espera", icon: Clock, color: "orange" },
      { metric: "+50%", description: "mejora en satisfacción del paciente", icon: Users, color: "purple" }
    ],
    testimonial: "Gestionar 12 doctores era imposible sin software. AgendaMedPro nos ahorró el sueldo de un coordinador y mejoró dramáticamente la experiencia del paciente.",
    author: "Lic. María González, Gerente Administrativa"
  }
];

export default function CasosExitoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Casos de Éxito</h1>
          </div>
          <p className="text-xl text-green-100 max-w-3xl">
            📈 Historias reales de médicos y clínicas que transformaron sus consultorios con AgendaMedPro
          </p>
          <p className="text-sm text-green-200 mt-4">
            Resultados medidos y verificados • Implementación promedio: 2 semanas
          </p>
        </div>
      </div>

      {/* Success Stories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {successStories.map((story, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 border-b border-slate-200">
              <div className="flex items-start gap-6">
                <div className="text-6xl">{story.image}</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{story.title}</h2>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      🏥 <strong>{story.clinic}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      👨‍⚕️ <strong>{story.doctors} {story.doctors === 1 ? 'doctor' : 'doctores'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      📍 {story.location}
                    </span>
                    <span className="flex items-center gap-1">
                      ⏱️ {story.duration}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Challenge */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🚨</span> Desafío
                </h3>
                <p className="text-slate-700 leading-relaxed bg-red-50 p-4 rounded-lg border border-red-200">
                  {story.challenge}
                </p>
              </div>

              {/* Solution */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">💡</span> Solución
                </h3>
                <p className="text-slate-700 leading-relaxed bg-blue-50 p-4 rounded-lg border border-blue-200">
                  {story.solution}
                </p>
              </div>

              {/* Results Grid */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📊</span> Resultados Medidos
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {story.results.map((result, idx) => {
                    const Icon = result.icon;
                    const colorClasses: Record<string, string> = {
                      blue: 'from-blue-500 to-blue-600',
                      green: 'from-green-500 to-green-600',
                      purple: 'from-purple-500 to-purple-600',
                      orange: 'from-orange-500 to-orange-600',
                      red: 'from-red-500 to-red-600'
                    };
                    return (
                      <div
                        key={idx}
                        className={`bg-gradient-to-br ${colorClasses[result.color]} rounded-xl p-6 text-white text-center shadow-lg`}
                      >
                        <Icon className="w-8 h-8 mx-auto mb-3 opacity-80" />
                        <div className="text-3xl font-bold mb-1">{result.metric}</div>
                        <div className="text-sm opacity-90">{result.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
                <p className="text-slate-700 italic leading-relaxed mb-3">
                  "{story.testimonial}"
                </p>
                <p className="text-sm font-semibold text-blue-600">
                  — {story.author}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-bold mb-4">¿Listo para tu propia historia de éxito?</h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Implementación guiada en 2 semanas • Soporte personalizado • Resultados garantizados
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/#pricing"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors shadow-lg"
            >
              Ver Planes y Precios
            </Link>
            <a
              href="https://wa.me/522223404585?text=Hola,%20quiero%20una%20demo%20personalizada%20de%20AgendaMedPro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
            >
              📞 Agendar Demo Personalizada
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
