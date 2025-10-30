'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Repeat } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getRecurrenceDescription, RecurrencePattern } from '@/lib/utils/recurring-appointments';

interface RecurringBadgeProps {
  pattern?: RecurrencePattern;
  className?: string;
  showTooltip?: boolean;
}

export function RecurringBadge({ pattern, className = '', showTooltip = true }: RecurringBadgeProps) {
  const badge = (
    <Badge
      variant="outline"
      className={`bg-purple-100 text-purple-800 border-purple-300 text-xs ${className}`}
    >
      <Repeat className="h-3 w-3 mr-1" />
      Serie
    </Badge>
  );

  if (!showTooltip || !pattern) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{getRecurrenceDescription(pattern)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
