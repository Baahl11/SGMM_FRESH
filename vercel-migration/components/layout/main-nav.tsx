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
    <nav className="flex items-center w-full overflow-x-hidden">
      {/* Logo */}
      <div className="flex items-center space-x-2 md:space-x-4 mr-2 md:mr-6 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center space-x-2 group">
          {/* Logo Icon */}
          <div className="relative h-8 w-8 md:h-10 md:w-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105 flex-shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Calendar icon with medical cross */}
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              {/* Medical cross in the center */}
              <line x1="12" y1="14" x2="12" y2="18" />
              <line x1="10" y1="16" x2="14" y2="16" />
            </svg>
          </div>
          {/* Brand Name */}
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-lg md:text-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
              AgendaMedPro
            </span>
            <span className="text-[10px] text-gray-500 font-medium tracking-wide -mt-1">
              Sistema Médico
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="hidden lg:flex items-center space-x-2 xl:space-x-6 overflow-x-auto flex-1 min-w-0">
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
                "text-sm font-medium transition-colors hover:text-blue-600 px-3 py-2 rounded-md flex items-center gap-2",
                route.active
                  ? "text-blue-600 bg-blue-50 font-semibold"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              )}
            >
              <span>{route.label}</span>
              {badgeValue && (
                <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {badgeValue}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden ml-auto">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[350px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <line x1="12" y1="14" x2="12" y2="18" />
                    <line x1="10" y1="16" x2="14" y2="16" />
                  </svg>
                </div>
                <span className="font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
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
                      "flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-colors",
                      route.active
                        ? "bg-blue-50 text-blue-600 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <span>{route.label}</span>
                    {badgeValue && (
                      <span className="inline-flex min-w-[24px] items-center justify-center rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
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
      <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
        {user && <NotificationBell />}
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 h-8 px-2 md:px-3">
                <div className="h-6 w-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-3 w-3 text-white" />
                </div>
                <span className="hidden md:inline text-sm font-medium text-gray-700 truncate max-w-[120px]">
                  {user?.user_metadata?.name || user?.email || 'Usuario'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-gray-900">
                  {user?.user_metadata?.name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/mensajeria" className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Configuración Mensajería
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/configuracion" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración (10 Features)
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-red-600 focus:text-red-600"
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