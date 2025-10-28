'use client';

/**
 * NotificationList Component
 * Displays list of notifications with actions
 * Phase 3.3 - Notifications & Reminders
 */

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types/notifications';
import { NOTIFICATION_ICONS, NOTIFICATION_CATEGORY_LABELS } from '@/lib/types/notifications';

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationList({ notifications, onMarkAsRead, onDelete }: NotificationListProps) {
  const handleClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    // Navigate to action URL
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'reminder':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="divide-y">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            'p-4 hover:bg-muted/50 transition-colors relative group',
            !notification.read && 'bg-blue-50/50'
          )}
        >
          {/* Delete button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
          >
            <X className="h-4 w-4" />
          </Button>

          <div
            className="cursor-pointer pr-8"
            onClick={() => handleClick(notification)}
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-1">
              <span className="text-2xl">
                {NOTIFICATION_ICONS[notification.type as keyof typeof NOTIFICATION_ICONS]}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={cn(
                    'text-sm font-medium',
                    !notification.read && 'font-semibold'
                  )}>
                    {notification.title}
                  </h4>
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 mt-2 ml-11">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded border',
                getTypeColor(notification.type)
              )}>
                {NOTIFICATION_CATEGORY_LABELS[notification.category as keyof typeof NOTIFICATION_CATEGORY_LABELS]}
              </span>
              
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>

              {notification.action_url && (
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
