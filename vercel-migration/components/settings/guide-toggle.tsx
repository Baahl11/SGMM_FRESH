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
      <div className="rounded-2xl border border-white/20 bg-white/[0.04] p-4 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex w-full items-center justify-between gap-2 px-0 text-left font-medium text-white/80 hover:text-white"
          >
            <span>{open ? 'Ocultar guía detallada' : label}</span>
            <ChevronDown className={`h-4 w-4 text-white/60 transition-transform ${open ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4 border-t border-white/10 pt-4">
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
