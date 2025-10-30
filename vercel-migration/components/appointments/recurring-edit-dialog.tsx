'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertCircle, Calendar, CalendarRange, CalendarClock } from 'lucide-react';
import { ModificationType, MODIFICATION_TYPES } from '@/lib/utils/recurring-appointments';

interface RecurringEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentDate: string;
  actionType: 'edit' | 'cancel' | 'delete';
  onConfirm: (modificationType: ModificationType) => void;
  onCancel?: () => void;
}

export default function RecurringEditDialog({
  open,
  onOpenChange,
  appointmentDate,
  actionType,
  onConfirm,
  onCancel
}: RecurringEditDialogProps) {
  const [modificationType, setModificationType] = useState<ModificationType>('this-only');

  const handleConfirm = () => {
    onConfirm(modificationType);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const getTitle = () => {
    switch (actionType) {
      case 'edit':
        return '¿Editar esta cita o toda la serie?';
      case 'cancel':
        return '¿Cancelar esta cita o toda la serie?';
      case 'delete':
        return '¿Eliminar esta cita o toda la serie?';
    }
  };

  const getDescription = () => {
    const dateFormatted = new Date(appointmentDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    switch (actionType) {
      case 'edit':
        return `Esta cita del ${dateFormatted} forma parte de una serie recurrente. ¿Qué deseas modificar?`;
      case 'cancel':
        return `Esta cita del ${dateFormatted} forma parte de una serie recurrente. ¿Qué deseas cancelar?`;
      case 'delete':
        return `Esta cita del ${dateFormatted} forma parte de una serie recurrente. ¿Qué deseas eliminar?`;
    }
  };

  const getActionLabel = () => {
    switch (actionType) {
      case 'edit':
        return 'Editar';
      case 'cancel':
        return 'Cancelar';
      case 'delete':
        return 'Eliminar';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-purple-600" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={modificationType}
            onValueChange={(value) => setModificationType(value as ModificationType)}
            className="space-y-3"
          >
            {/* This Only */}
            <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="this-only" id="this-only" className="mt-1" />
              <div className="flex-1 cursor-pointer" onClick={() => setModificationType('this-only')}>
                <Label htmlFor="this-only" className="cursor-pointer font-medium flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  {MODIFICATION_TYPES['this-only']}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {actionType === 'edit' && 'Modifica solo esta cita, las demás de la serie permanecen sin cambios'}
                  {actionType === 'cancel' && 'Cancela solo esta cita, las demás continuarán'}
                  {actionType === 'delete' && 'Elimina solo esta cita de la serie'}
                </p>
              </div>
            </div>

            {/* This and Following */}
            <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="this-and-following" id="this-and-following" className="mt-1" />
              <div className="flex-1 cursor-pointer" onClick={() => setModificationType('this-and-following')}>
                <Label htmlFor="this-and-following" className="cursor-pointer font-medium flex items-center gap-2 mb-1">
                  <CalendarRange className="h-4 w-4 text-orange-600" />
                  {MODIFICATION_TYPES['this-and-following']}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {actionType === 'edit' && 'Modifica esta cita y todas las futuras de la serie'}
                  {actionType === 'cancel' && 'Cancela esta cita y todas las siguientes'}
                  {actionType === 'delete' && 'Elimina esta cita y todas las futuras'}
                </p>
              </div>
            </div>

            {/* All in Series */}
            <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="all-in-series" id="all-in-series" className="mt-1" />
              <div className="flex-1 cursor-pointer" onClick={() => setModificationType('all-in-series')}>
                <Label htmlFor="all-in-series" className="cursor-pointer font-medium flex items-center gap-2 mb-1">
                  <CalendarClock className="h-4 w-4 text-purple-600" />
                  {MODIFICATION_TYPES['all-in-series']}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {actionType === 'edit' && 'Modifica todas las citas de la serie, pasadas y futuras'}
                  {actionType === 'cancel' && 'Cancela todas las citas de la serie completa'}
                  {actionType === 'delete' && 'Elimina la serie completa de citas'}
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            variant={actionType === 'delete' ? 'destructive' : 'default'}
          >
            {getActionLabel()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
