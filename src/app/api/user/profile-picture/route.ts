import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PROFILE_PICTURES_DIR = path.join(process.cwd(), 'public', 'uploads', 'profile-pictures');

// Asegurar que el directorio existe
async function ensureDirectoryExists() {
  try {
    await fs.access(PROFILE_PICTURES_DIR);
  } catch {
    await fs.mkdir(PROFILE_PICTURES_DIR, { recursive: true });
  }
}

// GET: Obtener foto de perfil actual
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || '1'; // Default user ID

    await ensureDirectoryExists();
    
    // Buscar archivos de foto de perfil para este usuario
    const files = await fs.readdir(PROFILE_PICTURES_DIR);
    const userFiles = files.filter(file => file.startsWith(`user_${userId}_`));
    
    if (userFiles.length === 0) {
      return NextResponse.json({ 
        success: true, 
        profile_picture_url: null 
      });
    }

    // Retornar la foto más reciente
    const latestFile = userFiles.sort().pop();
    const profilePictureUrl = `/uploads/profile-pictures/${latestFile}`;

    return NextResponse.json({ 
      success: true, 
      profile_picture_url: profilePictureUrl 
    });

  } catch (error) {
    console.error('Error getting profile picture:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la foto de perfil' },
      { status: 500 }
    );
  }
}

// POST: Subir nueva foto de perfil
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('user_id') as string || '1';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de archivo no permitido. Solo JPEG, PNG y WebP' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'El archivo es demasiado grande. Máximo 5MB' },
        { status: 400 }
      );
    }

    await ensureDirectoryExists();

    // Eliminar fotos de perfil anteriores del usuario
    const existingFiles = await fs.readdir(PROFILE_PICTURES_DIR);
    const userFiles = existingFiles.filter(f => f.startsWith(`user_${userId}_`));
    
    for (const oldFile of userFiles) {
      await fs.unlink(path.join(PROFILE_PICTURES_DIR, oldFile));
    }

    // Generar nombre único para la nueva foto
    const timestamp = Date.now();
    const extension = path.extname(file.name);
    const fileName = `user_${userId}_${timestamp}${extension}`;
    const filePath = path.join(PROFILE_PICTURES_DIR, fileName);

    // Guardar archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    const profilePictureUrl = `/uploads/profile-pictures/${fileName}`;

    // TODO: Aquí se podría actualizar la base de datos con la nueva URL
    // await updateUserProfilePicture(userId, profilePictureUrl);

    return NextResponse.json({
      success: true,
      profile_picture_url: profilePictureUrl,
      message: 'Foto de perfil actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json(
      { success: false, error: 'Error al subir la foto de perfil' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar foto de perfil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || '1';

    await ensureDirectoryExists();

    // Eliminar todas las fotos de perfil del usuario
    const files = await fs.readdir(PROFILE_PICTURES_DIR);
    const userFiles = files.filter(file => file.startsWith(`user_${userId}_`));

    for (const file of userFiles) {
      await fs.unlink(path.join(PROFILE_PICTURES_DIR, file));
    }

    // TODO: Actualizar base de datos
    // await updateUserProfilePicture(userId, null);

    return NextResponse.json({
      success: true,
      message: 'Foto de perfil eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error deleting profile picture:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la foto de perfil' },
      { status: 500 }
    );
  }
}
