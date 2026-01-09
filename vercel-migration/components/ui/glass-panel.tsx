import * as React from 'react'
import { cn } from '@/lib/utils'

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {}

export function GlassPanel({ className, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'glass-panel text-white/95 shadow-[0_25px_120px_rgba(2,6,23,0.45)] border-white/10',
        className
      )}
      {...props}
    />
  )
}
