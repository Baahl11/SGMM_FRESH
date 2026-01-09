import DoctorExceptionsConfig from "@/components/settings/doctor-exceptions-config";
import { GlassPanel } from "@/components/ui/glass-panel";
import { CalendarClock, ShieldCheck } from "lucide-react";

export default function ExceptionsPage() {
  return (
    <div className="space-y-6">
      <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-6 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-amber-400/25 blur-[140px]" />
          <div className="absolute -bottom-20 left-0 h-56 w-56 rounded-full bg-emerald-500/20 blur-[130px]" />
        </div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
              <CalendarClock className="h-4 w-4" />
              Agenda
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Bloqueos y vacaciones</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Mantén tu agenda impecable configurando excepciones por doctor: vacaciones, días festivos y bloqueos manuales.
              </p>
            </div>
          </div>
          <div className="grid gap-3 text-white/80 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Visibilidad</p>
              <p className="text-lg font-semibold">Panel unificado</p>
              <p className="text-xs text-white/60">Todos los doctores, un mismo lugar.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Protección</p>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-200" />
                <p className="text-lg font-semibold">Agenda blindada</p>
              </div>
              <p className="text-xs text-white/60">Evita citas en días no disponibles.</p>
            </div>
          </div>
        </div>
      </GlassPanel>

      <DoctorExceptionsConfig />
    </div>
  );
}
