import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET: Obtener fotos de un paciente
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const patient_id = searchParams.get('patient_id');
    if (!patient_id) {
      return NextResponse.json({ error: 'patient_id es requerido' }, { status: 400 });
    }

    // Verificar que el paciente pertenece al usuario
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patient_id)
      .eq('user_id', user.id)
      .single();

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Obtener fotos ordenadas por fecha DESC
    const { data: photos, error } = await supabase
      .from('patient_photos')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [patient-photos] Error fetching photos:', error);
      throw error;
    }
    return NextResponse.json({ photos: photos || [] });
  } catch (error) {
    console.error('❌ [patient-photos] Error fetching patient photos:', error);
    return NextResponse.json(
      { error: 'Error al obtener fotos' },
      { status: 500 }
    );
  }
}

// POST: Guardar metadata de una foto
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { patient_id, url, descripcion, categoria } = body;
    // Validaciones
    if (!patient_id || !url) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: patient_id, url' },
        { status: 400 }
      );
    }

    // Verificar que el paciente pertenece al usuario
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patient_id)
      .eq('user_id', user.id)
      .single();

    if (patientError || !patient) {
      console.error('❌ [patient-photos] Patient verification failed:', patientError);
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }
    // Crear registro de foto
    const { data: photo, error } = await supabase
      .from('patient_photos')
      .insert({
        patient_id,
        user_id: user.id,
        url,
        descripcion,
        categoria: categoria || 'progreso'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [patient-photos] Database insert error:', error);
      throw error;
    }
    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error('❌ [patient-photos] Error creating patient photo:', error);
    return NextResponse.json(
      { error: 'Error al guardar la foto', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una foto
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const photo_id = searchParams.get('id');
    if (!photo_id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    // Obtener la foto para verificar permisos y obtener la URL
    const { data: photo, error: fetchError } = await supabase
      .from('patient_photos')
      .select('*')
      .eq('id', photo_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 });
    }
    // Extraer el path del archivo desde la URL
    const urlParts = photo.url.split('/patient-photos/');
    if (urlParts.length === 2) {
      const filePath = urlParts[1];
      
      // Eliminar del storage
      const { error: storageError } = await supabase.storage
        .from('patient-photos')
        .remove([filePath]); // Ya no duplicar 'patient-photos/' porque ya está en el bucket
      
      if (storageError) {
        console.warn('⚠️ [patient-photos] Storage delete warning:', storageError);
      } else {
      }
    }

    // Eliminar registro de la base de datos
    const { error: deleteError } = await supabase
      .from('patient_photos')
      .delete()
      .eq('id', photo_id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('❌ [patient-photos] Database delete error:', deleteError);
      throw deleteError;
    }
    return NextResponse.json({ message: 'Foto eliminada exitosamente' });
  } catch (error) {
    console.error('❌ [patient-photos] Error deleting patient photo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la foto', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
