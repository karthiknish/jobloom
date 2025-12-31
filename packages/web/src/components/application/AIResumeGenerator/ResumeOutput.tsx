import React from 'react';
import { FileText, Copy, Eye, Download, RefreshCw, Target, Zap, CheckCircle, Lightbulb, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { GeneratedResume, ResumeGeneratorFormData } from './types';
import { getAtsScoreLabel } from './utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';

interface ResumeOutputProps {
  generatedResume: GeneratedResume | null;
  formData: ResumeGeneratorFormData;
  downloadingPDF: boolean;
  editedContent: string;
  setEditedContent: (val: string) => void;
  copyToClipboard: () => void;
  previewPDF: () => void;
  downloadPDF: () => void;
}

export const ResumeOutput: React.FC<ResumeOutputProps> = ({
  generatedResume,
  formData,
  downloadingPDF,
  editedContent,
  setEditedContent,
  copyToClipboard,
  previewPDF,
  downloadPDF
}) => {
  const previewWordCount = editedContent ? editedContent.split(/\s+/).filter(Boolean).length : 0;

  return (
    <Card className="shadow-lg border-muted/40 flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-4 border-b bg-muted/10">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generated Resume
          </span>
          {generatedResume && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                <Copy className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={previewPDF}
                disabled={!generatedResume || !formData.jobTitle}
              >
                <Eye className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
              <Button 
                size="sm" 
                variant="default" 
                onClick={downloadPDF}
                disabled={downloadingPDF || !generatedResume || !formData.jobTitle}
                className={cn("hover:opacity-90 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white")}
              >
                {downloadingPDF ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Download className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline">Download</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 sm:p-6 bg-muted/5 min-h-[500px]">
        {generatedResume ? (
          <div className="space-y-6 p-4 sm:p-0">
            {generatedResume.source === 'fallback' && (
              <Alert className="bg-blue-50 border-blue-200 text-blue-800 py-3">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-xs font-bold uppercase tracking-tight mb-1">AI Service Unavailable</AlertTitle>
                <AlertDescription className="text-xs leading-relaxed">
                  We've generated a high-quality template based on your experience. You can edit this directly or try re-generating in a few minutes.
                </AlertDescription>
              </Alert>
            )}

            {/* ATS Score */}
            <div className="p-5 bg-white rounded-xl border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <Target className={cn("h-4 w-4 text-blue-600")} />
                  </div>
                  <span className="font-semibold text-sm">ATS Score</span>
                </div>
                <span className={cn("font-bold text-lg", 
                  generatedResume.atsScore >= 80 ? "text-emerald-500" : 
                  generatedResume.atsScore >= 60 ? "text-amber-500" : "text-rose-500"
                )}>
                  {generatedResume.atsScore}%
                </span>
              </div>
              <Progress value={generatedResume.atsScore} className="h-2.5" />
              <p className="text-[10px] text-muted-foreground mt-2 text-right font-medium uppercase tracking-wider">
                {getAtsScoreLabel(generatedResume.atsScore).label}
              </p>
            </div>

            {/* Keywords */}
            {generatedResume.keywords.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Keywords Optimized
                </h4>
                <div className="flex flex-wrap gap-2">
                  {generatedResume.keywords.map(keyword => (
                    <Badge key={keyword} variant="outline" className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100 border">
                      <CheckCircle className="h-2.5 w-2.5 mr-1" />
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Content - Document View */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Preview</h4>
                <div className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-medium">
                  {previewWordCount} words • {formData.style}
                </div>
              </div>
              
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="p-6 sm:p-8 bg-white text-black shadow-inner border rounded-sm min-h-[400px] max-h-[500px] overflow-y-auto font-sans text-[9pt] leading-relaxed resize-y"
              />
            </div>

            {/* Suggestions */}
            {generatedResume.suggestions.length > 0 && (
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                <h4 className="font-bold mb-3 flex items-center gap-2 text-[10px] text-amber-700 uppercase tracking-widest">
                  <Lightbulb className="h-3.5 w-3.5" />
                  AI Suggestions
                </h4>
                <ul className="space-y-2">
                  {generatedResume.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-amber-800/80">
                      <Star className="h-3 w-3 mt-0.5 flex-shrink-0 text-amber-500" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl border-muted-foreground/10 bg-muted/5 mx-4 sm:mx-0 my-4 sm:my-0">
            <div className="p-4 bg-background rounded-full shadow-sm mb-4 border">
              <FileText className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Ready to Build</h3>
            <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">
              Complete the steps to generate your AI-optimized professional resume.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
