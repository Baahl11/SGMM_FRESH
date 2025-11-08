/**
 * CategoryFilter Component
 * Displays category filter buttons with counts
 * Allows filtering treatments by category
 */

'use client';

import { TREATMENT_CATEGORIES, type TreatmentCategory } from '@/lib/types/treatment';
import { cn } from '@/lib/utils';
import { getCategoryColorClasses } from '@/lib/types/treatment';

interface CategoryCounts {
  [key: string]: number;
}

interface CategoryFilterProps {
  selectedCategory: TreatmentCategory | 'all' | null;
  onCategoryChange: (category: TreatmentCategory | 'all') => void;
  counts?: CategoryCounts;
  className?: string;
}

export function CategoryFilter({
  selectedCategory = 'all',
  onCategoryChange,
  counts = {},
  className
}: CategoryFilterProps) {
  const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-semibold text-foreground">
        Filtrar por Categoría
      </h3>

      <div className="space-y-1">
        {/* All categories option */}
        <CategoryFilterButton
          category="all"
          label="Todas"
          icon="📋"
          count={totalCount}
          isSelected={selectedCategory === 'all' || !selectedCategory}
          onClick={() => onCategoryChange('all')}
        />

        {/* Individual category buttons */}
        {TREATMENT_CATEGORIES.map((category) => (
          <CategoryFilterButton
            key={category.value}
            category={category.value}
            label={category.label}
            icon={category.icon}
            count={counts[category.value] || 0}
            isSelected={selectedCategory === category.value}
            onClick={() => onCategoryChange(category.value)}
          />
        ))}
      </div>
    </div>
  );
}

interface CategoryFilterButtonProps {
  category: TreatmentCategory | 'all';
  label: string;
  icon: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}

function CategoryFilterButton({
  category,
  label,
  icon,
  count,
  isSelected,
  onClick
}: CategoryFilterButtonProps) {
  const colors = category !== 'all' 
    ? getCategoryColorClasses(category)
    : {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-600'
      };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2 rounded-lg',
        'text-sm font-medium transition-all',
        'border',
        isSelected
          ? cn(
              colors.bg,
              colors.text,
              colors.border,
              'shadow-sm'
            )
          : 'bg-background hover:bg-accent border-transparent',
        'focus:outline-none focus:ring-2 focus:ring-primary/50'
      )}
    >
      <span className="flex items-center gap-2">
        <span className="text-base" aria-hidden="true">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </span>
      
      {count > 0 && (
        <span
          className={cn(
            'ml-2 px-2 py-0.5 rounded-full text-xs font-semibold',
            isSelected
              ? 'bg-white/80 dark:bg-black/20'
              : 'bg-muted'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Compact category filter - tabs style
 */
interface CategoryFilterTabsProps {
  selectedCategory: TreatmentCategory | 'all' | null;
  onCategoryChange: (category: TreatmentCategory | 'all') => void;
  className?: string;
}

export function CategoryFilterTabs({
  selectedCategory = 'all',
  onCategoryChange,
  className
}: CategoryFilterTabsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {/* All option */}
      <button
        type="button"
        onClick={() => onCategoryChange('all')}
        className={cn(
          'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
          'border',
          selectedCategory === 'all' || !selectedCategory
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background hover:bg-accent border-border'
        )}
      >
        📋 Todas
      </button>

      {/* Category tabs */}
      {TREATMENT_CATEGORIES.map((category) => {
        const colors = getCategoryColorClasses(category.value);
        const isSelected = selectedCategory === category.value;

        return (
          <button
            key={category.value}
            type="button"
            onClick={() => onCategoryChange(category.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              'border',
              isSelected
                ? cn(colors.bg, colors.text, colors.border)
                : 'bg-background hover:bg-accent border-border'
            )}
          >
            <span className="mr-1.5">{category.icon}</span>
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
