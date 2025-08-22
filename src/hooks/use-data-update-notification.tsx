"use client";

import { useEffect, useState } from 'react';

/**
 * Hook para mostrar notificaciones temporales cuando los datos se actualizan
 */
export function useDataUpdateNotification() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning';
    timestamp: number;
  }>>([]);

  useEffect(() => {
    const handleDataUpdate = (event: CustomEvent) => {
      const { entityType, action } = event.detail;
      
      const messages: { [key: string]: string } = {
        'patients-create': '👤 Nuevo paciente agregado - Datos actualizados',
        'patients-update': '✏️ Paciente actualizado - Datos actualizados', 
        'patients-delete': '🗑️ Paciente eliminado - Datos actualizados',
        'records-create': '📊 Nuevo registro agregado - Gráficas actualizadas',
        'records-update': '📈 Registro actualizado - Gráficas actualizadas',
        'records-delete': '📉 Registro eliminado - Gráficas actualizadas'
      };

      const messageKey = `${entityType}-${action}`;
      const message = messages[messageKey] || `🔄 ${entityType} ${action} - Datos actualizados`;

      const notification = {
        id: `${Date.now()}-${Math.random()}`,
        message,
        type: 'success' as const,
        timestamp: Date.now()
      };

      setNotifications(prev => [...prev, notification]);

      // Auto-remove después de 3 segundos
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 3000);
    };

    // Listener para eventos de actualización de datos
    window.addEventListener('data-update-notification' as any, handleDataUpdate);

    return () => {
      window.removeEventListener('data-update-notification' as any, handleDataUpdate);
    };
  }, []);

  const addNotification = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const notification = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 3000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    notifications,
    addNotification,
    removeNotification
  };
}

/**
 * Componente de notificaciones flotantes
 */
export function DataUpdateNotifications() {
  const { notifications, removeNotification } = useDataUpdateNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            bg-white border-l-4 rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ease-in-out
            ${notification.type === 'success' ? 'border-green-500' : ''}
            ${notification.type === 'info' ? 'border-blue-500' : ''}
            ${notification.type === 'warning' ? 'border-yellow-500' : ''}
            animate-in slide-in-from-right-full
          `}
          onClick={() => removeNotification(notification.id)}
          style={{ cursor: 'pointer' }}
        >
          <div className="flex items-center gap-3">
            <div className={`
              w-2 h-2 rounded-full
              ${notification.type === 'success' ? 'bg-green-500' : ''}
              ${notification.type === 'info' ? 'bg-blue-500' : ''}
              ${notification.type === 'warning' ? 'bg-yellow-500' : ''}
            `} />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
