"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar, Settings, Check, X, AlertCircle } from "lucide-react"
import googleCalendarService, { type CalendarConfig } from "@/lib/google-calendar"

interface GoogleCalendarSetupProps {
  onConfigurationChange?: (configured: boolean) => void
}

export function GoogleCalendarSetup({ onConfigurationChange }: GoogleCalendarSetupProps) {
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  
  const [formData, setFormData] = useState({
    serviceAccountKey: "",
    calendarId: "primary"
  })

  useEffect(() => {
    // Verificar si ya está configurado
    const configured = googleCalendarService.isConfigured()
    setIsConfigured(configured)
    
    if (configured) {
      const config = googleCalendarService.getConfig()
      setFormData((prev) => ({
        ...prev,
        calendarId: config.calendarId
      }))
    }
    
    onConfigurationChange?.(configured)
  }, [onConfigurationChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!formData.serviceAccountKey.trim()) {
        throw new Error("Por favor ingresa la clave de Service Account")
      }

      // Intentar inicializar el servicio
      await googleCalendarService.initialize(
        formData.serviceAccountKey,
        formData.calendarId
      )

      setIsConfigured(true)
      setSuccess("Google Calendar configurado exitosamente")
      onConfigurationChange?.(true)
      
      // Limpiar el campo de la clave por seguridad
      setFormData(prev => ({ ...prev, serviceAccountKey: "" }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al configurar Google Calendar")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    googleCalendarService.disconnect()
    setIsConfigured(false)
    setFormData({
      serviceAccountKey: "",
      calendarId: "primary"
    })
    setSuccess("Google Calendar desconectado")
    onConfigurationChange?.(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Integración con Google Calendar
          {isConfigured && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Check className="h-3 w-3 mr-1" />
              Configurado
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConfigured ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Google Calendar está configurado y funcionando
            </div>
            
            <div className="space-y-2">
              <Label>ID del Calendario</Label>
              <Input
                value={formData.calendarId}
                onChange={handleChange}
                name="calendarId"
                placeholder="primary"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Calendario actual: {formData.calendarId}
              </p>
            </div>

            <Button 
              variant="outline" 
              onClick={handleDisconnect}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Desconectar Google Calendar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calendarId">ID del Calendario</Label>
              <Input
                id="calendarId"
                name="calendarId"
                value={formData.calendarId}
                onChange={handleChange}
                placeholder="primary"
              />
              <p className="text-xs text-muted-foreground">
                Usa "primary" para el calendario principal, o el ID específico del calendario
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceAccountKey">Service Account Key (JSON)</Label>
              <Textarea
                id="serviceAccountKey"
                name="serviceAccountKey"
                value={formData.serviceAccountKey}
                onChange={handleChange}
                placeholder='{"type": "service_account", "project_id": "...", ...}'
                rows={6}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Pega aquí el contenido completo del archivo JSON de Service Account
              </p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Configurar Google Calendar
                </>
              )}
            </Button>
          </form>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-blue-900">Instrucciones de configuración:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Ve a <a href="https://console.cloud.google.com" target="_blank" className="underline">Google Cloud Console</a></li>
            <li>Crea un proyecto o selecciona uno existente</li>
            <li>Habilita la Google Calendar API</li>
            <li>Crea un Service Account y descarga el archivo JSON</li>
            <li>Comparte tu calendario con el email del Service Account</li>
            <li>Copia y pega el contenido del JSON aquí</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
