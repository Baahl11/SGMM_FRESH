import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

const variantStyles = {
  indigo: 'from-indigo-500/20 via-indigo-500/5 to-indigo-500/0 border-indigo-400/30',
  emerald: 'from-emerald-400/20 via-emerald-400/5 to-emerald-400/0 border-emerald-300/30',
  violet: 'from-violet-400/20 via-violet-400/5 to-violet-400/0 border-violet-300/30',
  amber: 'from-amber-400/25 via-amber-400/5 to-amber-400/0 border-amber-300/30',
  orange: 'from-orange-400/25 via-orange-400/5 to-orange-400/0 border-orange-300/30',
  teal: 'from-sky-400/25 via-sky-400/5 to-sky-400/0 border-sky-300/30'
} as const

const toneStyles = {
  positive: 'text-emerald-300 bg-emerald-400/10 border-emerald-300/20',
  neutral: 'text-white/70 bg-white/5 border-white/10',
  warning: 'text-amber-200 bg-amber-400/10 border-amber-300/30',
  negative: 'text-rose-200 bg-rose-400/10 border-rose-300/30'
} as const

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  hint?: string
  value: string | number
  icon: LucideIcon
  variant?: keyof typeof variantStyles
  trendLabel?: string
  trendTone?: keyof typeof toneStyles
  footer?: ReactNode
}

export function MetricCard({
  title,
  hint,
  value,
  icon: Icon,
  variant = 'indigo',
  trendLabel,
  trendTone = 'neutral',
  footer,
  className,
  ...props
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'glass-panel relative overflow-hidden rounded-[28px] border px-5 py-6 transition-transform hover:-translate-y-1',
        'bg-gradient-to-br text-white/90 shadow-[0_20px_80px_rgba(2,6,23,0.35)]',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">{title}</p>
          {hint && <p className="mt-1 text-sm text-white/70">{hint}</p>}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-6 text-4xl font-semibold text-white">
        {typeof value === 'number' ? value.toLocaleString('es-MX') : value}
      </div>
      {trendLabel && (
        <span className={cn('mt-4 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs', toneStyles[trendTone])}>
          {trendLabel}
        </span>
      )}
      {footer && <div className="mt-4 text-sm text-white/80">{footer}</div>}
    </div>
  )
}
