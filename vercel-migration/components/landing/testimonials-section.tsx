"use client";

import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Roberto Sánchez",
    role: "Beta Tester - Medicina General",
    clinic: "Consultorio Privado, CDMX",
    avatar: "RS",
    rating: 5,
    quote: "Estoy en el programa beta y me impresiona lo completo que es el sistema. Las 4 vistas de agenda son exactamente lo que necesitaba para coordinar mis dos consultorios. La configuración fue más rápida de lo esperado.",
    badge: "🧪 Early Adopter"
  },
  {
    name: "Dra. Ana Martínez",
    role: "Beta Tester - Pediatría",
    clinic: "Clínica Familiar, Monterrey",
    avatar: "AM",
    rating: 5,
    quote: "Probé el sistema durante la fase beta y la función de horarios automáticos me ahorra mucho tiempo. Configuras una vez y se replica automáticamente. El soporte del equipo ha sido excelente.",
    badge: "🧪 Early Adopter"
  },
  {
    name: "Dr. Miguel Torres",
    role: "Beta Tester - Cirugía General",
    clinic: "Hospital Privado, Guadalajara",
    avatar: "MT",
    rating: 5,
    quote: "Como parte del programa beta, puedo decir que es el sistema más intuitivo que he probado. La vista de timeline por consultorio es perfecta para coordinar procedimientos. Esperando con ansias el lanzamiento oficial.",
    badge: "🧪 Early Adopter"
  }
];

export function TestimonialsSection() {
  return (
    <section className="relative py-24 bg-gradient-to-br from-white via-blue-50/30 to-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium bg-blue-100 text-blue-700 rounded-full">
            <Star className="w-4 h-4 mr-2 fill-current" />
            Programa Beta Activo
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Lo que dicen nuestros{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              beta testers
            </span>
          </h2>
          
          <p className="text-xl text-slate-600 leading-relaxed">
            Doctores reales probando AgendaMedPro antes del lanzamiento oficial. Sus comentarios nos ayudan a crear el mejor software médico de México.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-blue-300"
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 left-8 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <Quote className="w-5 h-5 text-white" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4 pt-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-slate-700 mb-6 leading-relaxed italic">
                "{testimonial.quote}"
              </blockquote>

              {/* Badge */}
              <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full mb-6">
                {testimonial.badge}
              </div>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                {/* Avatar placeholder with initials */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {testimonial.avatar}
                </div>
                
                <div>
                  <div className="font-semibold text-slate-900">{testimonial.name}</div>
                  <div className="text-sm text-slate-600">{testimonial.role}</div>
                  <div className="text-xs text-slate-500">{testimonial.clinic}</div>
                </div>
              </div>

              {/* Hover effect gradient border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10" />
            </div>
          ))}
        </div>

        {/* Value Props Footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center justify-center gap-8 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
            <div>
              <div className="text-2xl font-bold text-slate-900 mb-1">🚀 Beta</div>
              <div className="text-sm text-slate-600">Programa activo</div>
            </div>
            <div className="w-px h-12 bg-slate-300" />
            <div>
              <div className="text-2xl font-bold text-slate-900 mb-1">7 días</div>
              <div className="text-sm text-slate-600">Prueba gratis</div>
            </div>
            <div className="w-px h-12 bg-slate-300" />
            <div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{'<'} 24h</div>
              <div className="text-sm text-slate-600">Soporte técnico</div>
            </div>
            <div className="w-px h-12 bg-slate-300" />
            <div>
              <div className="text-2xl font-bold text-slate-900 mb-1">100%</div>
              <div className="text-sm text-slate-600">Datos en México</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
