"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, Stethoscope, DollarSign, UserPlus, FileText, Settings, PieChart } from "lucide-react"

export default function Home() {
  return (
    <div>
      {/* Header */}
      <div className="text-center mb-20 max-w-4xl mx-auto px-4">
        <div className="inline-block p-2 px-4 mb-4 rounded-full bg-brand-100 text-brand-600">
          <span className="text-sm font-medium">Sistema de Gestión Médica</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
          UME López & López
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Sistema de gestión integral para consultorios médicos, diseñado para optimizar la administración de pacientes, tratamientos y registros médicos.
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-20 px-4">
        {/* Pacientes Card */}
        <Card className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">0</div>
            <p className="text-sm text-muted-foreground mb-4">
              Total de pacientes registrados
            </p>
            <Button asChild className="w-full bg-brand-300 hover:bg-brand-400 text-gray-800">
              <Link href="/patients" className="flex items-center justify-center space-x-2">
                <span>Ver todos los pacientes</span>
                <span className="sr-only">→</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Tratamientos Card */}
        <Card className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Tratamientos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">0</div>
            <p className="text-sm text-muted-foreground mb-4">
              Tratamientos disponibles
            </p>
            <Button asChild className="w-full bg-brand-300 hover:bg-brand-400 text-gray-800">
              <Link href="/treatments" className="flex items-center justify-center space-x-2">
                <span>Gestionar tratamientos</span>
                <span className="sr-only">→</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Ingresos Card */}
        <Card className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">$0.00</div>
            <p className="text-sm text-muted-foreground mb-4">
              Total de ingresos del mes
            </p>
            <Button asChild className="w-full bg-brand-300 hover:bg-brand-400 text-gray-800">
              <Link href="/records" className="flex items-center justify-center space-x-2">
                <span>Ver todos los registros</span>
                <span className="sr-only">→</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-2xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold mb-8 text-center">Acciones Rápidas</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Button asChild className="h-auto py-6 text-lg font-semibold bg-brand-300 hover:bg-brand-400 text-gray-800">
            <Link href="/patients/new" className="flex flex-col items-center gap-2">
              <UserPlus className="h-6 w-6" />
              <span>Registrar Paciente</span>
            </Link>
          </Button>
          <Button asChild className="h-auto py-6 text-lg font-semibold bg-brand-300 hover:bg-brand-400 text-gray-800">
            <Link href="/records/new" className="flex flex-col items-center gap-2">
              <FileText className="h-6 w-6" />
              <span>Nuevo Registro</span>
            </Link>
          </Button>
          <Button asChild className="h-auto py-6 text-lg font-semibold bg-brand-300 hover:bg-brand-400 text-gray-800">
            <Link href="/treatments" className="flex flex-col items-center gap-2">
              <Settings className="h-6 w-6" />
              <span>Gestionar Tratamientos</span>
            </Link>
          </Button>
          <Button asChild className="h-auto py-6 text-lg font-semibold bg-brand-300 hover:bg-brand-400 text-gray-800">
            <Link href="/reports" className="flex flex-col items-center gap-2">
              <PieChart className="h-6 w-6" />
              <span>Ver Reportes</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
