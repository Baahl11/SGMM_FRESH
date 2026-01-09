"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { User, LogOut, Settings, MessageSquare, Menu } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";

const LogoMark = ({ className = "h-10 w-10" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="agendaMedProGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="50%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
      <linearGradient id="agendaMedProStroke" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#ecfeff" />
        <stop offset="100%" stopColor="#fdf4ff" />
      </linearGradient>
    </defs>
    <rect x="5" y="5" width="54" height="54" rx="18" fill="url(#agendaMedProGradient)" />
    <rect x="16" y="18" width="32" height="28" rx="10" fill="rgba(15,23,42,0.2)" />
    <path d="M20 26h24" stroke="rgba(248,250,252,0.35)" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M22 36c4 0 4-8 8-8s4 8 8 8 4-8 8-8"
      fill="none"
      stroke="url(#agendaMedProStroke)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="42" cy="22" r="3" fill="#ecfeff" />
  </svg>
);

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!user) {
      setLowStockCount(null);
      return;
    }

    let isMounted = true;

    const fetchLowStock = async () => {
      try {
        const response = await fetch('/api/inventory/low-stock');
        if (!response.ok) {
          return;
        }
        const body = await response.json();
        const count = typeof body.count === 'number'
          ? body.count
          : Array.isArray(body.items)
            ? body.items.length
            : 0;
        if (isMounted) {
          setLowStockCount(count);
        }
      } catch (error) {
        console.warn('Unable to fetch low stock items', error);
      }
    };

    fetchLowStock();
    const interval = setInterval(fetchLowStock, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
  };

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
    },
    {
      href: "/agenda",
      label: "Agenda",
      active: pathname === "/agenda",
    },
    {
      href: "/dashboard/bookings",
      label: "Reservas",
      active: pathname === "/dashboard/bookings",
    },
    {
      href: "/patients",
      label: "Pacientes",
      active: pathname === "/patients" || pathname?.startsWith("/patients/"),
    },
    {
      href: "/treatments",
      label: "Tratamientos",
      active: pathname === "/treatments" || pathname?.startsWith("/treatments/"),
    },
    {
      href: "/promociones",
      label: "Promociones",
      active: pathname === "/promociones" || pathname?.startsWith("/promociones/"),
    },
    {
      href: "/inventory",
      label: "Inventario",
      active: pathname === "/inventory",
    },
    {
      href: "/messaging",
      label: "Mensajería",
      active: pathname === "/messaging" || pathname?.startsWith("/messaging/"),
    },
    {
      href: "/gastos-fijos",
      label: "Gastos Fijos",
      active: pathname === "/gastos-fijos",
    },
    {
      href: "/reports",
      label: "Reportes",
      active: pathname === "/reports",
    },
  ];

  return (
    <nav className="flex w-full flex-wrap items-center gap-4 overflow-hidden text-white">
      {/* Logo */}
      <div className="mr-2 flex flex-shrink-0 items-center space-x-2 md:mr-6 md:space-x-4">
        <Link href="/dashboard" className="flex items-center space-x-2 group">
          <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white/5 shadow-lg ring-1 ring-white/20 transition group-hover:-translate-y-0.5">
            <LogoMark className="h-8 w-8" />
          </div>
          {/* Brand Name */}
          <div className="hidden flex-col sm:flex">
            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-lg font-bold leading-tight text-transparent md:text-xl">
              AgendaMedPro
            </span>
            <span className="-mt-1 text-[10px] font-medium tracking-wide text-white/50">
              Sistema Médico Administrativo
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="hidden min-w-0 flex-1 items-center space-x-2 overflow-x-auto rounded-full border border-white/10 bg-white/5 px-2 py-1 lg:flex xl:space-x-4">
        {routes.map((route) => {
          const isInventory = route.href === "/inventory";
          const showLowStock = isInventory && (lowStockCount || 0) > 0;
          const badgeValue = showLowStock
            ? lowStockCount && lowStockCount > 9
              ? "9+"
              : String(lowStockCount)
            : null;

          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition",
                route.active
                  ? "bg-white text-slate-900 shadow-lg"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <span>{route.label}</span>
              {badgeValue && (
                <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-rose-500/90 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {badgeValue}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Mobile Menu Button */}
      <div className="ml-auto lg:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] bg-[var(--surface-night)] text-white border-white/10 sm:w-[350px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <line x1="12" y1="14" x2="12" y2="18" />
                    <line x1="10" y1="16" x2="14" y2="16" />
                  </svg>
                </div>
                <span className="bg-gradient-to-r from-emerald-200 to-cyan-200 bg-clip-text text-transparent font-bold">
                  AgendaMedPro
                </span>
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col space-y-2">
              {routes.map((route) => {
                const isInventory = route.href === "/inventory";
                const showLowStock = isInventory && (lowStockCount || 0) > 0;
                const badgeValue = showLowStock
                  ? lowStockCount && lowStockCount > 9
                    ? "9+"
                    : String(lowStockCount)
                  : null;

                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition",
                      route.active
                        ? "bg-white text-slate-900"
                        : "text-white/80 hover:bg-white/10"
                    )}
                  >
                    <span>{route.label}</span>
                    {badgeValue && (
                      <span className="inline-flex min-w-[24px] items-center justify-center rounded-full bg-rose-500/90 px-2 py-1 text-xs font-semibold text-white">
                        {badgeValue}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* User Menu */}
      <div className="flex flex-shrink-0 items-center space-x-2 md:space-x-4">
        {user && <NotificationBell />}
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex h-8 items-center space-x-2 px-2 text-white hover:bg-white/10 md:px-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-600">
                  <User className="h-3 w-3 text-white" />
                </div>
                <span className="hidden max-w-[120px] truncate text-sm font-medium text-white/80 md:inline">
                  {user?.user_metadata?.name || user?.email || 'Usuario'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border border-white/10 bg-[var(--surface-night-secondary)] text-white">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-white">
                  {user?.user_metadata?.name || 'Usuario'}
                </p>
                <p className="text-xs text-white/60">
                  {user?.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center text-white">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-rose-400 focus:text-rose-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </nav>
  );
}