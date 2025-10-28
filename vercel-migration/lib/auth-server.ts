/**
 * Server-side authentication helper using Supabase Auth
 * Replaces NextAuth getServerSession calls
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export interface AuthUser {
  id: string
  email: string
  user_metadata?: Record<string, any>
}

export interface AuthSession {
  user: AuthUser
  access_token: string
  refresh_token: string
}

/**
 * Get authenticated user from Supabase session
 * Use this instead of getServerSession(authOptions)
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value
          console.log(`[Auth] Getting cookie: ${name} = ${value ? 'EXISTS' : 'MISSING'}`)
          return value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Cookie setting might fail in middleware
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  console.log('[Auth] getAuthUser result:', { 
    hasUser: !!user, 
    userId: user?.id, 
    error: error?.message 
  })

  if (error || !user) {
    console.log('[Auth] No user found or error:', error?.message)
    return null
  }

  return {
    id: user.id,
    email: user.email!,
    user_metadata: user.user_metadata,
  }
}

/**
 * Get full session with tokens
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    return null
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email!,
      user_metadata: session.user.user_metadata,
    },
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  }
}
