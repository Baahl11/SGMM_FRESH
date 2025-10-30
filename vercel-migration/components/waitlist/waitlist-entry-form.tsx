"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Clock, User, Stethoscope, AlertCircle } from 'lucide-react';
import {
  WaitlistEntry,
  WaitlistPriority,
  PRIORITY_CONFIG,
  DAYS_OF_WEEK,
  generateWaitlistId
} from '@/lib/utils/waitlist';

interface WaitlistEntryFormProps {
  onSubmit: (entry: Omit<WaitlistEntry, 'id' | 'created_at' | 'status'>) => void;
  onCancel?: () => void;
  patientId?: number;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
}

export function WaitlistEntryForm({
  onSubmit,
  onCancel,
  patientId,
  patientName: initialPatientName,
  patientPhone: initialPhone,
  patientEmail: initialEmail
}: WaitlistEntryFormProps) {
  const [patientName, setPatientName] = useState(initialPatientName || '');
  const [patientPhone, setPatientPhone] = useState(initialPhone || '');
  const [patientEmail, setPatientEmail] = useState(initialEmail || '');
  const [priority, setPriority] = useState<WaitlistPriority>('normal');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredDates, setPreferredDates] = useState<Date[]>([]);
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  const [preferredDaysOfWeek, setPreferredDaysOfWeek] = useState<number[]>([]);
  const [autoBook, setAutoBook] = useState(false);
  const [expirationDays, setExpirationDays] = useState('30');

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim()) {
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expirationDays));

    const entry: Omit<WaitlistEntry, 'id' | 'created_at' | 'status'> = {
      patient_id: patientId || 0,
      patient_name: patientName.trim(),
      patient_phone: patientPhone.trim() || undefined,
      patient_email: patientEmail.trim() || undefined,
      priority,
      reason: reason.trim() || undefined,
      notes: notes.trim() || undefined,
      preferred_dates: preferredDates.length > 0
        ? preferredDates.map(d => d.toISOString().split('T')[0])
        : undefined,
      preferred_times: preferredTimes.length > 0 ? preferredTimes : undefined,
      preferred_days_of_week: preferredDaysOfWeek.length > 0 ? preferredDaysOfWeek : undefined,
      auto_book: autoBook,
      expires_at: expiresAt.toISOString()
    };

    onSubmit(entry);
  };

  const toggleTime = (time: string) => {
    setPreferredTimes(prev =>
      prev.includes(time)
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const toggleDayOfWeek = (day: number) => {
    setPreferredDaysOfWeek(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información del Paciente
          </CardTitle>
          <CardDescription>
            Datos básicos del paciente en lista de espera
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="patientName">Nombre del Paciente *</Label>
            <Input
              id="patientName"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Nombre completo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patientPhone">Teléfono</Label>
              <Input
                id="patientPhone"
                type="tel"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+52 123 456 7890"
              />
            </div>

            <div>
              <Label htmlFor="patientEmail">Correo Electrónico</Label>
              <Input
                id="patientEmail"
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="paciente@ejemplo.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority and Reason */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Prioridad y Motivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="priority">Nivel de Prioridad *</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as WaitlistPriority)}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-${config.color}-600`}>
                        {config.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {config.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Motivo de Consulta</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Consulta de seguimiento"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cualquier información adicional relevante..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Preferencias de Horario
          </CardTitle>
          <CardDescription>
            Opcional: Especifica fechas, horarios o días preferidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Fechas Preferidas</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {preferredDates.length > 0
                    ? `${preferredDates.length} fecha(s) seleccionada(s)`
                    : 'Seleccionar fechas'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="multiple"
                  selected={preferredDates}
                  onSelect={(dates) => setPreferredDates(dates || [])}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            {preferredDates.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {preferredDates.map((date, idx) => (
                  <Badge key={idx} variant="secondary">
                    {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Horarios Preferidos</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  type="button"
                  variant={preferredTimes.includes(time) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleTime(time)}
                  className="text-xs"
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Días de la Semana Preferidos</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {DAYS_OF_WEEK.map((day) => (
                <Button
                  key={day.value}
                  type="button"
                  variant={preferredDaysOfWeek.includes(day.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleDayOfWeek(day.value)}
                >
                  {day.label.substring(0, 3)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Agendar Automáticamente</Label>
              <p className="text-sm text-muted-foreground">
                Cuando se libere un espacio coincidente, agendar sin confirmación
              </p>
            </div>
            <Checkbox
              checked={autoBook}
              onCheckedChange={(checked) => setAutoBook(checked as boolean)}
            />
          </div>

          <div>
            <Label htmlFor="expirationDays">Expiración (días)</Label>
            <Select value={expirationDays} onValueChange={setExpirationDays}>
              <SelectTrigger id="expirationDays">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 días</SelectItem>
                <SelectItem value="15">15 días</SelectItem>
                <SelectItem value="30">30 días</SelectItem>
                <SelectItem value="60">60 días</SelectItem>
                <SelectItem value="90">90 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit">
          Agregar a Lista de Espera
        </Button>
      </div>
    </form>
  );
}
