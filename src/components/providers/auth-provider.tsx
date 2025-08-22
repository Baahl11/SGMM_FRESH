"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userEmail: string | null;
  user: any;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('🔧 [SGMM][AuthProvider] mount');
  const auth = useAuth();
  console.log('🔧 [SGMM][AuthProvider] state:', { isLoading: auth.isLoading, isAuthenticated: auth.isAuthenticated });

  // ⚡ BYPASS HARD-CODED: NUNCA mostrar loading spinner
  const shouldShowSpinner = false; // FORZAR = false SIEMPRE
  console.log('🔧 [SGMM][AuthProvider] shouldShowSpinner (HARD-CODED):', shouldShowSpinner);

  // Timeout de seguridad: después de 5 segundos, forzar mostrar contenido
  const [forceShow, setForceShow] = useState(true); // FORZAR = true inmediatamente
  useEffect(() => {
    console.log('⚡ [SGMM][AuthProvider] Force show ALWAYS TRUE (HARD-CODED)');
    setForceShow(true);
  }, []);

  return (
    <AuthContext.Provider value={auth}>
      {shouldShowSpinner ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="ml-4 text-sm text-gray-600">Cargando aplicación...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
