'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

interface FileUploadFieldProps {
  fieldId: string;
  label: string;
  required?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  value: string[]; // Array of file URLs
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export function FileUploadField({
  fieldId,
  label,
  required = false,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  value,
  onChange,
  disabled = false,
}: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse existing URLs into file objects on mount
  useState(() => {
    if (value.length > 0) {
      const files = value.map((url) => {
        const filename = url.split('/').pop() || 'file';
        return {
          name: decodeURIComponent(filename),
          url,
          size: 0,
          type: 'unknown',
        };
      });
      setUploadedFiles(files);
    }
  });

  const validateFile = (file: File): string | null => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return `El archivo "${file.name}" excede el tamaño máximo de ${maxSizeMB}MB`;
    }

    // Check file type
    const fileType = file.type;
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    const isAccepted = acceptedTypes.some((type) => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return fileType.startsWith(category + '/');
      }
      if (type.startsWith('.')) {
        return fileExtension === type.toLowerCase();
      }
      return fileType === type;
    });

    if (!isAccepted) {
      return `El archivo "${file.name}" no es un tipo permitido`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const supabase = createClient();
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${randomStr}.${fileExt}`;
      const filePath = `form-uploads/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('form-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('form-files')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Check max files limit
    if (uploadedFiles.length + files.length > maxFiles) {
      toast.error(`Solo puedes subir un máximo de ${maxFiles} archivos`);
      return;
    }

    setUploading(true);

    const newFiles: UploadedFile[] = [];
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        continue;
      }

      // Upload file
      const url = await uploadFile(file);
      if (url) {
        newFiles.push({
          name: file.name,
          url,
          size: file.size,
          type: file.type,
        });
        newUrls.push(url);
      } else {
        toast.error(`Error al subir "${file.name}"`);
      }
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...uploadedFiles, ...newFiles];
      const updatedUrls = [...value, ...newUrls];
      
      setUploadedFiles(updatedFiles);
      onChange(updatedUrls);
      
      toast.success(`${newFiles.length} archivo(s) subido(s) correctamente`);
    }

    setUploading(false);
  };

  const removeFile = async (index: number) => {
    const fileToRemove = uploadedFiles[index];
    
    try {
      // Optional: Delete from Supabase Storage
      const supabase = createClient();
      const filePath = fileToRemove.url.split('/form-files/')[1];
      
      if (filePath) {
        await supabase.storage.from('form-files').remove([`form-uploads/${filePath}`]);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    const updatedUrls = value.filter((_, i) => i !== index);
    
    setUploadedFiles(updatedFiles);
    onChange(updatedUrls);
    
    toast.success('Archivo eliminado');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploading) return;

    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const canUploadMore = uploadedFiles.length < maxFiles;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Upload Area */}
      {canUploadMore && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
          } ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleChange}
            disabled={disabled || uploading}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center text-center">
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Subiendo archivos...</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    Haz clic para subir
                  </span>{' '}
                  o arrastra archivos aquí
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Máximo {maxFiles} archivos, hasta {maxSizeMB}MB cada uno
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {acceptedTypes.includes('image/*') && 'Imágenes, '}
                  {acceptedTypes.includes('application/pdf') && 'PDF, '}
                  {acceptedTypes.includes('.doc') && 'Word'}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {uploadedFiles.length} de {maxFiles} archivo(s) subido(s)
          </p>
          
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <FileIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </p>
                  {file.size > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  )}
                </div>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={disabled || uploading}
                className="ml-2 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {!canUploadMore && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Has alcanzado el límite máximo de archivos
        </p>
      )}
    </div>
  );
}
