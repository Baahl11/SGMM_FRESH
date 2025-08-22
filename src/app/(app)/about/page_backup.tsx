export default function AboutPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Acerca del Sistema</h1>
      <p>Sistema de Gestión Médica Moderna (SGMM)</p>
      <p>Desarrollado para optimizar la gestión de consultorios médicos</p>
    </div>
  )
}      {/* Main Info Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-gray-900">Nuestra Misión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Desarrollar soluciones tecnológicas innovadoras que simplifiquen la gestión de consultorios médicos,
              mejorando la eficiencia y optimizando los procesos administrativos.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-gray-900">Nuestro Enfoque</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Nos especializamos en crear software médico personalizado, utilizando las mejores prácticas
              de desarrollo y tecnologías modernas para cada proyecto.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
              <Award className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-gray-900">Calidad y Experiencia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Años de experiencia en desarrollo de software, especializados en sistemas de gestión médica
              con enfoque en usabilidad y eficiencia.
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Contact Information */}
      <Card className="bg-white shadow-sm border border-blue-200">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">Información de Contacto</CardTitle>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            ¿Necesitas una solución tecnológica para tu consultorio médico?
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Correo Electrónico</p>
                  <a 
                    href="mailto:gmelgarejom@gmail.com" 
                    className="text-sm text-primary hover:underline"
                  >
                    gmelgarejom@gmail.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Especialidad</p>
                  <p className="text-sm text-muted-foreground">Software médico a la medida</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Disponibilidad</p>
                  <p className="text-sm text-muted-foreground">Consultas y desarrollo personalizado</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Award className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Experiencia</p>
                  <p className="text-sm text-muted-foreground">Sistemas de gestión médica</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">Desarrollo Web</Badge>
              <Badge variant="secondary">Sistemas Médicos</Badge>
              <Badge variant="secondary">Bases de Datos</Badge>
              <Badge variant="secondary">APIs REST</Badge>
              <Badge variant="secondary">React/Next.js</Badge>
              <Badge variant="secondary">Python/FastAPI</Badge>
            </div>
            
            <Button asChild className="w-full md:w-auto">
              <a href="mailto:gmelgarejom@gmail.com">
                <Mail className="h-4 w-4 mr-2" />
                Contactar para Desarrollo
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Technology Stack */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Tecnologías Utilizadas en SGMM
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Este sistema fue desarrollado utilizando tecnologías modernas y robustas
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Frontend</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Next.js 14 con App Router</p>
                <p>• React 18 con TypeScript</p>
                <p>• Tailwind CSS para estilos</p>
                <p>• Shadcn/ui para componentes</p>
                <p>• Lucide React para iconos</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Backend</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• FastAPI con Python</p>
                <p>• SQLAlchemy ORM</p>
                <p>• PostgreSQL Database</p>
                <p>• Alembic para migraciones</p>
                <p>• JWT para autenticación</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Características del Sistema</h4>
            <div className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
              <p>✓ Gestión completa de pacientes</p>
              <p>✓ Control de tratamientos y costos</p>
              <p>✓ Sistema de pagos con comisiones</p>
              <p>✓ Reportes financieros en tiempo real</p>
              <p>✓ Dashboard analítico</p>
              <p>✓ Interfaz responsive y moderna</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center py-8 border-t">
        <p className="text-sm text-muted-foreground">
          Sistema de Gestión Médica Moderna (SGMM) © {new Date().getFullYear()}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Desarrollado con ❤️ para optimizar la gestión de consultorios médicos
        </p>
      </div>
    </div>
  );
}
