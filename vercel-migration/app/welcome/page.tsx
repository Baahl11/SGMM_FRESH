'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Sparkles, Calendar, Users, Settings, Stethoscope, Package } from 'lucide-react'
import Confetti from 'react-confetti'

type ChecklistItem = {
  id: string
  title: string
  description: string
  icon: any
  completed: boolean
  link: string
}

export default function WelcomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [showConfetti, setShowConfetti] = useState(true)
  const [trialDaysLeft, setTrialDaysLeft] = useState(7)
  const [userPlan, setUserPlan] = useState('Básico')
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'profile',
      title: 'Completa tu perfil',
      description: 'Añade información de tu consultorio',
      icon: Settings,
      completed: false,
      link: '/dashboard/settings'
    },
    {
      id: 'patient',
      title: 'Añade tu primer paciente',
      description: 'Crea el registro de un paciente',
      icon: Users,
      completed: false,
      link: '/patients/new'
    },
    {
      id: 'appointment',
      title: 'Agenda una cita',
      description: 'Prueba el sistema de agendamiento',
      icon: Calendar,
      completed: false,
      link: '/agenda'
    },
    {
      id: 'treatment',
      title: 'Crea un tratamiento',
      description: 'Define tus servicios y procedimientos',
      icon: Stethoscope,
      completed: false,
      link: '/treatments'
    },
    {
      id: 'inventory',
      title: 'Registra un producto de inventario',
      description: 'Controla tus insumos y existencias',
      icon: Package,
      completed: false,
      link: '/inventory'
    }
  ])

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/signin')
        return
      }

      // Fire welcome email (idempotent — does nothing if already sent)
      fetch('/api/email/welcome', { method: 'POST' }).catch(() => {})

      // Obtener subscripción para calcular días restantes
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_tier, trial_end')
        .eq('user_id', user.id)
        .maybeSingle()

      if (subscription?.trial_end) {
        const trialEnd = new Date(subscription.trial_end)
        const today = new Date()
        const daysLeft = Math.ceil((trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        setTrialDaysLeft(Math.max(0, daysLeft))
      }

      if (subscription?.plan_tier === 'pro') {
        setUserPlan('Pro')
      } else if (subscription?.plan_tier === 'enterprise') {
        setUserPlan('Enterprise')
      }

      // Check if user has completed any steps
      const { data: patients } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      const { data: appointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      const { data: treatments } = await supabase
        .from('treatments')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      const { data: inventoryItems } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      setChecklist(prev => prev.map(item => {
        if (item.id === 'patient' && patients && patients.length > 0) {
          return { ...item, completed: true }
        }
        if (item.id === 'appointment' && appointments && appointments.length > 0) {
          return { ...item, completed: true }
        }
        if (item.id === 'treatment' && treatments && treatments.length > 0) {
          return { ...item, completed: true }
        }
        if (item.id === 'inventory' && inventoryItems && inventoryItems.length > 0) {
          return { ...item, completed: true }
        }
        return item
      }))
    }

    loadUserData()

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [router, supabase])

  const completedCount = checklist.filter(item => item.completed).length
  const progress = (completedCount / checklist.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      {showConfetti && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 300}
          height={typeof window !== 'undefined' ? window.innerHeight : 200}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ¡Bienvenido a AgendaMedPro! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 mb-4">
            Tu prueba gratuita de <strong className="text-purple-600">7 días</strong> ha comenzado
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Badge className="bg-green-500 text-white px-4 py-2 text-sm">
              Plan {userPlan}
            </Badge>
            <Badge className="bg-blue-500 text-white px-4 py-2 text-sm">
              {trialDaysLeft} días restantes
            </Badge>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="p-6 mb-8 bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Tu Progreso
            </h2>
            <span className="text-sm text-gray-600">
              {completedCount} de {checklist.length} completados
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            {progress === 100 ? '¡Felicidades! Has completado todos los pasos 🎉' : 'Completa estos pasos para familiarizarte con AgendaMedPro'}
          </p>
        </Card>

        {/* Checklist */}
        <div className="space-y-4 mb-8">
          {checklist.map((item, index) => {
            const Icon = item.icon
            return (
              <Card 
                key={item.id}
                className={`p-6 transition-all hover:shadow-lg cursor-pointer ${
                  item.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white hover:border-purple-300'
                }`}
                onClick={() => !item.completed && router.push(item.link)}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    item.completed 
                      ? 'bg-green-500' 
                      : 'bg-purple-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      item.completed ? 'text-white' : 'text-purple-600'
                    }`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        Paso {index + 1}
                      </span>
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm">
                      {item.description}
                    </p>
                  </div>

                  {!item.completed && (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(item.link)
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Ir
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            size="lg"
          >
            Saltar Tutorial
          </Button>
          
          <Button
            onClick={() => router.push(checklist.find(item => !item.completed)?.link || '/dashboard')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
            size="lg"
          >
            {completedCount === 0 ? 'Comenzar' : 'Continuar'}
          </Button>
        </div>

        {/* Help Section */}
        <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-2">
            ¿Necesitas ayuda?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Estamos aquí para ayudarte a aprovechar al máximo tu prueba gratuita.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('mailto:soporte@agendamedpro.com')}
            >
              📧 Contactar Soporte
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/documentacion')}
            >
              📚 Ver Documentación
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
