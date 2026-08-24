'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  FileText, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  Wrench,
  ShoppingCart,
  Briefcase,
  Megaphone,
  GraduationCap,
  Laptop,
  Plane,
  MoreHorizontal
} from 'lucide-react';

interface GastoVariable {
  id?: number;
  concepto: string;
  descripcion?: string;
  categoria: string;
  monto: number;
  fecha: string;
  metodo_pago?: string;
  proveedor?: string;
  proveedor_rfc?: string;
  proveedor_telefono?: string;
  proveedor_email?: string;
  factura_numero?: string;
  factura_url?: string;
  factura_tipo?: string;
  es_deducible: boolean;
  notas?: string;
  tags?: string[];
  estado: string;
}

interface GastoVariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gasto?: GastoVariable | null;
}

const CATEGORIAS = [
  { value: 'reparacion', label: 'Reparación', icon: Wrench },
  { value: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
  { value: 'compras_equipo', label: 'Compra de Equipo', icon: ShoppingCart },
  { value: 'insumos_extraordinarios', label: 'Insumos Extraordinarios', icon: ShoppingCart },
  { value: 'servicios_profesionales', label: 'Servicios Profesionales', icon: Briefcase },
  { value: 'marketing', label: 'Marketing', icon: Megaphone },
  { value: 'capacitacion', label: 'Capacitación', icon: GraduationCap },
  { value: 'tecnologia', label: 'Tecnología', icon: Laptop },
  { value: 'viajes', label: 'Viajes', icon: Plane },
  { value: 'otros', label: 'Otros', icon: MoreHorizontal },
];

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'cheque', label: 'Cheque' },
];

const TIPOS_FACTURA = [
  { value: 'fiscal', label: 'Fiscal (CFDI)' },
  { value: 'simple', label: 'Ticket/Recibo' },
  { value: 'ninguna', label: 'Sin factura' },
];

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'pagado', label: 'Pagado' },
];

