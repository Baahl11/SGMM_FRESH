"use client";

import { Button } from "@/components/ui/button";
import { FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickPhraseButtonProps {
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  showLabel?: boolean;
}

/**
 * Button to trigger Quick Phrase selector
 * Use this next to textarea fields where users can insert quick phrases
 */
export function QuickPhraseButton({
  onClick,
  variant = "outline",
  size = "sm",
  className,
  disabled = false,
  showLabel = true
}: QuickPhraseButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "gap-2 transition-all hover:scale-105",
        className
      )}
      title="Insertar frase rápida"
    >
      <Sparkles className="h-4 w-4" />
      {showLabel && <span>Frase rápida</span>}
    </Button>
  );
}

/**
 * Compact icon-only version
 */
export function QuickPhraseButtonIcon({
  onClick,
  disabled = false,
  className
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-2",
        "text-gray-500 hover:text-blue-600 hover:bg-blue-50",
        "dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-950",
        "transition-all hover:scale-110",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      title="Insertar frase rápida"
    >
      <Sparkles className="h-4 w-4" />
    </button>
  );
}
