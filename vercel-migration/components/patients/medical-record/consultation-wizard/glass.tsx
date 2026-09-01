"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Átomos visuales "dark-glass" del wizard, alineados con
 * patient-details-client / medical-timeline (bg-white/5, backdrop-blur,
 * rounded-2xl, acentos neón). Se usan sobre un DialogContent oscuro.
 */

type Accent = "indigo" | "cyan" | "emerald" | "rose" | "purple" | "amber";

const ACCENT_ICON_BG: Record<Accent, string> = {
  indigo: "bg-indigo-400/20 text-indigo-100",
  cyan: "bg-cyan-400/20 text-cyan-100",
  emerald: "bg-emerald-400/20 text-emerald-100",
  rose: "bg-rose-400/20 text-rose-100",
  purple: "bg-purple-400/20 text-purple-100",
  amber: "bg-amber-400/20 text-amber-100",
};

const ACCENT_FOCUS: Record<Accent, string> = {
  indigo: "focus:border-indigo-400 focus-visible:border-indigo-400",
  cyan: "focus:border-cyan-400 focus-visible:border-cyan-400",
  emerald: "focus:border-emerald-400 focus-visible:border-emerald-400",
  rose: "focus:border-rose-400 focus-visible:border-rose-400",
  purple: "focus:border-purple-400 focus-visible:border-purple-400",
  amber: "focus:border-amber-400 focus-visible:border-amber-400",
};

/** Clases para inputs/textarea/select-trigger sobre fondo glass. */
export function glassFieldClass(accent: Accent = "indigo", invalid = false) {
  return cn(
    "bg-white/5 border-white/15 text-white placeholder:text-white/35",
    ACCENT_FOCUS[accent],
    invalid && "border-rose-400/70 focus:border-rose-400",
  );
}

/** Clases para <SelectContent> oscuro (menú desplegable). */
export const glassSelectContentClass =
  "bg-slate-900 border-white/15 text-white";

export function StepIntro({
  icon: Icon,
  title,
  subtitle,
  accent = "indigo",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accent?: Accent;
}) {
  return (
    <div className="text-center mb-6">
      <div
        className={cn(
          "mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl",
          ACCENT_ICON_BG[accent],
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-white/60">{subtitle}</p> : null}
    </div>
  );
}

export function GlassSection({
  icon: Icon,
  title,
  accent = "indigo",
  children,
  className,
}: {
  icon?: LucideIcon;
  title?: string;
  accent?: Accent;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur",
        className,
      )}
    >
      {title ? (
        <div className="mb-4 flex items-center gap-3">
          {Icon ? (
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                ACCENT_ICON_BG[accent],
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
          <h4 className="font-semibold text-white">{title}</h4>
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-rose-300">{children}</p>;
}

export function GlassLabel({ children }: { children: ReactNode }) {
  return <Label className="text-sm font-medium text-white/80">{children}</Label>;
}
