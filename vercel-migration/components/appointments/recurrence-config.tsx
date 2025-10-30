'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Repeat, Info, Calendar } from 'lucide-react';
import {
  RecurrencePattern,
  RecurrenceFrequency,
  RecurrenceEndType,
  getRecurrenceDescription,
  validateRecurrencePattern,
  getNextOccurrencesPreview,
  RECURRENCE_PRESETS
} from '@/lib/utils/recurring-appointments';

interface RecurrenceConfigProps {
  startDate: string; // YYYY-MM-DD
  currentPattern?: RecurrencePattern;
  onPatternChange: (pattern: RecurrencePattern | null) => void;
  onCancel?: () => void;
}

export default function RecurrenceConfig({
  startDate,
  currentPattern,
  onPatternChange,
  onCancel
}: RecurrenceConfigProps) {
  const [enabled, setEnabled] = useState(Boolean(currentPattern));
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    currentPattern?.frequency || 'weekly'
  );
  const [interval, setInterval] = useState(currentPattern?.interval || 1);
  const [endType, setEndType] = useState<RecurrenceEndType>(
    currentPattern?.endType || 'after'
  );
  const [occurrences, setOccurrences] = useState(currentPattern?.occurrences || 10);
  const [endDate, setEndDate] = useState(currentPattern?.endDate || '');
  const [dayOfMonth, setDayOfMonth] = useState(currentPattern?.dayOfMonth || 1);

  // Update pattern when settings change
  useEffect(() => {
    if (!enabled) {
      onPatternChange(null);
      return;
    }

    const pattern: RecurrencePattern = {
      frequency,
      interval,
      endType,
      ...(endType === 'after' && { occurrences }),
      ...(endType === 'on-date' && { endDate }),
      ...(frequency === 'monthly' && { dayOfMonth })
    };

    const validation = validateRecurrencePattern(pattern);
    if (validation.valid) {
      onPatternChange(pattern);
    }
  }, [enabled, frequency, interval, endType, occurrences, endDate, dayOfMonth, onPatternChange]);

  const currentPatternObject: RecurrencePattern | null = enabled
    ? {
        frequency,
        interval,
        endType,
        ...(endType === 'after' && { occurrences }),
        ...(endType === 'on-date' && { endDate }),
        ...(frequency === 'monthly' && { dayOfMonth })
      }
    : null;

  const validation = currentPatternObject
    ? validateRecurrencePattern(currentPatternObject)
    : { valid: true };

  const preview = currentPatternObject && validation.valid
    ? getNextOccurrencesPreview(startDate, currentPatternObject, 5)
    : [];

  const handlePresetSelect = (presetIndex: number) => {
    const preset = RECURRENCE_PRESETS[presetIndex];
    if (preset.pattern.frequency) setFrequency(preset.pattern.frequency);
    if (preset.pattern.interval) setInterval(preset.pattern.interval);
    if (preset.pattern.endType) setEndType(preset.pattern.endType);
    if (preset.pattern.occurrences) setOccurrences(preset.pattern.occurrences);
    setEnabled(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-purple-600" />
            <CardTitle>Cita Recurrente</CardTitle>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
        <CardDescription>
          Crea una serie de citas que se repiten automáticamente
        </CardDescription>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-6">
          {/* Quick Presets */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Patrones comunes</Label>
            <div className="flex flex-wrap gap-2">
              {RECURRENCE_PRESETS.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect(index)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Frequency Selection */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Frecuencia</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}>
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="biweekly">Quincenal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interval */}
          {(frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly' || frequency === 'custom') && (
            <div className="space-y-2">
              <Label htmlFor="interval">
                Repetir cada
                {frequency === 'daily' && ' días'}
                {frequency === 'weekly' && ' semanas'}
                {frequency === 'monthly' && ' meses'}
                {frequency === 'custom' && ' días'}
              </Label>
              <Input
                id="interval"
                type="number"
                min={1}
                max={365}
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                className="w-24"
              />
            </div>
          )}

          {/* Day of Month for Monthly */}
          {frequency === 'monthly' && (
            <div className="space-y-2">
              <Label htmlFor="dayOfMonth">Día del mes</Label>
              <Input
                id="dayOfMonth"
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">
                Si el mes no tiene este día, se usará el último día del mes
              </p>
            </div>
          )}

          {/* End Condition */}
          <div className="space-y-3">
            <Label>Finalizar</Label>
            <RadioGroup value={endType} onValueChange={(v) => setEndType(v as RecurrenceEndType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="never" id="never" />
                <Label htmlFor="never" className="font-normal cursor-pointer">
                  Nunca (sin fecha fin)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="after" id="after" />
                <Label htmlFor="after" className="font-normal cursor-pointer">
                  Después de
                </Label>
                {endType === 'after' && (
                  <Input
                    type="number"
                    min={2}
                    max={100}
                    value={occurrences}
                    onChange={(e) => setOccurrences(parseInt(e.target.value) || 2)}
                    className="w-20 ml-2"
                  />
                )}
                {endType === 'after' && <span className="text-sm">citas</span>}
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="on-date" id="on-date" />
                <Label htmlFor="on-date" className="font-normal cursor-pointer">
                  En la fecha
                </Label>
                {endType === 'on-date' && (
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="ml-2"
                  />
                )}
              </div>
            </RadioGroup>
          </div>

          {/* Validation Error */}
          {!validation.valid && validation.error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">{validation.error}</p>
            </div>
          )}

          {/* Preview */}
          {validation.valid && currentPatternObject && (
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-medium text-purple-900">
                    {getRecurrenceDescription(currentPatternObject)}
                  </p>
                  
                  {preview.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-purple-800 font-medium">
                        Próximas {preview.length} citas:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {preview.map((date, index) => {
                          const dateObj = new Date(date);
                          const formatted = dateObj.toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short'
                          });
                          return (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-purple-100 text-purple-800 border-purple-300"
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatted}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {onCancel && (
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (validation.valid && currentPatternObject) {
                    onPatternChange(currentPatternObject);
                  }
                }}
                disabled={!validation.valid}
              >
                Aplicar Recurrencia
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
