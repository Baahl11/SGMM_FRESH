// API Route: /api/tags/[id] - Update/Delete specific tag
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { UpdateTagInput } from '@/types/patient-tags'

// GET /api/tags/[id] - Get single tag
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient()
    
    const { data: tag, error } = await supabase
      .from('patient_tags')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tag not found' },
          { status: 404 }
        )
      }
      throw error
    }
    
    return NextResponse.json(tag)
  } catch (error: any) {
    console.error('Error fetching tag:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/tags/[id] - Update tag
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body: UpdateTagInput = await request.json()
    
    const { data: tag, error } = await supabase
      .from('patient_tags')
      .update({
        ...(body.name && { name: body.name }),
        ...(body.color && { color: body.color }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.description !== undefined && { description: body.description }),
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tag not found' },
          { status: 404 }
        )
      }
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A tag with this name already exists' },
          { status: 409 }
        )
      }
      throw error
    }
    
    return NextResponse.json(tag)
  } catch (error: any) {
    console.error('Error updating tag:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/tags/[id] - Delete tag
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Delete tag (assignments will cascade delete)
    const { error } = await supabase
      .from('patient_tags')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tag not found' },
          { status: 404 }
        )
      }
      throw error
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
