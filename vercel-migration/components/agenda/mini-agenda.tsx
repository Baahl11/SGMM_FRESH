"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, User } from "lucide-react";

interface Appointment {
  id: number;
  patient_name: string;
  fecha: string;
  hora: string;
  motivo?: string;
}

export function MiniAgenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingAppointments();
  }, []);

  const loadUpcomingAppointments = async () => {
    try {
      setLoading(true);
      
      // Simular citas próximas por ahora
      const mockAppointments: Appointment[] = [
        {
          id: 1,
          patient_name: "María González",
          fecha: "2025-09-26",
          hora: "10:00",
          motivo: "Consulta de seguimiento"
        },
        {
          id: 2,
          patient_name: "Carlos Rodríguez",
          fecha: "2025-09-26",
          hora: "14:30",
          motivo: "Primera consulta"
        },
        {
          id: 3,
          patient_name: "Ana Martínez",
          fecha: "2025-09-27",
          hora: "09:00",
          motivo: "Control rutinario"
        },
      ];
      
      setAppointments(mockAppointments);
    } catch (error) {
      console.error("Error loading appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Hoy";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Mañana";
    } else {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.length === 0 ? (
        <div className="text-center py-8 rounded-2xl border border-white/10 bg-white/5">
          <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-6 w-6 text-white/80" />
          </div>
          <p className="text-white/70 text-sm">No hay citas próximas</p>
        </div>
      ) : (
        appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">{appointment.patient_name}</p>
                <p className="text-sm text-white/70">{appointment.motivo || 'Consulta médica'}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(appointment.fecha)}</span>
                  <Clock className="h-3 w-3 ml-2" />
                  <span>{appointment.hora}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      <div className="border-t border-white/10 pt-4 text-right">
        <a href="/agenda" className="text-sm font-medium text-white hover:text-white/80">
          Ver agenda completa →
        </a>
      </div>
    </div>
  );
}