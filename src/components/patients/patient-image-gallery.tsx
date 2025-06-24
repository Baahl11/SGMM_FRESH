"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, ImageIcon, Trash2 } from "lucide-react"
import ApiService from "@/lib/api-service"

interface PatientImageGalleryProps {
  patientId: number
  images: string[]
  onImagesChange: () => void
}

export function PatientImageGallery({ patientId, images, onImagesChange }: PatientImageGalleryProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress("Preparando archivos...")

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`El archivo ${file.name} no es una imagen válida`)
          continue
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert(`El archivo ${file.name} es demasiado grande. Máximo 5MB.`)
          continue
        }

        setUploadProgress(`Subiendo ${file.name}... (${i + 1}/${files.length})`)
        
        const response = await ApiService.uploadPatientImage(patientId, file)
        
        if (response.error) {
          console.error(`Error uploading ${file.name}:`, response.error)
          throw new Error(`Error al subir ${file.name}: ${response.error}`)
        }
        
        console.log(`Successfully uploaded ${file.name}:`, response.data)
      }

      setUploadProgress("¡Imágenes subidas exitosamente!")
      onImagesChange() // Refresh images list
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      setTimeout(() => setUploadProgress(""), 2000)
    } catch (error) {
      console.error("Error uploading images:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al subir imágenes"
      setUploadProgress(`Error: ${errorMessage}`)
      setTimeout(() => setUploadProgress(""), 5000)
    } finally {
      setIsUploading(false)
    }
  }
  const handleDeleteImage = async (imagePath: string) => {
    // Extract only the filename from the path, handling both forward and backward slashes
    const imageName = imagePath.split(/[/\\]/).pop() || ""
    if (!imageName) return

    console.log('Deleting image:', { imagePath, imageName }) // Debug log

    if (window.confirm("¿Estás seguro de que quieres eliminar esta imagen?")) {
      try {
        const response = await ApiService.deletePatientImage(patientId, imageName)
        if (response.error) {
          throw new Error(response.error)
        }
        onImagesChange() // Refresh images list
      } catch (error) {
        console.error("Error deleting image:", error)
        alert(`Error al eliminar la imagen: ${error instanceof Error ? error.message : "Error desconocido"}`)
      }
    }
  }
  const getImageUrl = (imagePath: string) => {
    // Use ApiService helper method to get correct URL
    return ApiService.getImageUrl(imagePath)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Galería de Imágenes ({images.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
              <div>
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Subir imágenes
                  </span>
                  <Input
                    id="image-upload"
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="hidden"
                  />
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF hasta 5MB cada una
                </p>
              </div>
              {uploadProgress && (
                <p className={`text-sm ${uploadProgress.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {uploadProgress}
                </p>
              )}
            </div>
          </div>

          {/* Images Grid */}
          {images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((imagePath, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(imagePath)}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback for broken images
                        e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM5Ljc5IDI2IDggMTQuMjEgOCAxMkM4IDkuNzkgOS43OSA4IDEyIDhDMTQuMjEgOCAxNiA5Ljc5IDE2IDEyQzE2IDE0LjIxIDE0LjIxIDE2IDEyIDE2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K"
                      }}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteImage(imagePath)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-muted-foreground">No hay imágenes subidas</p>
              <p className="text-sm text-muted-foreground">
                Las imágenes ayudan a documentar el progreso del tratamiento
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
