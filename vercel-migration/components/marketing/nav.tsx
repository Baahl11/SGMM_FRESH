'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

const links = [
  { label: 'Producto', href: '/#producto' },
  { label: 'Precios', href: '/#precios' },
  { label: 'Casos de éxito', href: '/casos-exito' },
  { label: 'Calculadora', href: '/calculadora-inasistencias' },
]

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    handler()
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close mobile menu on route change / scroll
  useEffect(() => {
    if (mobileOpen) setMobileOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex flex-col items-center">
      <nav
        className={`mt-4 flex w-[95%] max-w-6xl items-center justify-between rounded-full border px-6 py-3 text-white transition-all duration-300 ${
          scrolled || mobileOpen
            ? 'border-white/20 bg-[#030614]/90 backdrop-blur-xl shadow-[0_20px_70px_rgba(3,6,20,0.65)]'
            : 'border-white/10 bg-white/5 backdrop-blur-md'
        }`}
      >
        <Link href="/" className="text-sm font-semibold tracking-[0.3em] uppercase text-white">
          AgendaMedPro
        </Link>
        {/* Desktop links */}
        <div className="hidden items-center gap-6 text-sm text-white/70 lg:flex">
          {links.map((link) => (
            <Link key={link.label} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/auth/signin"
            className="aura-cta aura-cta--ghost hidden h-10 px-6 text-sm sm:inline-flex"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/auth/signup"
            className="aura-cta aura-cta--primary h-10 px-6 text-sm"
          >
            Pruébalo gratis
          </Link>
          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="mt-2 w-[95%] max-w-6xl rounded-3xl border border-white/10 bg-[#030614]/95 px-6 py-5 backdrop-blur-xl shadow-[0_20px_70px_rgba(3,6,20,0.65)] lg:hidden">
          <div className="flex flex-col gap-4 text-sm text-white/80">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="border-b border-white/5 pb-4 hover:text-white last:border-0 last:pb-0"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/auth/signin"
              className="mt-1 text-white/60 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
