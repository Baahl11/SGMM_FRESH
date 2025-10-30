'use client';

import { useState, useCallback } from 'react';
import {
  RecurrencePattern,
  RecurringAppointment,
  generateSeriesId,
  generateRecurrenceDates,
  ModificationType
} from '@/lib/utils/recurring-appointments';
import { toast } from 'sonner';

interface UseRecurringAppointmentsOptions {
  onCreateSeries?: (appointments: any[]) => Promise<void>;
  onUpdateSeries?: (seriesId: string, modificationType: ModificationType, updates: any) => Promise<void>;
  onCancelSeries?: (seriesId: string, modificationType: ModificationType, fromDate?: string) => Promise<void>;
  onDeleteSeries?: (seriesId: string, modificationType: ModificationType, fromDate?: string) => Promise<void>;
}

export function useRecurringAppointments({
  onCreateSeries,
  onUpdateSeries,
  onCancelSeries,
  onDeleteSeries
}: UseRecurringAppointmentsOptions) {
  const [isCreatingSeries, setIsCreatingSeries] = useState(false);
  const [isModifyingSeries, setIsModifyingSeries] = useState(false);

  /**
   * Create a recurring appointment series
   */
  const createRecurringSeries = useCallback(async (
    baseAppointment: any,
    pattern: RecurrencePattern
  ) => {
    if (!onCreateSeries) {
      toast.error('Función de crear serie no configurada');
      return;
    }

    setIsCreatingSeries(true);

    try {
      // Generate series ID
      const seriesId = generateSeriesId();

      // Generate all dates for the series
      const dates = generateRecurrenceDates(baseAppointment.fecha, pattern);

      // Create appointment objects for each date
      const appointments = dates.map((date, index) => ({
        ...baseAppointment,
        fecha: date,
        recurring_series_id: seriesId,
        recurring_instance_index: index,
        recurring_pattern: pattern,
        is_recurring: true
      }));

      await onCreateSeries(appointments);

      toast.success('Serie creada', {
        description: `Se crearon ${appointments.length} citas recurrentes`
      });

      return seriesId;
    } catch (error) {
      console.error('Error creating recurring series:', error);
      toast.error('Error al crear serie recurrente');
      throw error;
    } finally {
      setIsCreatingSeries(false);
    }
  }, [onCreateSeries]);

  /**
   * Update a recurring appointment series
   */
  const updateRecurringSeries = useCallback(async (
    seriesId: string,
    modificationType: ModificationType,
    updates: any,
    currentDate?: string
  ) => {
    if (!onUpdateSeries) {
      toast.error('Función de actualizar serie no configurada');
      return;
    }

    setIsModifyingSeries(true);

    try {
      await onUpdateSeries(seriesId, modificationType, updates);

      const message = {
        'this-only': 'Cita actualizada',
        'this-and-following': 'Esta cita y las siguientes actualizadas',
        'all-in-series': 'Toda la serie actualizada'
      }[modificationType];

      toast.success(message);
    } catch (error) {
      console.error('Error updating recurring series:', error);
      toast.error('Error al actualizar la serie');
      throw error;
    } finally {
      setIsModifyingSeries(false);
    }
  }, [onUpdateSeries]);

  /**
   * Cancel a recurring appointment series
   */
  const cancelRecurringSeries = useCallback(async (
    seriesId: string,
    modificationType: ModificationType,
    fromDate?: string
  ) => {
    if (!onCancelSeries) {
      toast.error('Función de cancelar serie no configurada');
      return;
    }

    setIsModifyingSeries(true);

    try {
      await onCancelSeries(seriesId, modificationType, fromDate);

      const message = {
        'this-only': 'Cita cancelada',
        'this-and-following': 'Esta cita y las siguientes canceladas',
        'all-in-series': 'Toda la serie cancelada'
      }[modificationType];

      toast.success(message);
    } catch (error) {
      console.error('Error canceling recurring series:', error);
      toast.error('Error al cancelar la serie');
      throw error;
    } finally {
      setIsModifyingSeries(false);
    }
  }, [onCancelSeries]);

  /**
   * Delete a recurring appointment series
   */
  const deleteRecurringSeries = useCallback(async (
    seriesId: string,
    modificationType: ModificationType,
    fromDate?: string
  ) => {
    if (!onDeleteSeries) {
      toast.error('Función de eliminar serie no configurada');
      return;
    }

    setIsModifyingSeries(true);

    try {
      await onDeleteSeries(seriesId, modificationType, fromDate);

      const message = {
        'this-only': 'Cita eliminada',
        'this-and-following': 'Esta cita y las siguientes eliminadas',
        'all-in-series': 'Serie completa eliminada'
      }[modificationType];

      toast.success(message);
    } catch (error) {
      console.error('Error deleting recurring series:', error);
      toast.error('Error al eliminar la serie');
      throw error;
    } finally {
      setIsModifyingSeries(false);
    }
  }, [onDeleteSeries]);

  /**
   * Preview series before creating
   */
  const previewSeries = useCallback((
    startDate: string,
    pattern: RecurrencePattern
  ): string[] => {
    try {
      return generateRecurrenceDates(startDate, pattern, 10);
    } catch (error) {
      console.error('Error previewing series:', error);
      return [];
    }
  }, []);

  return {
    createRecurringSeries,
    updateRecurringSeries,
    cancelRecurringSeries,
    deleteRecurringSeries,
    previewSeries,
    isCreatingSeries,
    isModifyingSeries
  };
}
