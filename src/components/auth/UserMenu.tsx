'use client';

import { useState } from 'react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function UserMenu() {
  const { user, userEmail, logout, isLoading, isAuthenticated } = useAuthContext();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Debug temporal - verificar datos reales
  console.log('UserMenu - isAuthenticated:', isAuthenticated);
  console.log('UserMenu - user:', user);
  console.log('UserMenu - userEmail:', userEmail);
  console.log('UserMenu - isLoading:', isLoading);
  
  // Debug: verificar qué hay en localStorage
  const rawToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const rawUserInfo = typeof window !== 'undefined' ? localStorage.getItem('user_info') : null;
  console.log('🔍 Raw localStorage auth_token:', rawToken);
  console.log('🔍 Raw localStorage user_info:', rawUserInfo);
  
  if (rawUserInfo) {
    try {
      const parsedUserInfo = JSON.parse(rawUserInfo);
      console.log('🔍 Parsed user_info:', parsedUserInfo);
    } catch (e) {
      console.log('🔍 Error parsing user_info:', e);
    }
  }

  if (isLoading) {
    return (
      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (!isAuthenticated || (!user && !userEmail)) {
    console.log('UserMenu returning null because:', {
      isAuthenticated,
      hasUser: !!user,
      hasUserEmail: !!userEmail,
      condition: !isAuthenticated || (!user && !userEmail)
    });
    return null;
  }

  console.log('UserMenu will render with:', {
    isAuthenticated,
    user,
    userEmail
  });

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      // La redirección se maneja en el contexto
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (userEmail) return userEmail.split('@')[0];
    return 'Usuario';
  };

  const getUserEmail = () => {
    return user?.email || userEmail || '';
  };

  const getUserPicture = () => {
    return user?.picture || '';
  };

  const isOAuthUser = () => {
    return user?.created_via_oauth || false;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getUserPicture()} alt={getUserDisplayName()} />
            <AvatarFallback>
              {getUserInitials(getUserDisplayName())}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {getUserDisplayName()}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {getUserEmail()}
            </p>
            {isOAuthUser() && (
              <p className="text-xs leading-none text-blue-600">
                Cuenta Google
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
          <Icons.user className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
          <Icons.settings className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
          <Icons.logout className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
