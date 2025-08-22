"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from "@/components/providers/auth-provider";
import GoogleOAuthButton from '@/components/auth/GoogleOAuthButton';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuthContext();

  // Mostrar error de OAuth si viene en la URL
  useEffect(() => {
    if (searchParams) {
      const urlError = searchParams.get('error');
      if (urlError) {
        setError(decodeURIComponent(urlError));
      }
    }
  }, [searchParams]);

  const handleGoogleSuccess = (user: any) => {
    console.log('✅ Google login successful:', user);
    // La redirección se maneja en el callback
  };

  const handleGoogleError = (errorMsg: string) => {
    console.error('❌ Google login error:', errorMsg);
    setError(errorMsg);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const success = await login(email, password);
      if (!success) {
        setError("Credenciales inválidas");      } else {
        // Debug: Manual check and redirect
        console.log("Login successful, attempting redirect...");
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("Ocurrió un error durante el inicio de sesión");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-blue-700 font-bold">
            SGMA
          </CardTitle>
          <p className="text-sm text-center text-gray-600 mt-2">
            Software de Gestión Médica Administrativa
          </p>
        </CardHeader>
        <CardContent>
          {/* Google OAuth Button */}
          <div className="mb-6">
            <GoogleOAuthButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              className="w-full"
              size="md"
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">O continúa con email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@sgma.com"
                className="w-full"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link 
              href="/register" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ¿No tienes cuenta? Registrarse
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
