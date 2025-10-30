"use client";

import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { WaitlistEntry, STATUS_LABELS, getStatusColorClass } from '@/lib/utils/waitlist';

interface WaitlistBadgeProps {
  entry?: WaitlistEntry;
  showStatus?: boolean;
}

export function WaitlistBadge({ entry, showStatus = false }: WaitlistBadgeProps) {
  if (!entry) return null;

  const statusLabel = STATUS_LABELS[entry.status];
  const colorClass = getStatusColorClass(entry.status);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${colorClass} cursor-help flex items-center gap-1 text-xs`}
          >
            <Clock className="h-3 w-3" />
            {showStatus ? statusLabel : 'Lista de Espera'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p className="font-semibold">En Lista de Espera</p>
            <p>Estado: {statusLabel}</p>
            {entry.priority && (
              <p>Prioridad: {entry.priority}</p>
            )}
            {entry.created_at && (
              <p>Desde: {new Date(entry.created_at).toLocaleDateString('es-ES')}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
