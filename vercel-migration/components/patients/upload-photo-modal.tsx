"use client";

import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface UploadPhotoModalProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
}

export function UploadPhotoModal({
  open,
  onClose,
  patientId,
  patientName,
  onSuccess
}: UploadPhotoModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("progreso");
  const [isDragging, setIsDragging] = useState(false);

  const supabase = createClient();

  // Resetear formulario cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen no debe superar 10MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Selecciona una imagen");
      return;
    }

    setLoading(true);
    try {
      // 1. Obtener el user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("No autenticado");
        return;
      }

      // 2. Subir imagen a Supabase Storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${patientId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("patient-photos")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // 3. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("patient-photos")
        .getPublicUrl(fileName);

      // 4. Guardar metadata en base de datos
      const response = await fetch("/api/patient-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          url: publicUrl,
          descripcion,
          categoria,
        }),
      });

      if (response.ok) {
        toast.success("Foto subida exitosamente");
        onSuccess?.();
        onClose();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al guardar la foto");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al subir la foto");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescripcion("");
    setCategoria("progreso");
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Camera className="h-6 w-6 text-purple-600" />
            Subir Foto - {patientName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Drag & Drop Area */}
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-300 hover:border-purple-400"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Arrastra una imagen aquí
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                o haz clic para seleccionar
              </p>
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                id="file-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <Label htmlFor="file-upload" className="flex justify-center">
                <Button type="button" variant="outline" asChild>
                  <span className="cursor-pointer flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Seleccionar Imagen
                  </span>
                </Button>
              </Label>
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, JPEG hasta 10MB
              </p>
            </div>
          ) : (
            // Preview
            <div className="relative">
              <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                <img
                  src={previewUrl!}
                  alt="Preview"
                  className="w-full h-64 object-contain bg-gray-50"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                📷 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}

          {/* Categoría */}
          <div>
            <Label>Categoría</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { value: "progreso", label: "📊 Progreso", color: "blue" },
                { value: "antes", label: "⏪ Antes", color: "orange" },
                { value: "despues", label: "⏩ Después", color: "green" },
              ].map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategoria(cat.value)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    categoria === cat.value
                      ? `border-${cat.color}-500 bg-${cat.color}-50 text-${cat.color}-700`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <Label>Descripción</Label>
            <Textarea
              placeholder="Describe la foto (opcional)..."
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={loading || !selectedFile}
            >
              {loading ? "Subiendo..." : "Subir Foto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
