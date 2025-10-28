'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function AuthDebug() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const status = loading ? 'loading' : (user ? 'authenticated' : 'unauthenticated')

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h4 className="font-bold mb-2">🔍 Auth Debug (Supabase)</h4>
      <div>Status: <span className="text-yellow-300">{status}</span></div>
      <div>Session: <span className="text-green-300">{user ? '✅ Active' : '❌ None'}</span></div>
      {user && (
        <div className="mt-2">
          <div>User: {user.user_metadata?.name || user.email}</div>
          <div>ID: {user.id}</div>
          <div className="text-xs text-gray-400 mt-1">Provider: {user.app_metadata?.provider}</div>
        </div>
      )}
    </div>
  )
}