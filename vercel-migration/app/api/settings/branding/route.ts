/**
 * API Route: /api/settings/branding
 * Purpose: Get and update clinic branding settings for PDF customization
 * Methods: GET, POST
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { ClinicSettings, ClinicSettingsInput } from '@/lib/types/clinic-settings';
import { DEFAULT_CLINIC_SETTINGS } from '@/lib/types/clinic-settings';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor, inicia sesión.' },
        { status: 401 }
      );
    }

    // Fetch clinic settings for current user
    const { data: settings, error: fetchError } = await supabase
      .from('clinic_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      // If no settings exist yet, create default ones
      if (fetchError.code === 'PGRST116') {
        const { data: newSettings, error: insertError } = await supabase
          .from('clinic_settings')
          .insert({
            user_id: user.id,
            ...DEFAULT_CLINIC_SETTINGS,
          })
          .select()
          .single();

        if (insertError) {
          console.error('[API] Error creating default settings:', insertError);
          return NextResponse.json(
            { error: 'Error al crear configuración predeterminada' },
            { status: 500 }
          );
        }

        return NextResponse.json(newSettings);
      }

      console.error('[API] Error fetching clinic settings:', fetchError);
      return NextResponse.json(
        { error: 'Error al cargar configuración de marca' },
        { status: 500 }
      );
    }

    return NextResponse.json(settings);
    
  } catch (error) {
    console.error('[API] Unexpected error in GET /api/settings/branding:', error);
    return NextResponse.json(
      { error: 'Error inesperado al cargar configuración' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor, inicia sesión.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: ClinicSettingsInput = await request.json();

    // Validate colors (hex format)
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    if (body.primary_color && !hexColorRegex.test(body.primary_color)) {
      return NextResponse.json(
        { error: 'Color primario inválido. Usa formato hex (#RRGGBB)' },
        { status: 400 }
      );
    }
    if (body.secondary_color && !hexColorRegex.test(body.secondary_color)) {
      return NextResponse.json(
        { error: 'Color secundario inválido. Usa formato hex (#RRGGBB)' },
        { status: 400 }
      );
    }
    if (body.accent_color && !hexColorRegex.test(body.accent_color)) {
      return NextResponse.json(
        { error: 'Color de acento inválido. Usa formato hex (#RRGGBB)' },
        { status: 400 }
      );
    }
    if (body.text_color && !hexColorRegex.test(body.text_color)) {
      return NextResponse.json(
        { error: 'Color de texto inválido. Usa formato hex (#RRGGBB)' },
        { status: 400 }
      );
    }

    // Validate logo width
    if (body.logo_width !== undefined && (body.logo_width < 50 || body.logo_width > 500)) {
      return NextResponse.json(
        { error: 'Ancho de logo debe estar entre 50 y 500 pixeles' },
        { status: 400 }
      );
    }

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('clinic_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingSettings) {
      // Update existing settings
      const { data: updatedSettings, error: updateError } = await supabase
        .from('clinic_settings')
        .update(body)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('[API] Error updating clinic settings:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar configuración de marca' },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedSettings);
      
    } else {
      // Create new settings
      const { data: newSettings, error: insertError } = await supabase
        .from('clinic_settings')
        .insert({
          user_id: user.id,
          ...DEFAULT_CLINIC_SETTINGS,
          ...body,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[API] Error creating clinic settings:', insertError);
        return NextResponse.json(
          { error: 'Error al crear configuración de marca' },
          { status: 500 }
        );
      }

      return NextResponse.json(newSettings);
    }
    
  } catch (error) {
    console.error('[API] Unexpected error in POST /api/settings/branding:', error);
    return NextResponse.json(
      { error: 'Error inesperado al guardar configuración' },
      { status: 500 }
    );
  }
}
