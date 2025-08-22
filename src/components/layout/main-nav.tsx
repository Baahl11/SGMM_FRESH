"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/components/providers/auth-provider";
import { UserMenu } from "@/components/auth/UserMenu";

export function MainNav() {
  const pathname = usePathname();
  const { isAuthenticated, user, userEmail } = useAuthContext();  const routes = [
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
      href: "/messaging",
      label: "Mensajería",
      active: pathname?.startsWith("/messaging") || false,
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
        {isAuthenticated ? (
          <UserMenu />
        ) : null}
      </div>
    </nav>
  );
}
