/**
 * API Route: /api/settings/upload-logo
 * Purpose: Upload clinic logo to Supabase Storage
 * Method: POST (multipart/form-data)
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { LOGO_STORAGE_BUCKET, MAX_LOGO_SIZE_MB, ALLOWED_LOGO_TYPES } from '@/lib/types/clinic-settings';

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Tipo de archivo no permitido. Solo PNG, JPEG o SVG.',
          allowedTypes: ALLOWED_LOGO_TYPES 
        },
        { status: 400 }
      );
    }

    // Validate file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > MAX_LOGO_SIZE_MB) {
      return NextResponse.json(
        { 
          error: `Archivo demasiado grande. Tamaño máximo: ${MAX_LOGO_SIZE_MB}MB`,
          maxSize: MAX_LOGO_SIZE_MB,
          currentSize: fileSizeInMB.toFixed(2)
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Delete old logo if exists
    const { data: oldSettings } = await supabase
      .from('clinic_settings')
      .select('logo_url')
      .eq('user_id', user.id)
      .single();

    if (oldSettings?.logo_url) {
      // Extract filename from URL
      const oldFileName = oldSettings.logo_url.split('/').pop();
      if (oldFileName) {
        const oldPath = `${user.id}/${oldFileName}`;
        await supabase.storage
          .from(LOGO_STORAGE_BUCKET)
          .remove([oldPath]);
      }
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(LOGO_STORAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[API] Error uploading logo:', uploadError);
      return NextResponse.json(
        { error: 'Error al subir el logo. Intenta de nuevo.' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(LOGO_STORAGE_BUCKET)
      .getPublicUrl(fileName);

    // Update clinic_settings with new logo URL
    const { data: updatedSettings, error: updateError } = await supabase
      .from('clinic_settings')
      .update({ logo_url: publicUrl })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[API] Error updating clinic settings with logo URL:', updateError);
      // Try to clean up uploaded file
      await supabase.storage
        .from(LOGO_STORAGE_BUCKET)
        .remove([fileName]);
      
      return NextResponse.json(
        { error: 'Error al actualizar configuración con el nuevo logo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logo_url: publicUrl,
      settings: updatedSettings,
    });
    
  } catch (error) {
    console.error('[API] Unexpected error in POST /api/settings/upload-logo:', error);
    return NextResponse.json(
      { error: 'Error inesperado al subir logo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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

    // Get current logo URL
    const { data: settings } = await supabase
      .from('clinic_settings')
      .select('logo_url')
      .eq('user_id', user.id)
      .single();

    if (!settings?.logo_url) {
      return NextResponse.json(
        { error: 'No hay logo para eliminar' },
        { status: 404 }
      );
    }

    // Extract filename from URL
    const fileName = settings.logo_url.split('/').pop();
    if (fileName) {
      const filePath = `${user.id}/${fileName}`;
      
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from(LOGO_STORAGE_BUCKET)
        .remove([filePath]);

      if (deleteError) {
        console.error('[API] Error deleting logo from storage:', deleteError);
      }
    }

    // Update clinic_settings to remove logo URL
    const { data: updatedSettings, error: updateError } = await supabase
      .from('clinic_settings')
      .update({ logo_url: null })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[API] Error removing logo URL from settings:', updateError);
      return NextResponse.json(
        { error: 'Error al eliminar logo de configuración' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
    });
    
  } catch (error) {
    console.error('[API] Unexpected error in DELETE /api/settings/upload-logo:', error);
    return NextResponse.json(
      { error: 'Error inesperado al eliminar logo' },
      { status: 500 }
    );
  }
}
