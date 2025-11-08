/**
 * TagsInput Component
 * Allows adding, removing, and displaying tags as chips
 * Supports autocomplete from existing tags
 */

'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
}

export function TagsInput({
  value = [],
  onChange,
  suggestions = [],
  placeholder = 'Agregar etiquetas...',
  maxTags,
  disabled = false,
  className
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input and exclude already selected tags
  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion)
  );

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    
    if (!trimmedTag) return;
    if (value.includes(trimmedTag)) return;
    if (maxTags && value.length >= maxTags) return;

    onChange([...value, trimmedTag]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag if backspace on empty input
      handleRemoveTag(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleAddTag(suggestion);
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* Tags Container */}
      <div
        className={cn(
          'flex flex-wrap gap-2 min-h-[42px] p-2 rounded-md border',
          'bg-background',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text',
          'focus-within:ring-2 focus-within:ring-primary/20'
        )}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Display existing tags */}
        {value.map((tag) => (
          <span
            key={tag}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full',
              'bg-primary/10 text-primary text-sm font-medium',
              'border border-primary/20',
              'dark:bg-primary/20 dark:text-primary-foreground'
            )}
          >
            <Tag className="w-3 h-3" />
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag);
                }}
                className={cn(
                  'ml-1 rounded-full hover:bg-primary/20',
                  'transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
                aria-label={`Eliminar ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {/* Input */}
        {(!maxTags || value.length < maxTags) && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            disabled={disabled}
            placeholder={value.length === 0 ? placeholder : ''}
            className={cn(
              'flex-1 min-w-[120px] outline-none bg-transparent',
              'text-sm placeholder:text-muted-foreground',
              disabled && 'cursor-not-allowed'
            )}
          />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && !disabled && (
        <div
          className={cn(
            'absolute z-50 w-full mt-1 py-1',
            'bg-popover border rounded-md shadow-lg',
            'max-h-60 overflow-y-auto'
          )}
        >
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                'transition-colors'
              )}
            >
              <Tag className="w-3 h-3 inline-block mr-2" />
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Helper text */}
      {maxTags && (
        <p className="mt-1 text-xs text-muted-foreground">
          {value.length} / {maxTags} etiquetas
        </p>
      )}
    </div>
  );
}

/**
 * Simple tags display (read-only)
 */
interface TagsDisplayProps {
  tags: string[];
  className?: string;
}

export function TagsDisplay({ tags, className }: TagsDisplayProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {tags.map((tag) => (
        <span
          key={tag}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
            'bg-muted text-muted-foreground text-xs font-medium',
            'border'
          )}
        >
          <Tag className="w-2.5 h-2.5" />
          <span>{tag}</span>
        </span>
      ))}
    </div>
  );
}
