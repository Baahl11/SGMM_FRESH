// Debug component to display slot information directly in UI
import React from 'react';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  blocked?: boolean;
  reason?: string;
}

interface Appointment {
  id: number;
  fecha: string;
  appointment_time?: string;
  patient_name?: string;
  treatment_name?: string;
}

interface DebugSlotsProps {
  timeSlots: TimeSlot[];
  appointments: Appointment[];
  currentDate: Date;
  viewMode: string;
}

export default function DebugSlots({ timeSlots, appointments, currentDate, viewMode }: DebugSlotsProps) {
  if (viewMode !== 'day') return null;
  
  // Filter appointments for current date
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.fecha);
    return aptDate.toDateString() === currentDate.toDateString();
  });
  
  return (
    <div className="bg-yellow-50 border-2 border-yellow-200 p-4 m-4 rounded-lg">
      <h3 className="font-bold text-yellow-800 mb-2">🐛 DEBUG INFO - Day View</h3>
      <div className="text-sm text-yellow-700 space-y-1">
        <p><strong>Date:</strong> {currentDate.toDateString()}</p>
        <p><strong>View Mode:</strong> {viewMode}</p>
        <p><strong>Total Slots:</strong> {timeSlots.length}</p>
        <p><strong>Expected:</strong> 34 slots (05:00 - 21:30)</p>
        <p><strong>Slots Status:</strong> {timeSlots.length === 34 ? '✅ CORRECT' : `❌ PROBLEM - Only ${timeSlots.length} slots`}</p>
        
        <div className="border-t border-yellow-300 pt-2 mt-2">
          <p><strong>📅 Appointments for today:</strong> {todayAppointments.length}</p>
          {todayAppointments.length > 0 && (
            <div className="ml-4">
              {todayAppointments.map(apt => (
                <p key={apt.id} className="text-xs">
                  - #{apt.id}: {apt.patient_name} at {apt.appointment_time || new Date(apt.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </p>
              ))}
            </div>
          )}
        </div>
        
        {timeSlots.length > 0 && (
          <div className="border-t border-yellow-300 pt-2 mt-2">
            <p><strong>First 5 slots:</strong> {timeSlots.slice(0, 5).map(s => s.time).join(', ')}</p>
            <p><strong>Last 5 slots:</strong> {timeSlots.slice(-5).map(s => s.time).join(', ')}</p>
            <p><strong>Has 08:00?</strong> {timeSlots.some(s => s.time === '08:00') ? '✅ YES' : '❌ NO'}</p>
            <p><strong>Around 08:00:</strong> {timeSlots.filter(s => s.time >= '07:30' && s.time <= '08:30').map(s => s.time).join(', ')}</p>
          </div>
        )}
        
        {timeSlots.length < 10 && (
          <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded">
            <p className="text-red-800 font-bold">🚨 CRITICAL ISSUE</p>
            <p className="text-red-700">Only {timeSlots.length} slots available. This indicates TimeSlotManager interference or state corruption.</p>
          </div>
        )}
      </div>
    </div>
  );
}
