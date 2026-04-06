// API Route: /api/patients/[id]/tags - Manage patient tag assignments
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/patients/[id]/tags - Get all tags for a patient
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    const { data: assignments, error } = await supabase
      .from('patient_tag_assignments')
      .select(`
        *,
        tag:patient_tags(*)
      `)
      .eq('patient_id', id)
    
    if (error) throw error
    
    // Extract just the tags
    const tags = assignments?.map(a => a.tag) || []
    
    return NextResponse.json(tags)
  } catch (error: any) {
    console.error('Error fetching patient tags:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/patients/[id]/tags - Assign tag to patient
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { tagId } = await request.json()
    
    if (!tagId) {
      return NextResponse.json(
        { error: 'tagId is required' },
        { status: 400 }
      )
    }
    
    // Check if patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', id)
      .single()
    
    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }
    
    // Check if tag exists
    const { data: tag, error: tagError } = await supabase
      .from('patient_tags')
      .select('id')
      .eq('id', tagId)
      .single()
    
    if (tagError || !tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }
    
    // Assign tag
    const { data: assignment, error: assignError } = await supabase
      .from('patient_tag_assignments')
      .insert({
        patient_id: id,
        tag_id: tagId,
        assigned_by: user.id
      })
      .select(`
        *,
        tag:patient_tags(*)
      `)
      .single()
    
    if (assignError) {
      if (assignError.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'This tag is already assigned to the patient' },
          { status: 409 }
        )
      }
      throw assignError
    }
    
    return NextResponse.json(assignment.tag, { status: 201 })
  } catch (error: any) {
    console.error('Error assigning tag:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/patients/[id]/tags?tagId=xxx - Remove tag from patient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('tagId')
    
    if (!tagId) {
      return NextResponse.json(
        { error: 'tagId query parameter is required' },
        { status: 400 }
      )
    }
    
    const { error } = await supabase
      .from('patient_tag_assignments')
      .delete()
      .eq('patient_id', id)
      .eq('tag_id', tagId)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error removing tag:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
