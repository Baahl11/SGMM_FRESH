import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/quick-phrases/[id]/use - Increment usage counter
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
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

    // Increment usage_count and update last_used_at
    const { data, error } = await supabase.rpc('increment_quick_phrase_usage', {
      phrase_id: params.id,
      uid: user.id
    });

    // If the function doesn't exist, fall back to manual update
    if (error && error.code === '42883') {
      // Function doesn't exist, use manual update
      const { data: phrase, error: fetchError } = await supabase
        .from('quick_phrases')
        .select('usage_count')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        return NextResponse.json(
          { error: 'Frase rápida no encontrada' },
          { status: 404 }
        );
      }

      const { data: updated, error: updateError } = await supabase
        .from('quick_phrases')
        .update({
          usage_count: (phrase.usage_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error incrementing usage:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar contador de uso' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        usage_count: updated.usage_count,
        last_used_at: updated.last_used_at
      });
    }

    if (error) {
      console.error('Error incrementing usage:', error);
      return NextResponse.json(
        { error: 'Error al actualizar contador de uso' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contador actualizado correctamente'
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/quick-phrases/[id]/use:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
