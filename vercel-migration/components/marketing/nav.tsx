'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const links = [
  { label: 'Producto', href: '/#producto' },
  { label: 'Precios', href: '/#precios' },
  { label: 'Casos de éxito', href: '/casos-exito' },
]

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    handler()
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center">
      <nav
        className={`mt-4 flex w-[95%] max-w-6xl items-center justify-between rounded-full border px-6 py-3 text-white transition-all duration-300 ${
          scrolled
            ? 'border-white/20 bg-[#030614]/90 backdrop-blur-xl shadow-[0_20px_70px_rgba(3,6,20,0.65)]'
            : 'border-white/10 bg-white/5 backdrop-blur-md'
        }`}
      >
        <Link href="/" className="text-sm font-semibold tracking-[0.3em] uppercase text-white">
          AgendaMedPro
        </Link>
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
        </div>
      </nav>
    </div>
  )
}
