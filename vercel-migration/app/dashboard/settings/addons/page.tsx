import { Metadata } from "next";
import { Sparkles, MapPin, Users } from "lucide-react";
import { AddonsManager } from "@/components/settings/addons-manager";
import { GlassPanel } from "@/components/ui/glass-panel";

export const metadata: Metadata = {
  title: "Add-ons - Configuración",
  description: "Agrega ubicaciones extra y doctores adicionales a tu plan",
};

export default function AddonsPage() {
  return (
    <div className="space-y-6 text-white">
      <GlassPanel className="relative overflow-hidden border-white/10 bg-gradient-to-br from-white/15 via-white/5 to-transparent p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-violet-500/30 blur-[140px]" />
          <div className="absolute -bottom-32 left-0 h-64 w-64 rounded-full bg-sky-500/25 blur-[130px]" />
        </div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              <Sparkles className="h-4 w-4" />
              Expansión
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Add-ons Premium</h1>
              <p className="mt-2 text-sm text-white/70">
                Expande la capacidad de tu plan agregando ubicaciones y doctores adicionales sin esperar a un ciclo de facturación.
              </p>
            </div>
          </div>
          <div className="grid gap-3 text-white/80 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-sky-400/40 bg-sky-500/20 p-3">
                  <MapPin className="h-5 w-5 text-sky-100" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">Ubicaciones</p>
                  <p className="text-sm text-white/80">Activa clínicas adicionales al instante.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/20 p-3">
                  <Users className="h-5 w-5 text-emerald-100" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">Doctores</p>
                  <p className="text-sm text-white/80">Suma especialistas sin migrar de plan.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>

      <AddonsManager />
    </div>
  );
}
