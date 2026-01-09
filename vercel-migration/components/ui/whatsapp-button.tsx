'use client';

import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateWhatsAppLink } from '@/lib/whatsapp-helpers';

interface WhatsAppButtonProps {
  phone: string;
  message?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  children?: React.ReactNode;
}

export function WhatsAppButton({
  phone,
  message,
  className = '',
  variant = 'default',
  size = 'default',
  children,
}: WhatsAppButtonProps) {
  const handleClick = () => {
    const link = generateWhatsAppLink({ phone, message });
    window.open(link, '_blank');
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`bg-emerald-600 hover:bg-emerald-700 text-white ${className}`}
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      {children || 'Contactar por WhatsApp'}
    </Button>
  );
}
