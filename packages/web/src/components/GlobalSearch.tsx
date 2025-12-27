"use client";

import React from "react";
import { FileText, Briefcase, FileCheck, ArrowRight, Clock, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useGlobalSearch, SearchResult } from "@/hooks/useGlobalSearch";

const iconMap: Record<string, React.ReactNode> = {
  job: <Briefcase className="h-4 w-4" />,
  "cv-analysis": <FileCheck className="h-4 w-4" />,
  resume: <FileText className="h-4 w-4" />,
  page: <ArrowRight className="h-4 w-4" />,
};

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const {
    query,
    setQuery,
    searchResults,
    recentSearches,
    handleSelect,
  } = useGlobalSearch();

  // Handle close and reset
  const handleClose = () => {
    setQuery("");
    onClose();
  };

  const handleResultSelect = (result: SearchResult) => {
    handleSelect(result);
    handleClose();
  };

  const handleRecentSelect = (search: string) => {
    setQuery(search);
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <CommandInput
        placeholder="Search jobs, CV analyses, or navigate..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No results found for &quot;{query}&quot;
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Try a different search term
            </p>
          </div>
        </CommandEmpty>

        {/* Search Results */}
        {searchResults.map((category) => (
          <CommandGroup key={category.label} heading={category.label}>
            {category.results.map((result) => (
              <CommandItem
                key={result.id}
                value={`${result.title} ${result.subtitle || ""}`}
                onSelect={() => handleResultSelect(result)}
                className="flex items-center gap-3 py-2.5"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    "bg-muted text-muted-foreground"
                  )}
                >
                  {iconMap[result.type] || <FileText className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {result.title}
                  </div>
                  {result.subtitle && (
                    <div className="text-xs text-muted-foreground truncate">
                      {result.subtitle}
                    </div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        {/* Recent Searches - only show when no query */}
        {!query && recentSearches.length > 0 && (
          <CommandGroup heading="Recent Searches">
            {recentSearches.map((search, index) => (
              <CommandItem
                key={index}
                value={search}
                onSelect={() => handleRecentSelect(search)}
                className="flex items-center gap-3"
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{search}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Empty state when no query and no recent searches */}
        {!query && recentSearches.length === 0 && searchResults.length === 0 && (
          <div className="py-8 px-4 text-center text-muted-foreground/60 text-xs">
            Start typing to search across your jobs and CV analyses
          </div>
        )}
      </CommandList>

      {/* Footer with keyboard shortcuts */}
      <div className="px-4 py-2.5 border-t border-border/50 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↓</kbd>
            <span className="ml-1">to navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd>
            <span className="ml-1">to select</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Command className="h-3 w-3" />
          <span>K to open anytime</span>
        </div>
      </div>
    </CommandDialog>
  );
}

export default GlobalSearch;
