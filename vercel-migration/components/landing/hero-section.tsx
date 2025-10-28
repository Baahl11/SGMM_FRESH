'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Clock, BarChart3 } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left column - Text content */}
          <div className="text-white">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium">🚀 Programa Beta • 15 días prueba gratis</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              La agenda médica
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                más completa
              </span>
              de México
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Gestiona tu clínica con <strong>4 vistas diferentes</strong>, horarios recurrentes, 
              excepciones automáticas y reportes en tiempo real. Todo en una sola plataforma.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="flex items-center gap-3 text-white/90">
                <Calendar className="w-5 h-5 text-yellow-300" />
                <span>4 Vistas de Agenda</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <Users className="w-5 h-5 text-yellow-300" />
                <span>Multi-Doctor</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <Clock className="w-5 h-5 text-yellow-300" />
                <span>Horarios Automáticos</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <BarChart3 className="w-5 h-5 text-yellow-300" />
                <span>Reportes Avanzados</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/signup">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 font-semibold shadow-xl hover:shadow-2xl transition-all"
                >
                  🎉 Prueba Gratis 15 Días
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 text-lg px-8 py-6 font-semibold"
                >
                  Iniciar Sesión →
                </Button>
              </Link>
            </div>

            {/* Value Props - Sin contratos, cancela cuando quieras */}
            <div className="mt-10 pt-10 border-t border-white/20">
              <p className="text-white/70 text-sm mb-4">Lo que realmente importa</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-white">
                  <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="font-semibold mb-1">Sin contratos</div>
                  <div className="text-sm text-white/70">Cancela cuando quieras</div>
                </div>
                <div className="text-white">
                  <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <div className="font-semibold mb-1">15 días prueba</div>
                  <div className="text-sm text-white/70">Pruébalo todo gratis</div>
                </div>
                <div className="text-white">
                  <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="font-semibold mb-1">Soporte incluido</div>
                  <div className="text-sm text-white/70">Respuesta {'<'} 24hrs</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Visual/Demo */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Mockup placeholder - puedes reemplazar con screenshot real */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <div className="text-center p-8">
                    <Calendar className="w-20 h-20 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium text-lg">Vista Previa de Agenda</p>
                    <p className="text-gray-400 text-sm mt-2">4 vistas diferentes • Multi-doctor • Tiempo real</p>
                  </div>
                </div>
                {/* Floating badges - Actualizado */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg text-sm">
                  🔒 SSL Seguro
                </div>
                <div className="absolute -bottom-4 -left-4 bg-blue-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg text-sm">
                  🇲🇽 Datos en México
                </div>
                <div className="absolute top-1/2 -right-6 bg-purple-500 text-white px-3 py-1.5 rounded-full font-semibold shadow-lg text-xs">
                  NOM-024 Compatible
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="text-white/50 text-center">
          <div className="text-sm mb-2">Descubre más</div>
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  )
}
