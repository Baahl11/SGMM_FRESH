'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SignOutPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const signOut = async () => {
      await supabase.auth.signOut()
      // Clear all cookies and redirect
      router.push('/')
      router.refresh()
    }

    signOut()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center">
      <div className="text-center text-white">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Cerrando sesión...</h1>
      </div>
    </div>
  )
}
