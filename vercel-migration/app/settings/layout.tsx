/**
 * Settings Layout
 * Provides navigation between different settings pages
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Receipt, Palette, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
import { MainNav } from '@/components/layout/main-nav';

const settingsNav = [
  {
    title: 'Facturación',
    href: '/settings/facturacion',
    icon: Receipt,
    description: 'Configuración de Facturama y opciones de facturación',
  },
  {
    title: 'Personalización PDF',
    href: '/settings/branding',
    icon: Palette,
    description: 'Logos, colores y plantillas de facturas',
  },
  {
    title: 'Mensajería',
    href: '/dashboard/settings/whatsapp',
    icon: MessageSquare,
    description: 'WhatsApp Business y recordatorios automáticos',
  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      {/* Main Navigation */}
      <MainNav />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-gray-50/50 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Configuración
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Administra las opciones de tu sistema
            </p>
          </div>

          <nav className="space-y-1">
            {settingsNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-start gap-3 rounded-lg px-3 py-3 text-sm transition-all hover:bg-white hover:shadow-sm',
                    isActive
                      ? 'bg-white shadow-sm border border-gray-200 text-primary font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', isActive && 'text-primary')} />
                  <div>
                    <div className={cn(isActive && 'font-semibold')}>{item.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
