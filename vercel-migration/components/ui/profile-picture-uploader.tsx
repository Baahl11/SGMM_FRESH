import React, { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProfilePictureUploaderProps {
  currentPictureUrl?: string;
  userName: string;
  userId: string | number;
  onPictureUpdate: (newPictureUrl: string) => void;
  onPictureDelete: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  allowDelete?: boolean;
}

export function ProfilePictureUploader({
  currentPictureUrl,
  userName,
  userId,
  onPictureUpdate,
  onPictureDelete,
  className = '',
  size = 'lg',
  allowDelete = true
}: ProfilePictureUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-20 w-20',
    lg: 'h-24 w-24',
    xl: 'h-32 w-32'
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de archivo no permitido. Solo JPEG, PNG y WebP';
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'El archivo es demasiado grande. Máximo 5MB';
    }

    return null;
  };

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId.toString());

      const response = await fetch('/api/user/profile-picture', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onPictureUpdate(data.profile_picture_url);
        toast.success('Foto de perfil actualizada exitosamente');
      } else {
        toast.error(data.error || 'Error al subir la foto');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Error al subir la foto de perfil');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Limpiar el input
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDeletePhoto = async () => {
    setUploading(true);

    try {
      const response = await fetch(`/api/user/profile-picture?user_id=${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        onPictureDelete();
        toast.success('Foto de perfil eliminada exitosamente');
      } else {
        toast.error(data.error || 'Error al eliminar la foto');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Error al eliminar la foto de perfil');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isCustomPicture = currentPictureUrl && !currentPictureUrl.includes('googleusercontent.com');

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Avatar con drag & drop */}
      <div
        className={`relative ${sizeClasses[size]} rounded-full transition-all duration-200 ${
          isDragOver ? 'ring-4 ring-blue-500 ring-opacity-50 scale-105' : ''
        } ${uploading ? 'opacity-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Avatar className={`${sizeClasses[size]} cursor-pointer`} onClick={triggerFileInput}>
          <AvatarImage src={currentPictureUrl} alt={userName} />
          <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            {getUserInitials(userName)}
          </AvatarFallback>
        </Avatar>
        
        {/* Overlay de carga */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
          </div>
        )}

        {/* Indicador de drag over */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center border-2 border-blue-500 border-dashed">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
        )}
      </div>
      
      {/* Controles */}
      <div className="flex flex-col gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={triggerFileInput}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
              Subiendo...
            </>
          ) : (
            <>
              <Camera className="h-3 w-3 mr-1" />
              Cambiar foto
            </>
          )}
        </Button>
        
        {allowDelete && isCustomPicture && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleDeletePhoto}
            disabled={uploading}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Eliminar
          </Button>
        )}
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {/* Ayuda visual */}
      <p className="text-xs text-gray-500 text-center max-w-32">
        Haz clic o arrastra una imagen aquí
      </p>
    </div>
  );
}
