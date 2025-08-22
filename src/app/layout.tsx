import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import ClientBoot from "./ClientBoot";
// FetchPatch eliminado - sin interceptores server-side

// Server-side fetch interceptor eliminado - usando solo API routes estáticas

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "UME López & López",
  description: "Sistema de gestión médica desarrollado por SGMM",
};

// ⚡ ROOT LAYOUT SÚPER LIGERO - SOLO PROVIDERS, SIN COMPONENTES PESADOS
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={outfit.variable}>
        <ClientBoot />
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
