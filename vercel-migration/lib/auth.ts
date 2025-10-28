import NextAuth, { NextAuthOptions } from 'next-auth'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  // Temporarily disable adapter for testing
  // adapter: SupabaseAdapter({
  //   url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  // }),
  providers: [
    CredentialsProvider({
      name: 'Demo Login',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'test@demo.com' },
        password: { label: 'Password', type: 'password', placeholder: 'demo123' }
      },
      async authorize(credentials) {
        // Authenticate with Supabase
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Import supabase client
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          )

          // Try to sign in with Supabase Auth
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error || !data.user) {
            console.error('Auth error:', error)
            return null
          }

          // Return user data
          return {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.email!,
          }
        } catch (error) {
          console.error('Authentication failed:', error)
          return null
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user info to token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      console.log('JWT Callback - Token:', token)
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token && session.user) {
        (session.user as any).id = token.id
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      console.log('Session Callback - Session:', session)
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
  },
  session: {
    strategy: 'jwt', // Change to JWT for credentials provider
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)