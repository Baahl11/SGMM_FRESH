/**
 * API Route: /api/gastos-variables/upload
 * Endpoint para subir archivos de facturas (PDF, imágenes)
 * POST - Subir factura a Supabase Storage
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gastos-variables/upload
 * Sube un archivo de factura (PDF o imagen) a Supabase Storage
 * 
 * Body (multipart/form-data):
 * - file: File (PDF, JPG, PNG)
 * - gasto_id?: number (opcional - si se vincula a un gasto existente)
 * 
 * Returns:
 * {
 *   url: string,       // URL pública del archivo
 *   path: string,      // Path en storage
 *   fileName: string   // Nombre del archivo
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    // Parsear form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const gasto_id = formData.get('gasto_id') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }
    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Tipo de archivo no permitido',
          allowed: ['PDF', 'JPG', 'PNG', 'WEBP']
        },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande (máximo 10MB)' },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Supabase Storage (bucket: gastos-facturas)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('gastos-facturas')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ [POST /api/gastos-variables/upload] Error al subir:', uploadError);
      
      // Si el bucket no existe, dar instrucciones
      if (uploadError.message.includes('not found')) {
        return NextResponse.json(
          { 
            error: 'Bucket de storage no configurado',
            instructions: 'Debes crear el bucket "gastos-facturas" en Supabase Storage con acceso público'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }
    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('gastos-facturas')
      .getPublicUrl(filePath);
    // Si se proporcionó gasto_id, actualizar el registro
    if (gasto_id) {
      const { error: updateError } = await supabase
        .from('variable_expenses')
        .update({ 
          factura_url: publicUrl,
          factura_tipo: file.type === 'application/pdf' ? 'fiscal' : 'simple'
        })
        .eq('id', gasto_id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('❌ [POST /api/gastos-variables/upload] Error al actualizar gasto:', updateError);
        // No retornamos error aquí porque el archivo ya se subió exitosamente
        console.warn('⚠️  El archivo se subió pero no se pudo vincular al gasto');
      } else {
      }
    }

    return NextResponse.json({
      url: publicUrl,
      path: filePath,
      fileName: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('❌ [POST /api/gastos-variables/upload] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gastos-variables/upload
 * Elimina un archivo de factura de Supabase Storage
 * 
 * Query params:
 * - path: string (path del archivo en storage)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Path del archivo es requerido' },
        { status: 400 }
      );
    }
    // Verificar que el path pertenece al usuario
    if (!path.startsWith(user.id + '/')) {
      return NextResponse.json(
        { error: 'No autorizado para eliminar este archivo' },
        { status: 403 }
      );
    }

    // Eliminar de storage
    const { error: deleteError } = await supabase.storage
      .from('gastos-facturas')
      .remove([path]);

    if (deleteError) {
      console.error('❌ [DELETE /api/gastos-variables/upload] Error al eliminar:', deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ 
      message: 'Archivo eliminado exitosamente',
      path 
    });

  } catch (error) {
    console.error('❌ [DELETE /api/gastos-variables/upload] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
