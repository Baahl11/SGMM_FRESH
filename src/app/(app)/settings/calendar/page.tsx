'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CalendarRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la nueva página de mensajería
    router.replace('/settings/messaging');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirigiendo a Panel de Mensajería...</p>
      </div>
    </div>
  );
}
