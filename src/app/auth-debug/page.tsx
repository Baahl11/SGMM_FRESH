"use client";

import { useState } from "react";
import AuthService from "@/lib/auth-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  const checkAuth = () => {
    const token = AuthService.getToken();
    const isAuth = AuthService.isAuthenticated();
    const userEmail = AuthService.getUserEmail();
    
    setDebugInfo({
      token: token ? token.substring(0, 50) + "..." : "No token",
      isAuthenticated: isAuth,
      userEmail: userEmail || "No user",
      localStorage: localStorage.getItem('auth_token') ? "Present" : "Not found",
      cookies: document.cookie.includes('auth_token') ? "Present" : "Not found"
    });
  };

  const doLogin = async () => {
    try {
      const success = await AuthService.login("admin@consultorio.com", "admin123");
      setDebugInfo(prev => ({
        ...prev,
        loginResult: success ? "Success" : "Failed"
      }));
      
      if (success) {
        setTimeout(checkAuth, 1000);
      }
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        loginResult: "Error: " + error
      }));
    }
  };

  const clearAuth = () => {
    AuthService.logout();
    setTimeout(checkAuth, 500);
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Auth Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkAuth}>Check Auth Status</Button>
            <Button onClick={doLogin}>Do Login</Button>
            <Button onClick={clearAuth} variant="outline">Clear Auth</Button>
          </div>
          
          <div className="bg-gray-100 p-4 rounded">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
