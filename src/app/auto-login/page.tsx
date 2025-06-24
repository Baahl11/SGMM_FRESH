"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthService from "@/lib/auth-service";

export default function AutoLoginPage() {
  const router = useRouter();

  useEffect(() => {
    const doAutoLogin = async () => {
      try {
        console.log("Auto-login starting...");
        const success = await AuthService.login("test@test.com", "test123");
        
        if (success) {
          console.log("Auto-login successful, redirecting to dashboard...");
          router.push("/dashboard");
        } else {
          console.log("Auto-login failed, redirecting to regular login...");
          router.push("/login");
        }
      } catch (error) {
        console.error("Auto-login error:", error);
        router.push("/login");
      }
    };

    doAutoLogin();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Conectando...</h2>
        <p className="text-muted-foreground">Iniciando sesión automáticamente...</p>
      </div>
    </div>
  );
}
