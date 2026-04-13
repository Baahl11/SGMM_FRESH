'use client'

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'group toast backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/20 shadow-2xl rounded-2xl',
          title: 'text-white font-semibold',
          description: 'text-white/70',
          actionButton: 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg',
          cancelButton: 'bg-white/10 text-white/80 rounded-lg',
          closeButton: 'bg-white/10 text-white/80 border-white/20',
          success: 'border-emerald-400/40 bg-gradient-to-br from-emerald-400/15 via-emerald-500/10 to-transparent shadow-emerald-500/20',
          error: 'border-red-400/40 bg-gradient-to-br from-red-400/15 via-red-500/10 to-transparent shadow-red-500/20',
          warning: 'border-amber-400/40 bg-gradient-to-br from-amber-400/15 via-amber-500/10 to-transparent shadow-amber-500/20',
          info: 'border-blue-400/40 bg-gradient-to-br from-blue-400/15 via-blue-500/10 to-transparent shadow-blue-500/20',
        },
      }}
      richColors
      closeButton
    />
  )
}
