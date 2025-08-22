"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, ImageIcon, Trash2, Eye, Edit, Save, XCircle, Download } from "lucide-react"
import ApiService from "@/lib/api-service"

interface PatientImageGalleryProps {
  patientId: number
  images: string[]
  onImagesChange: () => void
}

interface ImageComment {
  [imagePath: string]: string
}

export function PatientImageGallery({ patientId, images, onImagesChange }: PatientImageGalleryProps) {
  // DEBUG: Mostrar el array de imágenes en consola
  console.log("[PatientImageGallery] images:", images)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>("")
  const [selectedImage, setSelectedImage] = useState<any | null>(null)
  const [imageComments, setImageComments] = useState<ImageComment>({})
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [tempComment, setTempComment] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load comments from images when images change
  useEffect(() => {
    const newComments: ImageComment = {};
    
    images.forEach((image) => {
      const imageKey = getImageKey(image);
      if (typeof image === 'object' && image && (image as any).comment) {
        newComments[imageKey] = (image as any).comment;
      }
    });
    
    setImageComments(newComments);
  }, [images]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress("Subiendo imagen...")

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

        setUploadProgress(`Subiendo ${file.name}...`)
        console.log(`🔄 [GALLERY] Starting upload for file: ${file.name}, size: ${file.size}`);
        
        const response = await ApiService.uploadPatientImage(patientId, file)
        console.log(`📡 [GALLERY] Upload response:`, response);
        
        if (response.error) {
          console.error(`❌ [GALLERY] Upload failed:`, response.error);
          throw new Error(response.error)
        } else {
          console.log(`✅ [GALLERY] Upload successful:`, response);
        }
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
      setUploadProgress(`Error: ${error instanceof Error ? error.message : "Error desconocido"}`)
      setTimeout(() => setUploadProgress(""), 3000)
    } finally {
      setIsUploading(false)
    }
  }
  const handleDeleteImage = async (image: any) => {
    // Extract filename from image object
    const imageName = (typeof image === 'object' && image.filename) ? image.filename : 
                     (typeof image === 'string' ? image.split(/[/\\]/).pop() : "");
    
    if (!imageName) return

    console.log('Deleting image:', { image, imageName }) // Debug log

    if (window.confirm("¿Estás seguro de que quieres eliminar esta imagen?")) {
      try {
        const response = await ApiService.deletePatientImage(patientId, imageName)
        if (response.error) {
          throw new Error(response.error)
        }
        
        // Remove comment for deleted image
        const imageKey = getImageKey(image);
        setImageComments(prev => {
          const newComments = { ...prev }
          delete newComments[imageKey]
          return newComments
        })
        
        onImagesChange() // Refresh images list
      } catch (error) {
        console.error("Error deleting image:", error)
        alert(`Error al eliminar la imagen: ${error instanceof Error ? error.message : "Error desconocido"}`)
      }
    }
  }

  const getImageKey = (image: any): string => {
    if (typeof image === 'object' && image) {
      return image.url || image.filename || image.id?.toString() || '';
    }
    return typeof image === 'string' ? image : '';
  }

  const getImageUrl = (image: any) => {
    // If image is an object with url property, use it directly
    if (typeof image === 'object' && image.url) {
      return image.url;
    }
    // Fallback for legacy string paths
    if (typeof image === 'string') {
      return ApiService.getImageUrl(image);
    }
    return "";
  }

  const handleImageClick = (image: any) => {
    setSelectedImage(image)
  }

  const handleCloseModal = () => {
    setSelectedImage(null)
  }

  const handleDownloadImage = (image: any) => {
    const imageUrl = getImageUrl(image)
    const fileName = (typeof image === 'object' && image.original_name) ? 
                    image.original_name : 
                    (typeof image === 'object' && image.filename) ? 
                    image.filename : 
                    (typeof image === 'string' ? image.split(/[/\\]/).pop() : 'image.jpg') || 'image.jpg'
    
    // Create a temporary link to download the image
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleEditComment = (image: any) => {
    const imageKey = getImageKey(image);
    setEditingComment(imageKey)
    setTempComment(imageComments[imageKey] || "")
  }

  const handleSaveComment = async (image: any) => {
    const imageKey = getImageKey(image);
    
    try {
      // Get the filename from the image object
      const filename = typeof image === 'object' && image ? image.filename : image;
      
      // Save comment to server
      const result = await ApiService.updateImageComment(patientId, filename, tempComment);
      
      if (result.error) {
        alert(`Error saving comment: ${result.error}`);
        return;
      }
      
      // Update local state
      setImageComments(prev => ({
        ...prev,
        [imageKey]: tempComment
      }))
      setEditingComment(null)
      setTempComment("")
      
      // Refresh images to get updated data
      onImagesChange();
    } catch (error) {
      console.error("Error saving comment:", error);
      alert("Error saving comment");
    }
  }

  const handleCancelComment = () => {
    setEditingComment(null)
    setTempComment("")
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image, index) => (
                <div key={`image-${index}`} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                  {/* Image Container */}
                  <div className="relative group">
                    <div 
                      className="aspect-square bg-gray-100 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleImageClick(image)}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback for broken images
                          e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM5Ljc5IDI2IDggMTQuMjEgOCAxMkM4IDkuNzkgOS43OSA4IDEyIDhDMTQuMjEgOCAxNiA5Ljc5IDE2IDEyQzE2IDE0LjIxIDE0LjIxIDE2IDEyIDE2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K"
                        }}
                      />
                    </div>
                    
                    {/* Action Buttons Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleImageClick(image)
                          }}
                          title="Ver imagen completa"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditComment(image)
                          }}
                          title="Editar comentario"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteImage(image)
                          }}
                          title="Eliminar imagen"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Comment Section */}
                  <div className="p-3 border-t bg-gray-50">
                    {editingComment === getImageKey(image) ? (
                      <div className="space-y-2">
                        <Textarea
                          value={tempComment}
                          onChange={(e) => setTempComment(e.target.value)}
                          placeholder="Agregar comentario o descripción..."
                          className="min-h-[60px] text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSaveComment(image)}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Guardar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCancelComment}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="cursor-pointer group flex items-start justify-between"
                        onClick={() => handleEditComment(image)}
                      >
                        <div className="flex-1">
                          {imageComments[getImageKey(image)] ? (
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {imageComments[getImageKey(image)]}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              Click para agregar comentario...
                            </p>
                          )}
                        </div>
                        <Edit className="h-3 w-3 text-gray-400 group-hover:text-gray-600 ml-2 flex-shrink-0" />
                      </div>
                    )}
                  </div>
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
      
      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={handleCloseModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            <img
              src={getImageUrl(selectedImage)}
              alt="Imagen completa"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Close button */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4"
              onClick={handleCloseModal}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Comment display/edit in modal */}
            <div className="absolute bottom-20 left-4 right-4 bg-white bg-opacity-90 rounded-lg p-3">
              {editingComment === selectedImage ? (
                <div className="space-y-2">
                  <Textarea
                    value={tempComment}
                    onChange={(e) => setTempComment(e.target.value)}
                    placeholder="Agregar comentario o descripción..."
                    className="min-h-[60px] text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSaveComment(selectedImage)}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Guardar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelComment}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="cursor-pointer group flex items-start justify-between"
                  onClick={() => handleEditComment(selectedImage)}
                >
                  <div className="flex-1">
                    {imageComments[selectedImage] ? (
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {imageComments[selectedImage]}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        Click para agregar comentario...
                      </p>
                    )}
                  </div>
                  <Edit className="h-3 w-3 text-gray-400 group-hover:text-gray-600 ml-2 flex-shrink-0" />
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownloadImage(selectedImage)
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteImage(selectedImage)
                  handleCloseModal()
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
