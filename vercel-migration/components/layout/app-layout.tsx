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
    <div className="relative min-h-screen bg-gray-50/50 font-sans antialiased overflow-x-hidden w-full">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="container mx-auto px-4 flex h-16 items-center max-w-full">
          <MainNav />
        </div>
      </header>

      {/* Warning Banner - Below Header */}
      <QuotaWarningBanner />

      {/* Main Content */}
      <main className="flex-1 w-full overflow-x-hidden">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6 mt-auto w-full">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between max-w-full">
          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4">
            <p className="text-sm text-gray-600">
              © 2025 SGMM Pro. Todos los derechos reservados.
            </p>
            <div className="text-sm text-gray-600">
              <a href="mailto:gmelgarejom@gmail.com" className="hover:text-blue-600 transition-colors">
                Contáctanos para software a la medida
              </a>
            </div>
          </div>
        </div>
      </footer>

      <Toaster />
      <IOSInstallPrompt />
    </div>
  );
}