import React from 'react';
import { Button } from "@/components/ui/button";

const LogoutButton: React.FC = () => {
  const handleLogout = () => {
    // Limpiar todas las sesiones
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('oauth_state');
    
    console.log('🚪 Sesión cerrada, redirigiendo al login...');
    
    // Redirigir al login
    window.location.href = '/login';
  };

  return (
    <Button 
      onClick={handleLogout}
      variant="outline"
      size="sm"
    >
      Cerrar Sesión
    </Button>
  );
};

export default LogoutButton;
