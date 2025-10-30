"use client";

import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SmsReminder, REMINDER_STATUS_LABELS, getReminderStatusColor } from '@/lib/utils/sms-reminders';

interface SmsReminderBadgeProps {
  reminder?: SmsReminder;
  count?: number;
  showStatus?: boolean;
}

export function SmsReminderBadge({ reminder, count, showStatus = false }: SmsReminderBadgeProps) {
  if (!reminder && !count) return null;

  // If count is provided, show count badge
  if (count !== undefined) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 cursor-help flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {count} SMS
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{count} recordatorio(s) programado(s)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // If reminder is provided, show status badge
  if (reminder) {
    const statusLabel = REMINDER_STATUS_LABELS[reminder.status];
    const colorClass = getReminderStatusColor(reminder.status);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`${colorClass} cursor-help flex items-center gap-1 text-xs`}
            >
              <MessageSquare className="h-3 w-3" />
              {showStatus ? statusLabel : 'SMS'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p className="font-semibold">Recordatorio SMS</p>
              <p>Estado: {statusLabel}</p>
              <p>Envío: {reminder.timing}</p>
              {reminder.actual_send_time && (
                <p>
                  Enviado: {new Date(reminder.actual_send_time).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
              {reminder.confirmed_at && (
                <p className="text-green-600">✓ Confirmado por paciente</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}
