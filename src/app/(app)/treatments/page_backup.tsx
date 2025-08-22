"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ApiService from "@/lib/api-service";
import AuthService from "@/lib/auth-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Stethoscope, DollarSign, TrendingUp, Edit, Trash2, Plus, Package } from "lucide-react";

interface Treatment {
  id: number;
  nombre: string;
  costo_unitario?: number;
  precio?: number;
  precio_base?: number;
  descripcion?: string;
  duracion_minutos?: number;
  activo?: boolean;
}

export default function TreatmentsPage() {
  const router = useRouter();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Verificar autenticación al cargar la página
    const authenticated = AuthService.isAuthenticated();
    setIsAuthenticated(authenticated);
    
    if (authenticated) {
      fetchTreatments();
    }
  }, []);

  const fetchTreatments = async () => {
    setLoading(true);
    setError(""); // Limpiar errores previos
    const { data, error } = await ApiService.getTreatments();
    if (error) {
      // Si el error es de autenticación, redirigir al login
      if (error.includes("Unauthorized") || error.includes("401")) {
        AuthService.logout();
        router.push('/login');
        return;
      }
      setError(error);
    } else if (data) {
      setTreatments(data);
    }
    setLoading(false);
  };

  // Si no está autenticado, mostrar mensaje de login
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Tratamientos</h1>
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Acceso Requerido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Necesitas iniciar sesión para ver los tratamientos.
                </p>
                <Button asChild className="w-full">
                  <Link href="/login">
                    Iniciar Sesión
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const handleDeleteTreatment = async (treatmentId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este tratamiento? Esta acción no se puede deshacer.")) {
      return;
    }    try {
      const response = await ApiService.deleteTreatment(treatmentId);
      if (response.error) {
        alert(`Error al eliminar el tratamiento: ${response.error}`);
        return;
      }
      
      // Actualizar la lista de tratamientos
      setTreatments(treatments.filter(t => t.id !== treatmentId));
      alert("Tratamiento eliminado exitosamente");
    } catch (error) {
      console.error("Error al eliminar tratamiento:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      alert(`Error al eliminar el tratamiento: ${errorMessage}`);
    }
  };
  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Tratamientos
            </h1>
            <p className="text-gray-600">Administra los tratamientos disponibles</p>
          </div>
        </div>
        <Link href="/treatments/new">
          <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Tratamiento
          </Button>
        </Link>
      </div>      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">Cargando tratamientos...</div>
        </div>
      )}
      
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {treatments.map((treatment) => (
            <Card key={treatment.id} className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Stethoscope className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">{treatment.nombre}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                      <DollarSign className="h-3 w-3" />
                      Costo unitario
                    </div>
                    <p className="font-bold text-blue-900">
                      ${(treatment.costo_unitario || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
                      <DollarSign className="h-3 w-3" />
                      Precio
                    </div>
                    <p className="font-bold text-green-900">
                      ${(treatment.precio || treatment.precio_base || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-200">
                  <div className="flex items-center gap-2 text-sm text-amber-700 mb-1">
                    <TrendingUp className="h-3 w-3" />
                    Ganancia
                  </div>
                  <p className="font-bold text-amber-900">
                    {(() => {
                      const precio = treatment.precio || treatment.precio_base || 0;
                      const costo = treatment.costo_unitario || 0;
                      const ganancia = precio - costo;
                      const porcentaje = precio > 0 ? (ganancia / precio * 100) : 0;
                      return (
                        <>
                          ${ganancia.toFixed(2)} 
                          <span className="text-sm font-normal text-amber-700 ml-2">
                            ({porcentaje.toFixed(1)}%)
                          </span>
                        </>
                      );
                    })()}
                  </p>
                </div>
                
                {treatment.descripcion && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{treatment.descripcion}</p>
                  </div>
                )}
                  <div className="flex gap-2 pt-2">
                  <Link href={`/treatments/${treatment.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full hover:bg-blue-50 hover:border-blue-200">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </Link>
                  {(treatment.costo_unitario || 0) > 0 && (
                    <Link href={`/treatments/${treatment.id}/inventory`}>
                      <Button variant="outline" size="sm" className="hover:bg-indigo-50 hover:border-indigo-200">
                        <Package className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteTreatment(treatment.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
