import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { MainNav } from "@/components/layout/main-nav";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "UME López & López",
  description: "Sistema de gestión médica desarrollado por SGMM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={outfit.variable}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="relative min-h-screen bg-background font-sans antialiased">
              {/* Header */}
              <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center">
                  <MainNav />
                </div>
              </header>

              {/* Main Content */}
              <main className="flex-1 py-10">
                <div className="container">{children}</div>
              </main>

              {/* Footer */}
              <footer className="border-t py-6 md:py-0">
                <div className="container flex h-16 items-center justify-between">
                  <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4">
                    <p className="text-sm text-muted-foreground">
                      © {new Date().getFullYear()} SGMM. Todos los derechos reservados.
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <a href="mailto:gmelgarejom@gmail.com" className="hover:text-primary transition-colors">
                        Contáctanos para software a la medida
                      </a>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
