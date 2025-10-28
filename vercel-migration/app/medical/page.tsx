'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppLayout from "@/components/layout/app-layout"

export default function MedicalDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // If authenticated, show content or redirect directly
  if (session) {
    router.push('/dashboard')
    return null
  }

  // Show loading while redirecting
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-24 h-24 mx-auto mb-8">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-white/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">SGMM Pro</h1>
        <p className="text-xl text-white/80 mb-8">Sistema de Gestión Médica</p>
        <div className="text-white/60">
          Redirigiendo al dashboard...
        </div>
        </div>
      </div>
    </AppLayout>
  )
}

