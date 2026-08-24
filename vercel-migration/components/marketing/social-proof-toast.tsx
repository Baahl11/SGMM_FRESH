'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

interface Notification {
  id: number
  city: string
  specialty: string
  timeAgo: string
}

const CITIES = [
  'Ciudad de México', 'Monterrey', 'Guadalajara', 'Puebla', 'Querétaro',
  'Mérida', 'León', 'Tijuana', 'San Luis Potosí', 'Aguascalientes',
  'Cancún', 'Chihuahua', 'Saltillo', 'Veracruz', 'Hermosillo',
]

const SPECIALTIES = [
  'Clínica de medicina general',
  'Consultorio dental',
  'Clínica dermatológica',
  'Consultorio pediátrico',
  'Clínica de nutrición',
  'Consultorio ginecológico',
  'Clínica traumatológica',
  'Consultorio de cardiología',
  'Centro de medicina estética',
  'Consultorio oftalmológico',
]

const TIME_LABELS = ['hace 2 min', 'hace 5 min', 'hace 9 min', 'hace 12 min', 'hace 18 min']

let counter = 0

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function createNotification(): Notification {
  counter += 1
  return {
    id: counter,
    city: randomItem(CITIES),
    specialty: randomItem(SPECIALTIES),
    timeAgo: randomItem(TIME_LABELS),
  }
}

const INTERVAL_MS = 28000  // show every 28s
const VISIBLE_MS = 5000    // hide after 5s
const INITIAL_DELAY_MS = 8000 // first one after 8s

export function SocialProofToast() {
  const [notification, setNotification] = useState<Notification | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showNext() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    const n = createNotification()
    setNotification(n)
    hideTimer.current = setTimeout(() => setNotification(null), VISIBLE_MS)
  }

  useEffect(() => {
    const initial = setTimeout(() => {
      showNext()
      const interval = setInterval(showNext, INTERVAL_MS)
      return () => clearInterval(interval)
    }, INITIAL_DELAY_MS)

    return () => {
      clearTimeout(initial)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
   
  }, [])

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-6 z-[9990]"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        {notification && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="flex max-w-[280px] items-start gap-3 rounded-xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md"
          >
            <div className="mt-0.5 flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {notification.specialty}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {notification.city} se registró {notification.timeAgo}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
