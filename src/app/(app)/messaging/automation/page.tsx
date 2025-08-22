'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AutomationRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirigir automáticamente a /messaging con la pestaña recordatorios
    router.replace('/messaging');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Redirigiendo...</h2>
        <p className="text-gray-600 mt-2">Esta funcionalidad se ha movido a la pestaña Recordatorios</p>
      </div>
    </div>
  );
}
