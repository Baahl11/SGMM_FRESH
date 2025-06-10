"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Software a la Medida</h2>
              <p className="text-muted-foreground">
                Para contrataciones y pedidos de software personalizado, no dudes en contactarnos.
                Desarrollamos soluciones adaptadas a tus necesidades específicas.
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-lg">
              <Mail className="h-5 w-5" />
              <a 
                href="mailto:gmelgarejom@gmail.com"
                className="text-primary hover:underline"
              >
                gmelgarejom@gmail.com
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
