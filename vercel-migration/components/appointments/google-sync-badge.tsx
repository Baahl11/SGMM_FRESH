'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GoogleSyncBadgeProps {
  synced: boolean;
  eventId?: string;
  className?: string;
}

export function GoogleSyncBadge({ synced, eventId, className = '' }: GoogleSyncBadgeProps) {
  if (!synced) return null;

  const badge = (
    <Badge
      variant="outline"
      className={`bg-blue-100 text-blue-800 border-blue-300 text-xs ${className}`}
    >
      <Calendar className="h-3 w-3 mr-1" />
      Google
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            Sincronizado con Google Calendar
            {eventId && <span className="block text-xs opacity-70">ID: {eventId.slice(0, 8)}...</span>}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
