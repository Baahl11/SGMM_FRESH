/**
 * Color Picker Component
 * Used in branding settings to select colors
 */

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
}

const PRESET_COLORS = [
  '#7C3AED', '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#6B7280',
  '#A78BFA', '#93C5FD', '#6EE7B7', '#FCA5A5', '#FCD34D', '#D1D5DB',
  '#5B21B6', '#1E40AF', '#047857', '#B91C1C', '#D97706', '#374151',
  '#1F2937', '#111827', '#FFFFFF', '#F3F4F6', '#E5E7EB', '#9CA3AF',
];

export function ColorPicker({ label, value, onChange, description }: ColorPickerProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(newValue)) {
      onChange(newValue);
    }
  };

  const handlePresetClick = (color: string) => {
    setLocalValue(color);
    onChange(color);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`color-${label}`}>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-12 h-12 p-0 border-2"
              style={{ backgroundColor: value }}
              aria-label={`Seleccionar ${label}`}
            >
              <span className="sr-only">Seleccionar color</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Colores predefinidos
                </Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handlePresetClick(color)}
                      className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: color }}
                      aria-label={`Color ${color}`}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">
                  Color personalizado
                </Label>
                <Input
                  type="color"
                  value={value}
                  onChange={(e) => handlePresetClick(e.target.value)}
                  className="h-10 w-full cursor-pointer"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Input
          id={`color-${label}`}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          placeholder="#7C3AED"
          className="font-mono uppercase"
          maxLength={7}
        />
      </div>
      
      {localValue && !/^#[0-9A-F]{6}$/i.test(localValue) && (
        <p className="text-sm text-red-500">
          Formato inválido. Usa formato hex (#RRGGBB)
        </p>
      )}
    </div>
  );
}
