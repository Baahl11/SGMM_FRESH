'use client'

import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppLayout from "@/components/layout/app-layout"

// Temporary UI component
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>{children}</div>
)

const CardContent = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 ${className}`}>{children}</div>
)

export default function GastosFijosPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingAuth(false);
      
      if (!user) {
        router.push('/auth/signin');
      }
    };

    getUser();
  }, [router])

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm border border-green-100 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Gastos Fijos
              </h1>
              <p className="text-gray-600">Control financiero y gestión de gastos operativos</p>
            </div>
          </div>
        </div>

        {/* Integration Message */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 p-3 bg-green-100 rounded-2xl">
              <svg className="w-full h-full text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v3e5H9v-3m3-2h.01M9 4h6a2 2 0 012 2v6.993l1 1H8l1-1V6a2 2 0 012-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sistema de Gastos Fijos</h3>
            <p className="text-gray-600 mb-6">
              Tu sistema completo de control financiero y gastos fijos está siendo integrado con la nueva plataforma. 
              Esta página incluirá todas las funcionalidades de gestión financiera que ya tienes implementadas.
            </p>
            <div className="bg-white/70 rounded-xl p-4 border border-green-200">
              <p className="text-green-800 text-sm font-medium">
                🔄 Integrando funcionalidades existentes:<br/>
                • Registro de gastos fijos mensuales<br/>
                • Categorización de gastos operativos<br/>
                • Control de presupuestos y límites<br/>
                • Alertas de vencimiento de pagos<br/>
                • Reportes financieros detallados<br/>
                • Análisis de rentabilidad por período<br/>
                • Dashboard de indicadores financieros
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}