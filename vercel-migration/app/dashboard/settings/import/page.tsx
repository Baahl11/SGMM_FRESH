'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Download, Upload, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ImportResult {
  success: number;
  errors: Array<{ row: number; field: string; message: string }>;
  total: number;
}

export default function ImportDataPage() {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
      alert('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV');
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setShowPreview(false);

    // Aquí parsearías el archivo para preview
    // Por ahora solo mostramos el nombre
    console.log('Archivo seleccionado:', selectedFile.name);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No estás autenticado');
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      // Call API
      const response = await fetch('/api/import/data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al importar datos');
      }

      const data = await response.json();
      setResult(data);
      setProgress(100);
    } catch (error: any) {
      alert('Error: ' + error.message);
      setProgress(0);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Download Excel template from API
    window.open('/api/import/template', '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Importar Datos</h2>
        <p className="text-muted-foreground mt-2">
          Importa tus pacientes y citas desde Excel de forma sencilla
        </p>
      </div>

      {/* Instrucciones */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>¿Cómo funciona?</strong>
          <ol className="list-decimal ml-4 mt-2 space-y-1">
            <li>Descarga la plantilla Excel</li>
            <li>Llena tus datos (Pacientes y opcionalmente Citas)</li>
            <li>Sube el archivo y revisa la vista previa</li>
            <li>Confirma la importación</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Descargar Plantilla */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Paso 1: Descargar Plantilla
          </CardTitle>
          <CardDescription>
            Descarga nuestra plantilla Excel con ejemplos de cómo llenar tus datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Descargar Plantilla Excel
          </Button>
          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">La plantilla incluye:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li><strong>Pestaña 1 - PACIENTES:</strong> Nombre, Teléfono, Email, Fecha de Nacimiento, Notas</li>
              <li><strong>Pestaña 2 - CITAS:</strong> Nombre del Paciente, Fecha, Hora, Tratamiento, Estado (Opcional)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Subir Archivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Paso 2: Subir Archivo
          </CardTitle>
          <CardDescription>
            Sube el archivo Excel con tus datos completados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={importing}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {file ? file.name : 'Haz clic o arrastra tu archivo aquí'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos soportados: Excel (.xlsx, .xls) o CSV
                </p>
              </div>
            </label>
          </div>

          {file && !importing && !result && (
            <div className="flex gap-2">
              <Button onClick={handleImport} className="flex-1">
                <Upload className="mr-2 h-4 w-4" />
                Importar Datos
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setShowPreview(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          )}

          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importando datos...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      {result && (
        <Card className={result.errors.length > 0 ? 'border-orange-500' : 'border-green-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.errors.length === 0 ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Importación Exitosa
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Importación Completada con Advertencias
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{result.success}</p>
                <p className="text-sm text-muted-foreground">Registros importados</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{result.errors.length}</p>
                <p className="text-sm text-muted-foreground">Errores</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{result.total}</p>
                <p className="text-sm text-muted-foreground">Total procesados</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium">Errores encontrados:</p>
                <div className="max-h-48 overflow-y-auto space-y-1 text-sm">
                  {result.errors.map((error, index) => (
                    <div key={index} className="p-2 bg-orange-50 rounded text-orange-900">
                      Fila {error.row}: {error.field} - {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                setFile(null);
                setResult(null);
                window.location.reload();
              }}
              className="w-full"
            >
              Importar otro archivo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ayuda */}
      <Card>
        <CardHeader>
          <CardTitle>¿Necesitas Ayuda?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p className="font-medium">Consejos para una importación exitosa:</p>
            <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
              <li>No modifiques los nombres de las columnas en la plantilla</li>
              <li>El nombre del paciente es obligatorio</li>
              <li>Las fechas deben estar en formato DD/MM/YYYY</li>
              <li>Los teléfonos pueden incluir o no el código de país</li>
              <li>Si tienes dudas, deja el campo vacío en lugar de poner datos incorrectos</li>
            </ul>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>¿Tienes muchos datos?</strong> Podemos ayudarte con la migración de forma personalizada. 
              Contáctanos a <a href="mailto:soporte@agendamedpro.com" className="underline">soporte@agendamedpro.com</a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
