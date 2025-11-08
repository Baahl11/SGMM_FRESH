"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QuickPhrase,
  QuickPhraseContext,
  QuickPhraseCategory,
  getCategoryConfig,
  MEDICAL_RECORD_CATEGORIES,
  TREATMENT_PHRASE_CATEGORIES
} from "@/lib/types/quick-phrase";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface QuickPhraseSelectorProps {
  context: QuickPhraseContext;
  onSelect: (content: string, phraseId: string) => void;
  onManage?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Dropdown selector for quick phrases
 * Fetches phrases from API, allows search and filtering by category
 */
export function QuickPhraseSelector({
  context,
  onSelect,
  onManage,
  trigger,
  open: controlledOpen,
  onOpenChange
}: QuickPhraseSelectorProps) {
  const [phrases, setPhrases] = useState<QuickPhrase[]>([]);
  const [filteredPhrases, setFilteredPhrases] = useState<QuickPhrase[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<QuickPhraseCategory | "all">("all");
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  // Get categories based on context
  const categories = context === 'medical_record' 
    ? MEDICAL_RECORD_CATEGORIES 
    : TREATMENT_PHRASE_CATEGORIES;

  // Fetch phrases when opened
  useEffect(() => {
    if (isOpen) {
      fetchPhrases();
    }
  }, [isOpen, context]);

  // Filter phrases based on search and category
  useEffect(() => {
    let filtered = phrases;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        p => p.title.toLowerCase().includes(searchLower) ||
             p.content.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPhrases(filtered);
  }, [search, selectedCategory, phrases]);

  const fetchPhrases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ context });
      const response = await fetch(`/api/quick-phrases?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setPhrases(data);
      }
    } catch (error) {
      console.error('Error fetching quick phrases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (phrase: QuickPhrase) => {
    // Call onSelect callback
    onSelect(phrase.content, phrase.id);

    // Increment usage counter
    try {
      await fetch(`/api/quick-phrases/${phrase.id}/use`, {
        method: 'PATCH'
      });
      
      // Update local state
      setPhrases(prev => 
        prev.map(p => 
          p.id === phrase.id 
            ? { ...p, usage_count: p.usage_count + 1, last_used_at: new Date().toISOString() }
            : p
        )
      );
    } catch (error) {
      console.error('Error updating usage:', error);
    }

    // Close popover
    setIsOpen(false);
    setSearch("");
    setSelectedCategory("all");
  };

  // Sort phrases: most used first, then recent
  const sortedPhrases = [...filteredPhrases].sort((a, b) => {
    if (b.usage_count !== a.usage_count) {
      return b.usage_count - a.usage_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Insertar frase</span>
          </Button>
        )}
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[500px] p-0" 
        align="start"
        sideOffset={8}
      >
        <div className="flex flex-col h-[500px]">
          {/* Header */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Frases Rápidas
              </h3>
              {onManage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsOpen(false);
                    onManage();
                  }}
                  className="text-xs"
                >
                  Gestionar
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar frases..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  selectedCategory === "all"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                )}
              >
                Todas ({phrases.length})
              </button>
              {categories.map(cat => {
                const count = phrases.filter(p => p.category === cat.value).length;
                if (count === 0) return null;
                
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCategory(cat.value)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1",
                      selectedCategory === cat.value
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                    )}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className="opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                Cargando...
              </div>
            ) : sortedPhrases.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Sparkles className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 mb-1">
                  {search ? 'No se encontraron frases' : 'No hay frases aún'}
                </p>
                <p className="text-xs text-gray-400">
                  {onManage && 'Crea tu primera frase rápida'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedPhrases.map((phrase) => {
                  const categoryConfig = getCategoryConfig(phrase.context, phrase.category);
                  
                  return (
                    <button
                      key={phrase.id}
                      type="button"
                      onClick={() => handleSelect(phrase)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors",
                        "hover:bg-blue-50 dark:hover:bg-blue-950/50",
                        "border border-transparent hover:border-blue-200 dark:hover:border-blue-800",
                        "group"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{categoryConfig.icon}</span>
                          <span className="font-medium text-sm truncate">
                            {phrase.title}
                          </span>
                        </div>
                        {phrase.usage_count > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                            <TrendingUp className="h-3 w-3" />
                            <span>{phrase.usage_count}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {phrase.content}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
