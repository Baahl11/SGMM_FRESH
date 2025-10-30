/**
 * Locked Slot Indicator Component
 * 
 * Indicador visual para slots bloqueados en el calendario
 */

'use client';

import React from 'react';
import { Lock, Clock, User } from 'lucide-react';
import { SlotLock } from '@/lib/utils/booking-lock';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LockedSlotIndicatorProps {
  lock: SlotLock;
  compact?: boolean;
  showTooltip?: boolean;
}

export function LockedSlotIndicator({ 
  lock, 
  compact = false,
  showTooltip = true 
}: LockedSlotIndicatorProps) {
  const now = Date.now();
  const timeRemaining = Math.max(0, lock.expiresAt - now);
  const secondsRemaining = Math.ceil(timeRemaining / 1000);
  
  // Determine status based on time remaining
  const isExpiring = secondsRemaining > 0 && secondsRemaining <= 15;
  const isExpired = secondsRemaining <= 0;
  
  // Style classes based on status
  const statusClass = isExpired 
    ? 'border-gray-300 bg-gray-50 text-gray-600'
    : isExpiring
    ? 'border-amber-300 bg-amber-50 text-amber-700 animate-pulse'
    : 'border-purple-300 bg-purple-50 text-purple-700';
  
  const iconClass = isExpired
    ? 'text-gray-500'
    : isExpiring
    ? 'text-amber-600'
    : 'text-purple-600';
  
  const indicator = compact ? (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border ${statusClass}`}>
      <Lock className={`h-3 w-3 ${iconClass}`} />
      {!isExpired && (
        <span className="text-xs font-medium">{secondsRemaining}s</span>
      )}
    </div>
  ) : (
    <div className={`flex items-start gap-3 p-3 rounded-lg border-2 ${statusClass}`}>
      <Lock className={`h-4 w-4 ${iconClass} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold">
            {isExpired ? 'Bloqueo Expirado' : 'Slot Bloqueado'}
          </span>
          {!isExpired && (
            <Badge variant="outline" className="text-xs">
              {secondsRemaining}s
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <User className="h-3 w-3" />
          <span className="truncate">{lock.lockedByName}</span>
        </div>
        {!isExpired && (
          <div className="flex items-center gap-2 text-xs mt-1 opacity-75">
            <Clock className="h-3 w-3" />
            <span>Expira en {secondsRemaining} segundos</span>
          </div>
        )}
      </div>
    </div>
  );
  
  if (!showTooltip || compact) {
    return indicator;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p><strong>Bloqueado por:</strong> {lock.lockedByName}</p>
            <p><strong>ID Usuario:</strong> {lock.lockedBy}</p>
            <p><strong>Bloqueado desde:</strong> {new Date(lock.lockedAt).toLocaleTimeString()}</p>
            <p><strong>Expira:</strong> {new Date(lock.expiresAt).toLocaleTimeString()}</p>
            <p><strong>Tiempo restante:</strong> {secondsRemaining}s</p>
            {lock.appointmentId && (
              <p><strong>Cita ID:</strong> {lock.appointmentId}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// LOCKED SLOT OVERLAY (para mostrar sobre el calendario)
// ============================================================================

interface LockedSlotOverlayProps {
  locks: SlotLock[];
  onLockClick?: (lock: SlotLock) => void;
}

export function LockedSlotOverlay({ locks, onLockClick }: LockedSlotOverlayProps) {
  if (locks.length === 0) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
        <Lock className="h-4 w-4" />
        <span>Slots Bloqueados Actualmente ({locks.length})</span>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {locks.map((lock) => (
          <div
            key={lock.id}
            onClick={() => onLockClick?.(lock)}
            className={`cursor-pointer hover:opacity-80 transition-opacity ${
              onLockClick ? 'cursor-pointer' : ''
            }`}
          >
            <LockedSlotIndicator lock={lock} compact={false} showTooltip={true} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MINI LOCK BADGE (para mostrar en esquina de slot)
// ============================================================================

interface LockBadgeProps {
  lock: SlotLock;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function LockBadge({ lock, position = 'top-right' }: LockBadgeProps) {
  const now = Date.now();
  const secondsRemaining = Math.ceil((lock.expiresAt - now) / 1000);
  const isExpiring = secondsRemaining > 0 && secondsRemaining <= 15;
  
  const positionClasses = {
    'top-left': 'top-1 left-1',
    'top-right': 'top-1 right-1',
    'bottom-left': 'bottom-1 left-1',
    'bottom-right': 'bottom-1 right-1',
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`absolute ${positionClasses[position]} z-10`}
          >
            <Badge 
              variant="secondary" 
              className={`gap-1 text-xs ${
                isExpiring 
                  ? 'bg-amber-100 text-amber-700 border-amber-300 animate-pulse' 
                  : 'bg-purple-100 text-purple-700 border-purple-300'
              }`}
            >
              <Lock className="h-3 w-3" />
              {secondsRemaining}s
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Bloqueado por {lock.lockedByName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
