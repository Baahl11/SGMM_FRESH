'use client';

import React from "react";
import { MainNav } from "@/components/layout/main-nav";
import { Toaster } from "sonner";
import { QuotaWarningBanner } from "@/components/subscription/quota-warning-banner";
import { IOSInstallPrompt } from "@/components/pwa/ios-install-prompt";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[var(--surface-night-secondary)] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[160px]" />
        <div className="absolute bottom-0 right-0 h-[540px] w-[540px] translate-x-1/3 translate-y-1/3 rounded-full bg-indigo-500/20 blur-[220px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-10">
        {/* Header */}
        <header className="glass-panel border-white/10 px-4 py-3 shadow-[0_20px_60px_rgba(2,6,23,0.45)] sm:px-6 sm:py-4">
          <MainNav />
        </header>

        {/* Warning Banner - Below Header */}
        <QuotaWarningBanner />

        {/* Main Content */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="glass-panel border-white/10 px-6 py-5 text-sm text-white/70">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2025 SGMM Pro. Todos los derechos reservados.</p>
            <a href="mailto:gmelgarejom@gmail.com" className="text-white/80 transition hover:text-white">
              Contáctanos para software a la medida
            </a>
          </div>
        </footer>
      </div>

      <Toaster />
      <IOSInstallPrompt />
    </div>
  );
}