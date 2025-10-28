// API Route: /api/tags - CRUD for patient tags
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { CreateTagInput, UpdateTagInput } from '@/types/patient-tags'

// GET /api/tags - List all tags
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: tags, error } = await supabase
      .from('patient_tags')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    
    return NextResponse.json(tags)
  } catch (error: any) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/tags - Create new tag
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body: CreateTagInput = await request.json()
    
    // Validate required fields
    if (!body.name || !body.color) {
      return NextResponse.json(
        { error: 'Name and color are required' },
        { status: 400 }
      )
    }
    
    const { data: tag, error } = await supabase
      .from('patient_tags')
      .insert({
        name: body.name,
        color: body.color,
        icon: body.icon,
        description: body.description,
        created_by: user.id
      })
      .select()
      .single()
    
    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'A tag with this name already exists' },
          { status: 409 }
        )
      }
      throw error
    }
    
    return NextResponse.json(tag, { status: 201 })
  } catch (error: any) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
