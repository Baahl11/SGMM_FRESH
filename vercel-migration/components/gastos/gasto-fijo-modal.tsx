'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';

interface GastoFijo {
  id: number;
  concepto: string;
  monto: number;
  frecuencia: string;
  activo: boolean;
  fecha_inicio: string;
  notas?: string;
}

interface GastoFijoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gasto?: GastoFijo | null;
}

export default function GastoFijoModal({ isOpen, onClose, onSuccess, gasto }: GastoFijoModalProps) {
  const isEditing = !!gasto;
  
  const [formData, setFormData] = useState({
    concepto: '',
    monto: 0,
    frecuencia: 'mensual',
    fecha_inicio: new Date().toISOString().split('T')[0],
    notas: '',
    activo: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gasto) {
      setFormData({
        concepto: gasto.concepto,
        monto: gasto.monto,
        frecuencia: gasto.frecuencia,
        fecha_inicio: gasto.fecha_inicio,
        notas: gasto.notas || '',
        activo: gasto.activo,
      });
    } else {
      setFormData({
        concepto: '',
        monto: 0,
        frecuencia: 'mensual',
        fecha_inicio: new Date().toISOString().split('T')[0],
        notas: '',
        activo: true,
      });
    }
    setError(null);
  }, [gasto, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.concepto?.trim()) {
      setError('El concepto es obligatorio');
      return;
    }
    
    if (!formData.monto || formData.monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    
    setSaving(true);
    
    try {
      const url = isEditing ? `/api/gastos-fijos/${gasto.id}` : '/api/gastos-fijos';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          monto: Number(formData.monto),
        }),
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          <div>
            <Label htmlFor="concepto">Concepto *</Label>
            <Input
              id="concepto"
              value={formData.concepto}
              onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
              placeholder="Ej: Renta del consultorio"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="frecuencia">Frecuencia *</Label>
              <Select 
                value={formData.frecuencia} 
                onValueChange={(value) => setFormData({ ...formData, frecuencia: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
            <Input
              id="fecha_inicio"
              type="date"
              value={formData.fecha_inicio}
              onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Información adicional sobre este gasto..."
              rows={3}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="activo" className="cursor-pointer">
              Gasto activo (se incluye en cálculos)
            </Label>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
