"use client"

import { useState, useRef, useEffect } from "react"
import { Edit2, Check, X, AlertCircle } from "lucide-react"

interface InlineEditFieldProps {
  label: string
  value: string | null
  onSave: (value: string) => Promise<void>
  type?: "text" | "email" | "tel" | "date"
  placeholder?: string
  required?: boolean
  validate?: (value: string) => string | null // Returns error message or null if valid
}

export function InlineEditField({
  label,
  value,
  onSave,
  type = "text",
  placeholder = "Click para agregar",
  required = false,
  validate
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || "")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    setError(null)

    // Validation
    if (required && !editValue.trim()) {
      setError("Este campo es requerido")
      return
    }

    if (validate) {
      const validationError = validate(editValue)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setIsSaving(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value || "")
    setError(null)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  const isEmpty = !value || value.trim() === ""

  if (isEditing) {
    return (
      <div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <input
              ref={inputRef}
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                error
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder={placeholder}
              disabled={isSaving}
            />
            {error && (
              <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
              title="Guardar"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              title="Cancelar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <div className="flex items-center gap-2 group">
        <p
          className={`font-medium ${
            isEmpty ? "text-gray-400 italic" : "text-gray-900"
          }`}
        >
          {isEmpty ? "No especificado" : value}
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className={`p-1 rounded-md transition-all ${
            isEmpty
              ? "text-yellow-600 hover:bg-yellow-50"
              : "text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100"
          }`}
          title={isEmpty ? "Agregar información" : "Editar"}
        >
          <Edit2 className="h-4 w-4" />
        </button>
        {isEmpty && (
          <span title="Información faltante">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </span>
        )}
      </div>
    </div>
  )
}