export default function GastoVariableModal({ isOpen, onClose, onSuccess, gasto }: GastoVariableModalProps) {
  const isEditing = !!gasto;
  
  // Form state
  const [formData, setFormData] = useState<Partial<GastoVariable>>({
    concepto: '',
    descripcion: '',
    categoria: 'otros',
    monto: 0,
    fecha: new Date().toISOString().split('T')[0],
    metodo_pago: 'transferencia',
    proveedor: '',
    proveedor_rfc: '',
    proveedor_telefono: '',
    proveedor_email: '',
    factura_numero: '',
    factura_tipo: 'simple',
    es_deducible: true,
    notas: '',
    tags: [],
    estado: 'pendiente',
  });

  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing gasto data
  useEffect(() => {
    if (gasto) {
      setFormData({
        ...gasto,
        tags: gasto.tags || [],
      });
    } else {
      // Reset form
      setFormData({
        concepto: '',
        descripcion: '',
        categoria: 'otros',
        monto: 0,
        fecha: new Date().toISOString().split('T')[0],
        metodo_pago: 'transferencia',
        proveedor: '',
        proveedor_rfc: '',
        proveedor_telefono: '',
        proveedor_email: '',
        factura_numero: '',
        factura_tipo: 'simple',
        es_deducible: true,
        notas: '',
        tags: [],
        estado: 'pendiente',
      });
      setFile(null);
      setError(null);
    }
  }, [gasto, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Tipo de archivo no válido. Solo PDF, JPG, PNG, WEBP');
        return;
      }
      
      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('El archivo es muy grande. Máximo 10MB');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file) return null;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/gastos-variables/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir archivo');
      }
      
      const data = await response.json();
      return data.url;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!formData.concepto?.trim()) {
      setError('El concepto es obligatorio');
      return;
    }
    
    if (!formData.monto || formData.monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    
    if (!formData.fecha) {
      setError('La fecha es obligatoria');
      return;
    }
    
    setSaving(true);
    
    try {
      // Upload file if exists
      let facturaUrl = formData.factura_url;
      if (file) {
        const uploadedUrl = await uploadFile();
        if (!uploadedUrl) {
          setSaving(false);
          return;
        }
        facturaUrl = uploadedUrl;
      }
      
      // Prepare data
      const dataToSend = {
        ...formData,
        factura_url: facturaUrl,
        monto: Number(formData.monto),
      };
      
      // Create or update
      const url = isEditing ? `/api/gastos-variables/${gasto.id}` : '/api/gastos-variables';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar gasto');
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Gasto Variable' : 'Nuevo Gasto Variable'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Información Básica</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="concepto">Concepto *</Label>
                <Input
                  id="concepto"
                  value={formData.concepto}
                  onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                  placeholder="Ej: Reparación equipo láser"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="categoria">Categoría *</Label>
                <Select 
                  value={formData.categoria} 
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select 
                  value={formData.estado} 
                  onValueChange={(value) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((estado) => (
                      <SelectItem key={estado.value} value={estado.value}>
                        {estado.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="monto">Monto (MXN) *</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción detallada del gasto..."
                  rows={2}
                />
              </div>
            </div>
          </div>
          
          {/* Información de pago */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Información de Pago</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metodo_pago">Método de Pago</Label>
                <Select 
                  value={formData.metodo_pago} 
                  onValueChange={(value) => setFormData({ ...formData, metodo_pago: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METODOS_PAGO.map((metodo) => (
                      <SelectItem key={metodo.value} value={metodo.value}>
                        {metodo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="es_deducible"
                  checked={formData.es_deducible}
                  onChange={(e) => setFormData({ ...formData, es_deducible: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="es_deducible" className="cursor-pointer">
                  Marcado deducible por usuario (referencia interna)
                </Label>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <Info className="h-4 w-4" />
                Evaluación SAT automática
              </div>
              <p>
                La clasificación final se calcula con criterios SAT/LISR (CFDI, RFC del proveedor y método de pago en montos mayores a $2,000).
              </p>
            </div>
          </div>
          
          {/* Proveedor */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Información del Proveedor</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proveedor">Nombre/Empresa</Label>
                <Input
                  id="proveedor"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                  placeholder="Ej: Tech Solutions SA de CV"
                />
              </div>
              
              <div>
                <Label htmlFor="proveedor_rfc">RFC</Label>
                <Input
                  id="proveedor_rfc"
                  value={formData.proveedor_rfc}
                  onChange={(e) => setFormData({ ...formData, proveedor_rfc: e.target.value.toUpperCase() })}
                  placeholder="XAXX010101000"
                  maxLength={13}
                />
              </div>
              
              <div>
                <Label htmlFor="proveedor_telefono">Teléfono</Label>
                <Input
                  id="proveedor_telefono"
                  value={formData.proveedor_telefono}
                  onChange={(e) => setFormData({ ...formData, proveedor_telefono: e.target.value })}
                  placeholder="5512345678"
                />
              </div>
              
              <div>
                <Label htmlFor="proveedor_email">Email</Label>
                <Input
                  id="proveedor_email"
                  type="email"
                  value={formData.proveedor_email}
                  onChange={(e) => setFormData({ ...formData, proveedor_email: e.target.value })}
                  placeholder="contacto@proveedor.com"
                />
              </div>
            </div>
          </div>
          
          {/* Facturación */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Facturación</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="factura_tipo">Tipo de Factura</Label>
                <Select 
                  value={formData.factura_tipo} 
                  onValueChange={(value) => setFormData({ ...formData, factura_tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_FACTURA.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="factura_numero">Número de Factura</Label>
                <Input
                  id="factura_numero"
                  value={formData.factura_numero}
                  onChange={(e) => setFormData({ ...formData, factura_numero: e.target.value })}
                  placeholder="UUID o folio del comprobante"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="factura_file">Subir Factura/Recibo (PDF, JPG, PNG, WEBP - Max 10MB)</Label>
                <div className="mt-2">
                  {formData.factura_url && !file ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-700">Factura existente</span>
                      <a 
                        href={formData.factura_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm ml-auto"
                      >
                        Ver archivo
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, factura_url: undefined })}
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : file ? (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-blue-700">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                      <input
                        id="factura_file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="factura_file" className="cursor-pointer">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Click para seleccionar archivo
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PDF, JPG, PNG o WEBP (máx. 10MB)
                        </p>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Tags y notas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Adicional</h3>
            
            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Agregar tag y presionar Enter"
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Agregar
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Notas adicionales sobre este gasto..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving || uploading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || uploading}>
              {(saving || uploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {uploading ? 'Subiendo archivo...' : saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
