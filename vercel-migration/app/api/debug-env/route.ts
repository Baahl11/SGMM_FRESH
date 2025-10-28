import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set (hidden)' : 'not set',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set (hidden)' : 'not set',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'set (hidden)' : 'not set',
  })
}
