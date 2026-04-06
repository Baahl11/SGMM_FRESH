'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, X } from 'lucide-react'
import { trackCtaClick } from '@/lib/analytics/funnel-events'

// Replace this with the real YouTube/Vimeo video ID when the demo is recorded
const VIDEO_ID = process.env.NEXT_PUBLIC_DEMO_VIDEO_ID ?? ''

export function VideoDemo() {
  const [open, setOpen] = useState(false)

  const handleOpen = () => {
    trackCtaClick('demo_video', 'youtube')
    setOpen(true)
  }

  return (
    <section id="demo" className="bg-[#030614] py-20 text-white">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-emerald-300/80">
            Producto real
          </p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Descubre cómo funciona
          </h2>
          <p className="mt-4 text-white/60">
            Ve cómo 3 citas pierden en promedio 4 horas administrativas — y cómo AgendaMedPro las recupera.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10"
        >
          {/* Video thumbnail / placeholder */}
          <div
            className="group relative mx-auto cursor-pointer overflow-hidden rounded-3xl border border-white/10"
            style={{ aspectRatio: '16/9', maxWidth: 768 }}
            onClick={VIDEO_ID ? handleOpen : undefined}
            role={VIDEO_ID ? 'button' : undefined}
            aria-label="Ver demo de AgendaMedPro"
          >
            {/* Gradient background without actual video until ID is set */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d0f2a] to-[#060a1e]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
              <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-white/10">
                {/* Simulated agenda screenshot */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 p-4">
                  <div className="mb-2 flex gap-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((d) => (
                      <div key={d} className="flex-1 rounded-lg bg-white/10 py-1.5 text-center text-xs text-white/60">{d}</div>
                    ))}
                  </div>
                  {[['09:00', 'Sandra M.', 'Botox', 'emerald'], ['10:30', 'Ricardo P.', 'PRP', 'sky'], ['13:00', 'Paola O.', 'Relleno', 'violet']].map(([time, name, tx, color]) => (
                    <div key={time} className={`mb-1.5 rounded-lg border border-${color}-400/20 bg-${color}-400/10 px-3 py-2 text-xs`}>
                      <span className={`font-semibold text-${color}-300`}>{time}</span>
                      <span className="ml-2 text-white/80">{name}</span>
                      <span className="ml-1 text-white/40">· {tx}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Play button overlay */}
            {VIDEO_ID && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/20 transition-all group-hover:scale-110 group-hover:bg-white/25">
                  <Play className="ml-1 h-8 w-8 fill-white text-white" />
                </div>
              </div>
            )}

            {/* "Próximamente" badge if no video yet */}
            {!VIDEO_ID && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs text-white/60 backdrop-blur">
                Demo completo próximamente · Mientras tanto, agenda una demo por WhatsApp
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal for actual video */}
      {open && VIDEO_ID && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-3xl overflow-hidden"
            style={{ aspectRatio: '16/9' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
              aria-label="Cerrar video"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="h-full w-full"
              title="Demo AgendaMedPro"
            />
          </div>
        </div>
      )}
    </section>
  )
}
