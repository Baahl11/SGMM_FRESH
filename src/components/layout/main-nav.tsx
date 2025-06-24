"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function MainNav() {
  const pathname = usePathname();
  const { userEmail, logout } = useAuth();  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
    },
    {
      href: "/patients",
      label: "Pacientes",
      active: pathname === "/patients",
    },
    {
      href: "/treatments",
      label: "Tratamientos",
      active: pathname === "/treatments",    },
    {
      href: "/inventory",
      label: "Inventario",
      active: pathname === "/inventory",
    },
    {
      href: "/reports",
      label: "Reportes",
      active: pathname === "/reports",
    },
    {
      href: "/gastos-fijos",
      label: "Gastos Fijos",
      active: pathname === "/gastos-fijos",
    },    {
      href: "/settings/messaging",
      label: "Mensajería",
      active: pathname === "/settings/messaging",
    },
    {
      href: "/about",
      label: "Acerca de",
      active: pathname === "/about",
    },
  ];

  return (
    <nav className="flex items-center w-full">
      <div className="flex items-center space-x-4">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              route.active
                ? "text-black dark:text-white"
                : "text-muted-foreground"
            )}
          >
            {route.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center space-x-4 ml-auto">
        {userEmail && (
          <>
            <span className="text-sm text-muted-foreground">{userEmail}</span>
            <Button
              variant="ghost"
              onClick={logout}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Cerrar Sesión
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
