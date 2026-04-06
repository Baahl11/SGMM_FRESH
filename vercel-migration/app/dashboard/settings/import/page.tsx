'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Download, Upload, CheckCircle2, AlertCircle, Info, FileSpreadsheet } from 'lucide-react';

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
    <div className="space-y-8">
      {/* Header */}
      <GlassPanel className="relative overflow-hidden p-6 sm:p-8 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-blue-400/30 blur-[160px]" />
          <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-cyan-500/30 blur-[150px]" />
        </div>
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            <FileSpreadsheet className="h-4 w-4" />
            Importar Datos
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Importa tus pacientes y citas</h1>
            <p className="mt-2 text-sm text-white/70">Migra tu información desde Excel de forma rápida y sencilla</p>
          </div>
        </div>
      </GlassPanel>

      {/* Instrucciones */}
      <GlassPanel className="border-white/10 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 p-6 text-white">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-200 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="font-semibold">¿Cómo funciona?</p>
            <ol className="list-decimal ml-4 space-y-1 text-sm text-white/80">
              <li>Descarga la plantilla Excel</li>
              <li>Llena tus datos (Pacientes y opcionalmente Citas)</li>
              <li>Sube el archivo y revisa la vista previa</li>
              <li>Confirma la importación</li>
            </ol>
          </div>
        </div>
      </GlassPanel>

      {/* Descargar Plantilla */}
      <GlassPanel className="space-y-4 border-white/10 bg-white/5 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-3 shadow-lg">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Paso 1: Descargar Plantilla</h3>
            <p className="text-sm text-white/70">Descarga nuestra plantilla Excel con ejemplos</p>
          </div>
        </div>
        <Button onClick={downloadTemplate} variant="outline" className="w-full sm:w-auto border-white/20 bg-white/10 text-white hover:bg-white/20">
          <Download className="mr-2 h-4 w-4" />
          Descargar Plantilla Excel
        </Button>
        <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          <p className="font-medium mb-2 text-white">La plantilla incluye:</p>
          <ul className="space-y-1 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-blue-300">•</span>
              <span><strong className="text-white">Pestaña 1 - PACIENTES:</strong> Nombre, Teléfono, Email, Fecha de Nacimiento, Notas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-300">•</span>
              <span><strong className="text-white">Pestaña 2 - CITAS:</strong> Nombre del Paciente, Fecha, Hora, Tratamiento, Estado (Opcional)</span>
            </li>
          </ul>
        </div>
      </GlassPanel>

      {/* Subir Archivo */}
      <GlassPanel className="space-y-4 border-white/10 bg-white/5 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 p-3 shadow-lg">
            <Upload className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Paso 2: Subir Archivo</h3>
            <p className="text-sm text-white/70">Sube el archivo Excel con tus datos completados</p>
          </div>
        </div>
        <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center bg-white/5">
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
            <Upload className="h-12 w-12 text-white/60" />
            <div>
              <p className="text-sm font-medium text-white">
                {file ? file.name : 'Haz clic o arrastra tu archivo aquí'}
              </p>
              <p className="text-xs text-white/60 mt-1">
                Formatos soportados: Excel (.xlsx, .xls) o CSV
              </p>
            </div>
          </label>
        </div>

        {file && !importing && !result && (
          <div className="flex gap-2">
            <Button onClick={handleImport} className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
              <Upload className="mr-2 h-4 w-4" />
              Importar Datos
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setShowPreview(false);
              }}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
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
            <Progress value={progress} className="bg-white/10" />
          </div>
        )}
      </GlassPanel>

      {/* Resultados */}
      {result && (
        <GlassPanel className={`border-2 ${result.errors.length > 0 ? 'border-orange-500/50 bg-orange-500/10' : 'border-green-500/50 bg-green-500/10'} p-6 text-white`}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {result.errors.length === 0 ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                  <h3 className="text-lg font-semibold">Importación Exitosa</h3>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-orange-400" />
                  <h3 className="text-lg font-semibold">Importación Completada con Advertencias</h3>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-green-500/20 border border-green-500/30 p-4 text-center">
                <p className="text-3xl font-bold text-green-300">{result.success}</p>
                <p className="text-sm text-white/70 mt-1">Registros importados</p>
              </div>
              <div className="rounded-lg bg-orange-500/20 border border-orange-500/30 p-4 text-center">
                <p className="text-3xl font-bold text-orange-300">{result.errors.length}</p>
                <p className="text-sm text-white/70 mt-1">Errores</p>
              </div>
              <div className="rounded-lg bg-blue-500/20 border border-blue-500/30 p-4 text-center">
                <p className="text-3xl font-bold text-blue-300">{result.total}</p>
                <p className="text-sm text-white/70 mt-1">Total procesados</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium">Errores encontrados:</p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.errors.map((error, index) => (
                    <div key={index} className="rounded-lg bg-orange-500/20 border border-orange-500/30 p-3 text-sm">
                      <span className="font-medium">Fila {error.row}:</span> {error.field} - {error.message}
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
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              Importar otro archivo
            </Button>
          </div>
        </GlassPanel>
      )}

      {/* Ayuda */}
      <GlassPanel className="space-y-4 border-white/10 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 p-6 text-white">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-200" />
          ¿Necesitas Ayuda?
        </h3>
        <div className="space-y-2 text-sm text-white/80">
          <p className="font-medium text-white">Consejos para una importación exitosa:</p>
          <ul className="space-y-1 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-blue-300">•</span>
              <span>No modifiques los nombres de las columnas en la plantilla</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-300">•</span>
              <span>El nombre del paciente es obligatorio</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-300">•</span>
              <span>Las fechas deben estar en formato DD/MM/YYYY</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-300">•</span>
              <span>Los teléfonos pueden incluir o no el código de país</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-300">•</span>
              <span>Si tienes dudas, deja el campo vacío en lugar de poner datos incorrectos</span>
            </li>
          </ul>
        </div>
        
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <p className="text-sm flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-300 mt-0.5 flex-shrink-0" />
            <span>
              <strong className="text-white">¿Tienes muchos datos?</strong> Podemos ayudarte con la migración de forma personalizada. 
              Contáctanos a <a href="mailto:soporte@agendamedpro.com" className="underline text-blue-200 hover:text-blue-100">soporte@agendamedpro.com</a>
            </span>
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}
