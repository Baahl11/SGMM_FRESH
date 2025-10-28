'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { Footer } from '@/components/landing/footer'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showLanding, setShowLanding] = useState(false)

  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (session) {
      // User is authenticated, redirect directly to dashboard
      router.push('/dashboard')
    } else {
      // User is not authenticated, show landing page
      setShowLanding(true)
    }
  }, [session, status, router])

  // Show loading screen while checking authentication
  if (status === 'loading' || !showLanding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 mx-auto mb-8">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-white/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">AgendaMedPro</h1>
          <p className="text-xl text-white/80 mb-8">Sistema de Gestión Médica</p>
          <div className="text-white/60">
            {status === 'loading' ? 'Verificando autenticación...' : 'Redirigiendo...'}
          </div>
        </div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <Footer />
    </main>
  )
}
