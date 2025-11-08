/**
 * CategoryBadge Component
 * Displays a category badge with icon, label, and color coding
 * Supports dark mode and different sizes
 */

import { getCategoryConfig, getCategoryColorClasses, type TreatmentCategory } from '@/lib/types/treatment';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: TreatmentCategory | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function CategoryBadge({
  category,
  size = 'md',
  showIcon = true,
  showLabel = true,
  className
}: CategoryBadgeProps) {
  // If no category, don't render anything
  if (!category) return null;

  const config = getCategoryConfig(category);
  if (!config) return null;

  const colors = getCategoryColorClasses(category);

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  };

  const iconSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        className
      )}
      title={config.label}
    >
      {showIcon && (
        <span className={iconSizeClasses[size]} aria-hidden="true">
          {config.icon}
        </span>
      )}
      {showLabel && (
        <span className="truncate">{config.label}</span>
      )}
    </span>
  );
}

/**
 * Compact category badge - only shows icon
 */
export function CategoryBadgeCompact({
  category,
  className
}: Pick<CategoryBadgeProps, 'category' | 'className'>) {
  return (
    <CategoryBadge
      category={category}
      size="sm"
      showIcon={true}
      showLabel={false}
      className={className}
    />
  );
}

/**
 * Category badge for lists - medium size with icon and label
 */
export function CategoryBadgeList({
  category,
  className
}: Pick<CategoryBadgeProps, 'category' | 'className'>) {
  return (
    <CategoryBadge
      category={category}
      size="md"
      showIcon={true}
      showLabel={true}
      className={className}
    />
  );
}
