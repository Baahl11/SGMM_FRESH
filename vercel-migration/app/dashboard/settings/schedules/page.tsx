"use client";

import { Clock, CalendarCheck } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import DoctorScheduleConfig from "@/components/settings/doctor-schedule-config";

export default function SchedulesPage() {
  return (
    <div className="space-y-6 text-white">
      <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-28 right-0 h-64 w-64 rounded-full bg-cyan-500/25 blur-[140px]" />
          <div className="absolute -bottom-24 left-0 h-60 w-60 rounded-full bg-indigo-500/20 blur-[130px]" />
        </div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              <Clock className="h-4 w-4" />
              Horarios
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Disponibilidad médica</h1>
              <p className="mt-2 text-sm text-white/70">
                Sincroniza jornadas, descansos y buffers por doctor para que la agenda online respete la operación real.
              </p>
            </div>
          </div>
          <div className="grid gap-3 text-white/80 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Bloques inteligentes</p>
              <p className="text-sm text-white/70">Combina turnos por doctor, sede y servicio.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-emerald-200" />
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Confianza</p>
              </div>
              <p className="mt-2 text-sm text-white/70">Evita overbooking con reglas y buffers.</p>
            </div>
          </div>
        </div>
      </GlassPanel>

      <DoctorScheduleConfig />
    </div>
  );
}
