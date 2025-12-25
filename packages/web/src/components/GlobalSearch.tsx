"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, Briefcase, FileCheck, ArrowRight, Clock, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    query,
    setQuery,
    searchResults,
    flatResults,
    selectedIndex,
    setSelectedIndex,
    recentSearches,
    handleKeyDown,
    handleSelect,
  } = useGlobalSearch();

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle close and reset
  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="p-0 gap-0 max-w-2xl w-[95vw] sm:w-full bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 pl-4 pr-14 py-3 border-b border-border/50">
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs, CV analyses, or navigate..."
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base"
            autoComplete="off"
            autoFocus
          />
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">ESC</kbd>
            <span>to close</span>
          </div>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          <AnimatePresence mode="wait">
            {searchResults.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {searchResults.map((category, catIndex) => (
                  <div key={category.label} className="mb-2">
                    <div className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {category.label}
                    </div>
                    {category.results.map((result, resIndex) => {
                      // Calculate flat index
                      const flatIndex =
                        searchResults
                          .slice(0, catIndex)
                          .reduce((acc, cat) => acc + cat.results.length, 0) + resIndex;
                      const isSelected = flatIndex === selectedIndex;

                      return (
                        <SearchResultItem
                          key={result.id}
                          result={result}
                          isSelected={isSelected}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                        />
                      );
                    })}
                  </div>
                ))}
              </motion.div>
            ) : query ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center"
              >
                <Search className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm">
                  No results found for &quot;{query}&quot;
                </p>
                <p className="text-muted-foreground/60 text-xs mt-1">
                  Try a different search term
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-8"
              >
                {recentSearches.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Recent Searches
                    </div>
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(search)}
                        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{search}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="px-4 text-center text-muted-foreground/60 text-xs">
                  Start typing to search across your jobs and CV analyses
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
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
      </DialogContent>
    </Dialog>
  );
}

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

function SearchResultItem({
  result,
  isSelected,
  onClick,
  onMouseEnter,
}: SearchResultItemProps) {
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left",
        isSelected ? "bg-primary/10" : "hover:bg-muted/50"
      )}
      animate={{
        backgroundColor: isSelected ? "var(--primary-10)" : "transparent",
      }}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {iconMap[result.type] || <FileText className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-sm font-medium truncate transition-colors",
            isSelected ? "text-primary" : "text-foreground"
          )}
        >
          {result.title}
        </div>
        {result.subtitle && (
          <div className="text-xs text-muted-foreground truncate">
            {result.subtitle}
          </div>
        )}
      </div>
      {isSelected && (
        <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
      )}
    </motion.button>
  );
}

export default GlobalSearch;
