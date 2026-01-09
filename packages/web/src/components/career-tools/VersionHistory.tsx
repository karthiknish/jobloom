import React from "react";
import { format } from "date-fns";
import { 
  History as HistoryIcon, 
  RotateCcw, 
  Trash2, 
  FileText, 
  Calendar, 
  Star,
  CheckCircle2,
  Clock,
  GitCompare
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ResumeVersion } from "@/utils/api/resumeApi";

interface VersionHistoryProps {
  versions: ResumeVersion[];
  isLoading: boolean;
  onRestore: (version: ResumeVersion) => void;
  onDelete: (versionId: string) => void;
  onCompare: (v1: ResumeVersion, v2: ResumeVersion) => void;
  currentVersionId?: string;
}

export function VersionHistory({ 
  versions, 
  isLoading, 
  onRestore, 
  onDelete, 
  onCompare,
  currentVersionId 
}: VersionHistoryProps) {
  const [selectedForCompare, setSelectedForCompare] = React.useState<string[]>([]);

  const handleToggleCompare = (id: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleCompareClick = () => {
    if (selectedForCompare.length !== 2) return;
    const v1 = versions.find(v => v.id === selectedForCompare[0])!;
    const v2 = versions.find(v => v.id === selectedForCompare[1])!;
    onCompare(v1, v2);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all duration-300">
              <HistoryIcon className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Version History</TooltipContent>
        </Tooltip>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        <div className="p-6 border-b">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-primary" />
              Version History
            </SheetTitle>
            <SheetDescription>
              View and restore previous versions of your resume. Select two versions to compare changes.
            </SheetDescription>
          </SheetHeader>

          {selectedForCompare.length > 0 && (
            <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {selectedForCompare.length === 1 
                    ? "Select one more to compare" 
                    : "Ready to compare"}
                </span>
              </div>
              {selectedForCompare.length === 2 && (
                <Button size="sm" onClick={handleCompareClick}>
                  Compare Now
                </Button>
              )}
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <Clock className="h-8 w-8 animate-spin" />
                <p>Loading history...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <FileText className="h-12 w-12 opacity-20" />
                <p>No versions saved yet.</p>
              </div>
            ) : (
              versions.map((version) => (
                <div 
                  key={version.id}
                  className={cn(
                    "group relative p-4 rounded-2xl border transition-all duration-200",
                    selectedForCompare.includes(version.id) 
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                      : "border-border hover:border-primary/30 hover:shadow-md bg-white"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm truncate max-w-[200px]">
                          {version.name || "Untitled Revision"}
                        </h4>
                        <Badge variant="secondary" className="text-xxs h-4">
                          Score: {version.score.overall}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(version.createdAt, "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(version.createdAt, "h:mm a")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className={cn(
                          "h-8 w-8 rounded-lg",
                          selectedForCompare.includes(version.id) ? "text-primary bg-primary/10" : "text-muted-foreground"
                        )}
                        onClick={() => handleToggleCompare(version.id)}
                        title="Compare"
                      >
                        <GitCompare className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                        onClick={() => onRestore(version)}
                        title="Restore"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(version.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
