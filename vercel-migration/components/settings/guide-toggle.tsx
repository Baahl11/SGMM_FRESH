'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface GuideToggleProps {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function GuideToggle({ label, children, defaultOpen = false }: GuideToggleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-4">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex w-full items-center justify-between gap-2 px-0 text-left font-medium text-muted-foreground"
          >
            <span>{open ? 'Ocultar guía detallada' : label}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4">
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
