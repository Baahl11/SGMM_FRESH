"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Clock, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Save,
  X,
  AlertCircle,
  Calendar
} from "lucide-react";

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  blocked?: boolean;
  reason?: string;
  recurring?: boolean;
  recurringDays?: number[]; // 0-6 (Sunday-Saturday)
}

interface BlockedPeriod {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  recurring: boolean;
  recurringDays?: number[];
}

interface TimeSlotManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSlotUpdate: (slots: TimeSlot[]) => void;
}

export default function TimeSlotManager({ 
  isOpen, 
  onClose, 
  selectedDate,
  onSlotUpdate 
}: TimeSlotManagerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [workingHours, setWorkingHours] = useState({
    start: "08:00",
    end: "18:00",
    slotDuration: 30, // minutes
    breakTime: 60, // lunch break duration
    breakStart: "13:00"
  });
  
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [newBlock, setNewBlock] = useState({
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    reason: "",
    recurring: false,
    recurringDays: [] as number[]
  });

  const daysOfWeek = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" }
  ];

  useEffect(() => {
    if (isOpen) {
      loadWorkingHours();
      generateTimeSlots();
      loadBlockedPeriods();
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    if (isOpen) {
      generateTimeSlots();
    }
  }, [workingHours]);

  const loadWorkingHours = () => {
    // Load from localStorage
    const saved = localStorage.getItem('working-hours');
    if (saved) {
      try {
        const parsedHours = JSON.parse(saved);
        setWorkingHours(parsedHours);
      } catch (error) {
        console.error('Error loading working hours:', error);
      }
    }
  };

  const saveWorkingHours = (hours: typeof workingHours) => {
    localStorage.setItem('working-hours', JSON.stringify(hours));
    setWorkingHours(hours);
  };

  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const date = new Date(selectedDate);
    
    // Parse working hours
    const [startHour, startMinute] = workingHours.start.split(":").map(Number);
    const [endHour, endMinute] = workingHours.end.split(":").map(Number);
    const [breakHour, breakMinute] = workingHours.breakStart.split(":").map(Number);
    
    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    const breakStart = new Date(date);
    breakStart.setHours(breakHour, breakMinute, 0, 0);
    
    const breakEnd = new Date(breakStart);
    breakEnd.setTime(breakStart.getTime() + (workingHours.breakTime * 60 * 1000));

    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      
      // Check if this slot is during break time
      const isBreakTime = currentTime >= breakStart && currentTime < breakEnd;
      
      // Check if this slot is blocked
      const isBlocked = isSlotBlocked(currentTime);
      
      slots.push({
        id: `${date.toISOString().split('T')[0]}-${timeString}`,
        time: timeString,
        available: !isBreakTime && !isBlocked,
        blocked: isBlocked,
        reason: isBlocked ? getBlockReason(currentTime) : undefined
      });
      
      // Add slot duration
      currentTime.setTime(currentTime.getTime() + (workingHours.slotDuration * 60 * 1000));
    }
    
    setTimeSlots(slots);
  };

  const isSlotBlocked = (time: Date): boolean => {
    return blockedPeriods.some(period => {
      const slotDate = time.toISOString().split('T')[0];
      const slotTime = time.toTimeString().slice(0, 5);
      
      if (period.recurring && period.recurringDays) {
        const dayOfWeek = time.getDay();
        if (!period.recurringDays.includes(dayOfWeek)) {
          return false;
        }
      } else {
        if (slotDate < period.startDate || slotDate > period.endDate) {
          return false;
        }
      }
      
      return slotTime >= period.startTime && slotTime <= period.endTime;
    });
  };

  const getBlockReason = (time: Date): string => {
    const period = blockedPeriods.find(period => {
      const slotDate = time.toISOString().split('T')[0];
      const slotTime = time.toTimeString().slice(0, 5);
      
      if (period.recurring && period.recurringDays) {
        const dayOfWeek = time.getDay();
        if (!period.recurringDays.includes(dayOfWeek)) {
          return false;
        }
      } else {
        if (slotDate < period.startDate || slotDate > period.endDate) {
          return false;
        }
      }
      
      return slotTime >= period.startTime && slotTime <= period.endTime;
    });
    
    return period?.reason || "Bloqueado";
  };

  const loadBlockedPeriods = () => {
    // Load from localStorage or API
    const saved = localStorage.getItem('blocked-periods');
    if (saved) {
      setBlockedPeriods(JSON.parse(saved));
    }
  };

  const saveBlockedPeriods = (periods: BlockedPeriod[]) => {
    localStorage.setItem('blocked-periods', JSON.stringify(periods));
    setBlockedPeriods(periods);
  };

  const handleCreateBlock = () => {
    if (!newBlock.startTime || !newBlock.endTime || !newBlock.reason) {
      return;
    }

    const block: BlockedPeriod = {
      id: Date.now().toString(),
      startDate: newBlock.startDate || selectedDate.toISOString().split('T')[0],
      endDate: newBlock.endDate || selectedDate.toISOString().split('T')[0],
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      reason: newBlock.reason,
      recurring: newBlock.recurring,
      recurringDays: newBlock.recurringDays
    };

    const updatedPeriods = [...blockedPeriods, block];
    saveBlockedPeriods(updatedPeriods);
    
    setNewBlock({
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      reason: "",
      recurring: false,
      recurringDays: []
    });
    setShowBlockDialog(false);
    generateTimeSlots();
  };

  const handleDeleteBlock = (blockId: string) => {
    const updatedPeriods = blockedPeriods.filter(period => period.id !== blockId);
    saveBlockedPeriods(updatedPeriods);
    generateTimeSlots();
  };

  const handleSlotToggle = (slotId: string) => {
    const updatedSlots = timeSlots.map(slot => {
      if (slot.id === slotId) {
        return { ...slot, available: !slot.available };
      }
      return slot;
    });
    setTimeSlots(updatedSlots);
  };

  const handleSave = () => {
    saveWorkingHours(workingHours);
    generateTimeSlots();
    onSlotUpdate(timeSlots);
    onClose();
  };

  const handleRecurringDayToggle = (day: number) => {
    const current = newBlock.recurringDays || [];
    const updated = current.includes(day) 
      ? current.filter(d => d !== day)
      : [...current, day];
    
    setNewBlock({ ...newBlock, recurringDays: updated });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-gradient-to-br from-white/95 via-white/90 to-white/95 border border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <Clock className="h-5 w-5 text-purple-600" />
              Gestión de Horarios - {selectedDate.toLocaleDateString('es-ES')}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Working Hours Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuración de Horarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Hora Inicio</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={workingHours.start}
                      onChange={(e) => saveWorkingHours({...workingHours, start: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">Hora Fin</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={workingHours.end}
                      onChange={(e) => saveWorkingHours({...workingHours, end: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="slot-duration">Duración Cita (min)</Label>
                    <Input
                      id="slot-duration"
                      type="number"
                      value={workingHours.slotDuration}
                      onChange={(e) => saveWorkingHours({...workingHours, slotDuration: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="break-start">Inicio Descanso</Label>
                    <Input
                      id="break-start"
                      type="time"
                      value={workingHours.breakStart}
                      onChange={(e) => saveWorkingHours({...workingHours, breakStart: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="break-duration">Duración Descanso (min)</Label>
                  <Input
                    id="break-duration"
                    type="number"
                    value={workingHours.breakTime}
                    onChange={(e) => saveWorkingHours({...workingHours, breakTime: parseInt(e.target.value)})}
                  />
                </div>

                <Button 
                  onClick={() => setShowBlockDialog(true)}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Bloquear Período
                </Button>
              </CardContent>
            </Card>

            {/* Time Slots */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Horarios del Día</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center gap-2">
                      <Button
                        variant={slot.available ? "default" : "secondary"}
                        size="sm"
                        onClick={() => handleSlotToggle(slot.id)}
                        disabled={slot.blocked}
                        className="w-full text-xs"
                      >
                        {slot.blocked ? (
                          <Lock className="h-3 w-3 mr-1" />
                        ) : slot.available ? (
                          <Unlock className="h-3 w-3 mr-1" />
                        ) : (
                          <X className="h-3 w-3 mr-1" />
                        )}
                        {slot.time}
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Unlock className="h-4 w-4 text-green-600" />
                    <span>Disponible</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <X className="h-4 w-4 text-gray-400" />
                    <span>No disponible</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Lock className="h-4 w-4 text-red-600" />
                    <span>Bloqueado</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Blocked Periods */}
          {blockedPeriods.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Períodos Bloqueados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {blockedPeriods.map((period) => (
                    <div key={period.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{period.reason}</div>
                        <div className="text-sm text-gray-600">
                          {period.recurring ? (
                            <>Recurrente: {period.recurringDays?.map(day => daysOfWeek[day].label).join(", ")}</>
                          ) : (
                            <>{period.startDate} - {period.endDate}</>
                          )}
                          {" "}({period.startTime} - {period.endTime})
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBlock(period.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Period Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="backdrop-blur-xl bg-gradient-to-br from-white/95 via-white/90 to-white/95 border border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Bloquear Período</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="block-reason">Motivo del Bloqueo</Label>
              <Input
                id="block-reason"
                value={newBlock.reason}
                onChange={(e) => setNewBlock({...newBlock, reason: e.target.value})}
                placeholder="Vacaciones, curso, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="block-start-time">Hora Inicio</Label>
                <Input
                  id="block-start-time"
                  type="time"
                  value={newBlock.startTime}
                  onChange={(e) => setNewBlock({...newBlock, startTime: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="block-end-time">Hora Fin</Label>
                <Input
                  id="block-end-time"
                  type="time"
                  value={newBlock.endTime}
                  onChange={(e) => setNewBlock({...newBlock, endTime: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="recurring"
                checked={newBlock.recurring}
                onCheckedChange={(checked) => setNewBlock({...newBlock, recurring: checked})}
              />
              <Label htmlFor="recurring">Bloqueo recurrente</Label>
            </div>

            {newBlock.recurring ? (
              <div>
                <Label>Días de la semana</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {daysOfWeek.map((day) => (
                    <Button
                      key={day.value}
                      variant={newBlock.recurringDays?.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleRecurringDayToggle(day.value)}
                    >
                      {day.label.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="block-start-date">Fecha Inicio</Label>
                  <Input
                    id="block-start-date"
                    type="date"
                    value={newBlock.startDate}
                    onChange={(e) => setNewBlock({...newBlock, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="block-end-date">Fecha Fin</Label>
                  <Input
                    id="block-end-date"
                    type="date"
                    value={newBlock.endDate}
                    onChange={(e) => setNewBlock({...newBlock, endDate: e.target.value})}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBlock}>
              Crear Bloqueo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}