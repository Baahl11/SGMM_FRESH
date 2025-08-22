"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/auth-provider";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthContext();

  useEffect(() => {
    // Redirect unauthenticated users to login
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
    // Redirect authenticated users to dashboard
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking authentication or redirecting
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }
  
  // This should never render since we always redirect
  return null;
}
