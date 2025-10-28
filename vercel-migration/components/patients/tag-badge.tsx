"use client"

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PatientTag } from '@/types/patient-tags'

interface TagBadgeProps {
  tag: PatientTag
  onRemove?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function TagBadge({ tag, onRemove, className, size = 'md' }: TagBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        'transition-all duration-200',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${tag.color}20`,
        color: tag.color,
        border: `1px solid ${tag.color}40`
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 rounded-full hover:bg-black/10 p-0.5 transition-colors"
          aria-label={`Remove ${tag.name} tag`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
