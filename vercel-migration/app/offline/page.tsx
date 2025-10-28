'use client';

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
          <WifiOff className="h-10 w-10 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Sin Conexión
        </h1>
        
        <p className="text-gray-600 mb-6">
          No tienes conexión a internet. Algunas funciones están limitadas en modo offline.
        </p>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Disponible offline:</h3>
          <ul className="text-sm text-gray-700 space-y-1 text-left">
            <li>✅ Ver agenda del día</li>
            <li>✅ Consultar pacientes guardados</li>
            <li>✅ Ver expedientes recientes</li>
          </ul>
        </div>

        <p className="text-sm text-gray-500">
          Los cambios se sincronizarán automáticamente cuando recuperes la conexión.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-6 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-shadow"
        >
          Reintentar Conexión
        </button>
      </div>
    </div>
  );
}
