import Link from 'next/link'
import { WHATSAPP_SALES_URL } from '@/lib/marketing/constants'

const links = [
  { label: 'Producto', href: '/acerca-de' },
  { label: 'Casos de éxito', href: '/casos-exito' },
  { label: 'Documentación', href: '/documentacion' },
  { label: 'Soporte', href: '/soporte' },
  { label: 'Privacidad', href: '/privacidad' },
  { label: 'Términos', href: '/terminos' },
]

const contactActions = [
  {
    label: 'Hablar por WhatsApp',
    detail: 'Respuesta en menos de 15 minutos',
    href: WHATSAPP_SALES_URL,
  },
  {
    label: 'Soporte e implementación',
    detail: 'Acompañamiento técnico y operativo para tu clínica',
    href: '/soporte',
  },
]

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#01030a] py-16 text-white">
      <div className="mx-auto max-w-5xl space-y-8 px-6">
        <div className="grid gap-4 rounded-[32px] border border-white/10 bg-white/[0.02] p-6 text-white md:grid-cols-2">
          {contactActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              target={action.href.startsWith('http') ? '_blank' : undefined}
              rel={action.href.startsWith('http') ? 'noreferrer' : undefined}
              className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-left text-white transition-all hover:border-white/30"
            >
              <div>
                <p className="text-base font-semibold text-white">{action.label}</p>
                <p className="text-sm text-white/65">{action.detail}</p>
              </div>
              <span className="text-xl text-white/50">→</span>
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-6 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">AgendaMedPro</p>
            <p className="text-white/60">Operamos clínicas premium en México desde 2022.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {links.map((link) => (
              <Link key={link.label} href={link.href} className="text-white/70 hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-xs text-white/50">© {new Date().getFullYear()} AgendaMedPro. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
