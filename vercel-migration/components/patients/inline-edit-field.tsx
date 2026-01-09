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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-2">{label}</p>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <input
              ref={inputRef}
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 shadow-inner focus:outline-none focus:ring-2 ${
                error
                  ? "border-red-400/60 focus:ring-red-300"
                  : "border-white/20 focus:ring-emerald-300"
              }`}
              placeholder={placeholder}
              disabled={isSaving}
            />
            {error && (
              <div className="mt-2 flex items-center gap-1 text-sm text-red-300">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl border border-white/20 p-2 text-emerald-200 transition hover:bg-white/10 disabled:opacity-50"
              title="Guardar"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded-xl border border-white/20 p-2 text-rose-200 transition hover:bg-white/10 disabled:opacity-50"
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
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{label}</p>
      <div className="flex items-center gap-2 group">
        <p
          className={`font-semibold ${
            isEmpty ? "text-white/40 italic" : "text-white"
          }`}
        >
          {isEmpty ? "No especificado" : value}
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className={`rounded-xl border border-transparent p-1.5 text-white/50 transition ${
            isEmpty
              ? "text-amber-300 hover:border-amber-200/40 hover:bg-amber-500/10"
              : "opacity-0 group-hover:opacity-100 hover:border-white/20 hover:bg-white/10"
          }`}
          title={isEmpty ? "Agregar información" : "Editar"}
        >
          <Edit2 className="h-4 w-4" />
        </button>
        {isEmpty && (
          <span title="Información faltante">
            <AlertCircle className="h-4 w-4 text-amber-300" />
          </span>
        )}
      </div>
    </div>
  )
}
