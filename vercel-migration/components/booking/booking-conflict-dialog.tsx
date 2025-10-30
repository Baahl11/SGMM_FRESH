/**
 * Booking Conflict Dialog Component
 * 
 * Diálogo para mostrar y resolver conflictos de reserva
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Lock, 
  Calendar,
  Clock,
  User,
  Shield,
  RefreshCw,
  X
} from 'lucide-react';
import { BookingConflict } from '@/lib/utils/booking-lock';

interface BookingConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflict: BookingConflict | null;
  onRetry?: () => void;
  onCancel?: () => void;
  onOverride?: () => void;
  isRetrying?: boolean;
}

export function BookingConflictDialog({
  open,
  onOpenChange,
  conflict,
  onRetry,
  onCancel,
  onOverride,
  isRetrying = false,
}: BookingConflictDialogProps) {
  if (!conflict) return null;
  
  const getConflictIcon = () => {
    switch (conflict.conflictType) {
      case 'slot-locked':
        return <Lock className="h-6 w-6 text-purple-600" />;
      case 'double-booking':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case 'buffer-conflict':
        return <Clock className="h-6 w-6 text-amber-600" />;
      case 'version-mismatch':
        return <RefreshCw className="h-6 w-6 text-blue-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-gray-600" />;
    }
  };
  
  const getConflictColor = () => {
    switch (conflict.conflictType) {
      case 'slot-locked':
        return 'purple';
      case 'double-booking':
        return 'red';
      case 'buffer-conflict':
        return 'amber';
      case 'version-mismatch':
        return 'blue';
      default:
        return 'gray';
    }
  };
  
  const getConflictTitle = () => {
    switch (conflict.conflictType) {
      case 'slot-locked':
        return 'Slot Temporalmente Bloqueado';
      case 'double-booking':
        return 'Conflicto de Reserva Doble';
      case 'buffer-conflict':
        return 'Conflicto de Buffer Time';
      case 'version-mismatch':
        return 'Datos Desactualizados';
      default:
        return 'Conflicto de Reserva';
    }
  };
  
  const color = getConflictColor();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 bg-${color}-100 rounded-lg`}>
              {getConflictIcon()}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{getConflictTitle()}</DialogTitle>
              <Badge 
                variant="secondary" 
                className={`mt-1 bg-${color}-100 text-${color}-700 border-${color}-300`}
              >
                {conflict.conflictType}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-base">
            {conflict.message}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          
          {/* Conflict Details */}
          <Alert className={`bg-${color}-50 border-${color}-200`}>
            <AlertDescription>
              <div className="space-y-2 text-sm">
                
                {/* Slot Time */}
                {conflict.slotTime && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 opacity-70" />
                    <span className="font-medium">Horario:</span>
                    <span>{new Date(conflict.slotTime).toLocaleString()}</span>
                  </div>
                )}
                
                {/* Doctor */}
                {conflict.doctorId && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 opacity-70" />
                    <span className="font-medium">Doctor ID:</span>
                    <span className="font-mono text-xs">{conflict.doctorId}</span>
                  </div>
                )}
                
                {/* Existing Appointment */}
                {conflict.existingAppointment && (
                  <div className="pt-2 border-t border-current/20">
                    <p className="font-semibold mb-1">Cita Existente:</p>
                    <div className="pl-4 space-y-1">
                      <p><strong>Paciente:</strong> {conflict.existingAppointment.patientName}</p>
                      <p><strong>Inicio:</strong> {new Date(conflict.existingAppointment.startTime).toLocaleTimeString()}</p>
                      <p><strong>Fin:</strong> {new Date(conflict.existingAppointment.endTime).toLocaleTimeString()}</p>
                    </div>
                  </div>
                )}
                
                {/* Lock Info */}
                {conflict.lockInfo && (
                  <div className="pt-2 border-t border-current/20">
                    <p className="font-semibold mb-1">Información del Bloqueo:</p>
                    <div className="pl-4 space-y-1">
                      <p><strong>Bloqueado por:</strong> {conflict.lockInfo.lockedByName}</p>
                      <p><strong>Expira en:</strong> {Math.ceil(conflict.lockInfo.expiresIn / 1000)} segundos</p>
                    </div>
                  </div>
                )}
                
              </div>
            </AlertDescription>
          </Alert>
          
          {/* Recommendations */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Recomendaciones
            </h4>
            
            {conflict.conflictType === 'slot-locked' && (
              <ul className="text-sm space-y-1 pl-6 list-disc">
                <li>Espera {conflict.lockInfo ? Math.ceil(conflict.lockInfo.expiresIn / 1000) : '60'} segundos a que expire el bloqueo</li>
                <li>El otro usuario puede estar completando la reserva</li>
                <li>Puedes reintentar o seleccionar otro horario</li>
              </ul>
            )}
            
            {conflict.conflictType === 'double-booking' && (
              <ul className="text-sm space-y-1 pl-6 list-disc">
                <li>Ya existe una cita confirmada en este horario</li>
                <li>Selecciona otro horario disponible</li>
                <li>Verifica buffer time entre citas</li>
              </ul>
            )}
            
            {conflict.conflictType === 'buffer-conflict' && (
              <ul className="text-sm space-y-1 pl-6 list-disc">
                <li>Este horario está dentro del buffer time de otra cita</li>
                <li>Selecciona un horario con suficiente separación</li>
                <li>Revisa la configuración de buffer time si es necesario</li>
              </ul>
            )}
            
            {conflict.conflictType === 'version-mismatch' && (
              <ul className="text-sm space-y-1 pl-6 list-disc">
                <li>Los datos fueron actualizados por otro usuario</li>
                <li>Recarga la página para ver los datos más recientes</li>
                <li>Reintenta la operación con datos actualizados</li>
              </ul>
            )}
          </div>
          
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          
          {/* Cancel Button */}
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
          
          {/* Retry Button */}
          {onRetry && conflict.conflictType !== 'double-booking' && (
            <Button
              variant="secondary"
              onClick={onRetry}
              disabled={isRetrying}
              className="w-full sm:w-auto"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reintentando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </>
              )}
            </Button>
          )}
          
          {/* Override Button (Admin only) */}
          {onOverride && conflict.canOverride && (
            <Button
              variant="destructive"
              onClick={onOverride}
              className="w-full sm:w-auto"
            >
              <Shield className="h-4 w-4 mr-2" />
              Forzar (Admin)
            </Button>
          )}
          
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// SIMPLER TOAST NOTIFICATION VERSION
// ============================================================================

export function showConflictToast(conflict: BookingConflict) {
  // This would use the toast library
  // Included here as a reference for quick notifications
  const { toast } = require('sonner');
  
  const getIcon = () => {
    switch (conflict.conflictType) {
      case 'slot-locked':
        return '🔒';
      case 'double-booking':
        return '⚠️';
      case 'buffer-conflict':
        return '⏱️';
      case 'version-mismatch':
        return '🔄';
      default:
        return '❌';
    }
  };
  
  toast.error(`${getIcon()} ${conflict.message}`, {
    duration: 5000,
    description: conflict.lockInfo 
      ? `Bloqueado por ${conflict.lockInfo.lockedByName}, expira en ${Math.ceil(conflict.lockInfo.expiresIn / 1000)}s`
      : undefined,
  });
}
