"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Stethoscope, DollarSign, TrendingUp, Edit, Trash2, Plus, Package } from "lucide-react";
import AppLayout from "@/components/layout/app-layout";
import { CategoryFilterTabs } from "@/components/treatments/category-filter";
import { CategoryBadgeList } from "@/components/treatments/category-badge";
import { TagsDisplay } from "@/components/treatments/tags-input";
import type { TreatmentCategory } from "@/lib/types/treatment";

// UI Components from shadcn/ui
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>{children}</div>
)

const CardHeader = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 pb-2 ${className}`}>{children}</div>
)

const CardTitle = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
)

const CardContent = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 pt-2 ${className}`}>{children}</div>
)

const Button = ({ children, className = "", variant = "default", size = "default", onClick = undefined, disabled = false, asChild = false }: any) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md transition-colors font-medium"
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
    destructive: "bg-red-600 text-white hover:bg-red-700"
  }
  const sizeClasses = {
    default: "px-4 py-2",
    sm: "px-3 py-1 text-sm"
  }
  
  if (asChild) {
    return <div className={`${baseClasses} ${variantClasses[variant as keyof typeof variantClasses]} ${sizeClasses[size as keyof typeof sizeClasses]} ${className}`}>{children}</div>
  }
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant as keyof typeof variantClasses]} ${sizeClasses[size as keyof typeof sizeClasses]} ${className}`} 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

interface Treatment {
  id: number;
  nombre: string;
  costo_unitario?: number;
  precio?: number;
  precio_base?: number;
  descripcion?: string;
  duracion_minutos?: number;
  activo?: boolean;
  category?: string | null;
  tags?: string[] | null;
}

export default function TreatmentsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<TreatmentCategory | 'all'>('all');
  const [searchTags, setSearchTags] = useState<string>('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingAuth(false);
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      fetchTreatments();
    };

    getUser();
  }, [router]);

  // Reload treatments when filters change
  useEffect(() => {
    if (user) {
      fetchTreatments();
    }
  }, [selectedCategory, searchTags]);

  const fetchTreatments = async () => {
    setLoading(true);
    setError(""); // Limpiar errores previos
    try {
      console.log("🏥 Loading treatments...");
      
      // Build query params
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchTags) {
        params.append('tags', searchTags);
      }
      
      const url = `/api/treatments${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setTreatments(data)
        console.log("✅ Treatments loaded:", data.length);
      } else {
        console.error('Expected array, got:', data)
        setTreatments([])
      }
    } catch (error: any) {
      // Si el error es de autenticación, redirigir al login
      if (error.message?.includes("Unauthorized") || error.message?.includes("401")) {
        router.push('/auth/signin');
        return;
      }
      setError(error.message || "Error loading treatments");
      console.error("❌ Error loading treatments:", error);
    }
    setLoading(false);
  };

  // Show loading spinner while checking authentication
  if (loadingAuth || loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir
  if (!user) {
    return null;
  }

  const handleDeleteTreatment = async (treatmentId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este tratamiento? Esta acción no se puede deshacer.")) {
      return;
    }
    
    try {
      console.log("🗑️ Deleting treatment...", treatmentId);
      const response = await fetch(`/api/treatments/${treatmentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Actualizar la lista de tratamientos
      setTreatments(treatments.filter(t => t.id !== treatmentId));
      console.log("✅ Treatment deleted:", treatmentId);
      alert("Tratamiento eliminado exitosamente");
    } catch (error) {
      console.error("❌ Error deleting treatment:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      alert(`Error al eliminar el tratamiento: ${errorMessage}`);
    }
  };

  return (
    <AppLayout>
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
      </div>

      {/* Category Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <CategoryFilterTabs
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      {loading && (
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
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900">{treatment.nombre}</CardTitle>
                  </div>
                  {treatment.category && (
                    <CategoryBadgeList category={treatment.category as TreatmentCategory} />
                  )}
                </div>
                {treatment.tags && treatment.tags.length > 0 && (
                  <TagsDisplay tags={treatment.tags} className="mt-2" />
                )}
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
                  {/* TODO: Implementar página de inventory por tratamiento
                  {(treatment.costo_unitario || 0) > 0 && (
                    <Link href={`/treatments/${treatment.id}/inventory`}>
                      <Button variant="outline" size="sm" className="hover:bg-indigo-50 hover:border-indigo-200">
                        <Package className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  */}
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
    </AppLayout>
  );
}