'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, Shield } from 'lucide-react'
import { WHATSAPP_SALES_URL } from '@/lib/marketing/constants'
import { trackCtaClick } from '@/lib/analytics/funnel-events'

const STORAGE_KEY = 'exit_intent_shown'
const DELAY_MS = 3000 // wait 3s before activating the listener

export function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false)
  const activated = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function dismiss() {
    setIsVisible(false)
    sessionStorage.setItem(STORAGE_KEY, '1')
  }

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem(STORAGE_KEY)) return

    function handleMouseLeave(e: MouseEvent) {
      // Only trigger when cursor exits through the top of the viewport
      if (e.clientY > 5) return
      if (activated.current) return
      activated.current = true
      setIsVisible(true)
      trackCtaClick('exit_intent', 'popup_shown')
    }

    // Activate listener after delay to avoid immediate popups
    timerRef.current = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave)
    }, DELAY_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="exit-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            key="exit-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed left-1/2 top-1/2 z-[9999] w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Urgency badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Oferta por tiempo limitado
            </div>

            <h2 className="mb-2 text-2xl font-bold text-white">
              ¡Un momento antes de irte!
            </h2>
            <p className="mb-6 text-slate-300">
              Prueba AgendaMedPro{' '}
              <span className="font-semibold text-emerald-400">14 días gratis</span> y
              descubre cuánto tiempo y dinero estás perdiendo con inasistencias.
            </p>

            {/* Value props */}
            <ul className="mb-6 space-y-2 text-sm text-slate-300">
              {[
                'Agenda inteligente con recordatorios por WhatsApp',
                'Facturación CFDI en 1 clic',
                'Sin tarjeta de crédito para empezar',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/register"
                onClick={() => {
                  trackCtaClick('exit_intent', 'register')
                  dismiss()
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90"
              >
                Empezar gratis
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={WHATSAPP_SALES_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackCtaClick('exit_intent', 'whatsapp_sales')
                  dismiss()
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-medium text-white transition-colors hover:bg-white/10"
              >
                Hablar con ventas
              </a>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <Shield className="h-3 w-3" />
              Sin spam. Sin compromisos. Cancel cuando quieras.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
