import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { validateQuickPhrase } from '@/lib/types/quick-phrase';
import type { QuickPhraseContext, QuickPhraseCategory } from '@/lib/types/quick-phrase';

// GET /api/quick-phrases - List user's quick phrases
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const context = searchParams.get('context') as QuickPhraseContext | null;
    const category = searchParams.get('category') as QuickPhraseCategory | null;
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort') || 'created_at'; // 'created_at', 'usage_count', 'title'
    const order = searchParams.get('order') || 'desc'; // 'asc' or 'desc'

    // Build query
    let query = supabase
      .from('quick_phrases')
      .select('*')
      .eq('user_id', user.id);

    // Apply filters
    if (context && ['medical_record', 'treatment', 'both'].includes(context)) {
      query = query.or(`context.eq.${context},context.eq.both`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Full text search
    if (search && search.trim().length > 0) {
      // Search in title and content
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Sorting
    if (sortBy === 'usage_count') {
      query = query.order('usage_count', { ascending: order === 'asc' });
    } else if (sortBy === 'title') {
      query = query.order('title', { ascending: order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: order === 'asc' });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching quick phrases:', error);
      return NextResponse.json(
        { error: 'Error al obtener frases rápidas' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error in GET /api/quick-phrases:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/quick-phrases - Create new quick phrase
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, content, context, category } = body;

    // Validate data
    const validationErrors = validateQuickPhrase({ title, content, context, category });
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationErrors },
        { status: 400 }
      );
    }

    // Insert new phrase
    const { data, error } = await supabase
      .from('quick_phrases')
      .insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        context,
        category,
        usage_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quick phrase:', error);
      return NextResponse.json(
        { error: 'Error al crear frase rápida' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/quick-phrases:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
