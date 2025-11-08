'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, CreditCard } from 'lucide-react'

export default function TrialBadge() {
  const router = useRouter()
  const supabase = createClient()
  const [trialInfo, setTrialInfo] = useState<{
    isTrialing: boolean
    daysLeft: number
    plan: string
  } | null>(null)

  useEffect(() => {
    const loadTrialInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (subscription && subscription.status === 'trialing' && subscription.trial_end_date) {
        const trialEnd = new Date(subscription.trial_end_date)
        const today = new Date()
        const daysLeft = Math.ceil((trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        setTrialInfo({
          isTrialing: true,
          daysLeft: Math.max(0, daysLeft),
          plan: subscription.plan || 'basico'
        })
      }
    }

    loadTrialInfo()

    // Refresh every hour
    const interval = setInterval(loadTrialInfo, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [supabase])

  if (!trialInfo || !trialInfo.isTrialing) {
    return null
  }

  const urgency = trialInfo.daysLeft <= 2

  return (
    <div className={`fixed top-4 right-4 z-50 ${urgency ? 'animate-pulse' : ''}`}>
      <div className="bg-white rounded-lg shadow-lg border-2 border-purple-200 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Clock className={`w-6 h-6 ${urgency ? 'text-orange-500' : 'text-purple-600'}`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={urgency ? 'bg-orange-500' : 'bg-purple-600'}>
                TRIAL
              </Badge>
              <span className="text-xs text-gray-500 uppercase">
                Plan {trialInfo.plan}
              </span>
            </div>
            
            <p className="text-sm font-semibold text-gray-900 mb-2">
              {trialInfo.daysLeft === 0 
                ? '¡Último día de prueba!' 
                : `${trialInfo.daysLeft} ${trialInfo.daysLeft === 1 ? 'día' : 'días'} restantes`
              }
            </p>
            
            {urgency && (
              <p className="text-xs text-gray-600 mb-3">
                No pierdas acceso. Agrega tu tarjeta ahora.
              </p>
            )}
            
            <Button 
              onClick={() => router.push('/select-trial-plan?reason=trial_expiring')}
              size="sm"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {urgency ? 'Agregar Tarjeta Ahora' : 'Activar Plan'}
            </Button>
          </div>
          
          <button 
            onClick={() => setTrialInfo(null)}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
