"use client";

import { Globe, RefreshCw, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSalaryDisplay } from "@/utils/dashboard";

interface UrlImportProps {
    jobUrl: string;
    onUrlChange: (url: string) => void;
    isParsingUrl: boolean;
    onParse: () => void;
    parsedJob: any | null;
    isImporting: boolean;
    onSave: () => void;
}

export function UrlImport({
    jobUrl,
    onUrlChange,
    isParsingUrl,
    onParse,
    parsedJob,
    isImporting,
    onSave,
}: UrlImportProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <Label htmlFor="job-url" className="text-sm font-bold text-emerald-900 uppercase">
                    Enter Job Listing URL
                </Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                        <Input
                            id="job-url"
                            placeholder="https://www.linkedin.com/jobs/view/..."
                            value={jobUrl}
                            onChange={(e) => onUrlChange(e.target.value)}
                            className="pl-9 h-12 border-emerald-100 focus:ring-emerald-500 transition-all rounded-xl"
                        />
                    </div>
                    <Button
                        onClick={onParse}
                        disabled={!jobUrl || isParsingUrl}
                        className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 shadow-md shadow-emerald-500/10"
                    >
                        {isParsingUrl ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                        Extract Details
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 ml-1 italic font-medium">
                    <Sparkles className="h-3 w-3 text-emerald-500" />
                    Works best with LinkedIn, Indeed, Glassdoor and Greenhouse.
                </p>
            </div>

            {parsedJob && (
                <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-500/5 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h4 className="text-lg font-bold text-gray-900 leading-tight">
                                {parsedJob.title || "No title found"}
                            </h4>
                            <p className="text-sm font-semibold text-emerald-700">
                                {parsedJob.company || "Unknown Company"}
                            </p>
                        </div>
                        {parsedJob.salary && (
                            <div className="bg-emerald-50 text-emerald-700 font-bold text-xs py-1.5 px-3 rounded-lg border border-emerald-100">
                                {getSalaryDisplay(parsedJob.salary)}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        {parsedJob.location && (
                            <div className="text-[10px] px-2 py-1 bg-gray-50 text-gray-600 rounded-md font-bold uppercase tracking-wider">
                                {parsedJob.location}
                            </div>
                        )}
                        {parsedJob.source && (
                            <div className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-bold uppercase tracking-wider">
                                {parsedJob.source}
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={onSave}
                        disabled={isImporting}
                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/10 gap-2 mt-4"
                    >
                        {isImporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Looks Good, Save to Board"}
                    </Button>
                </div>
            )}
        </div>
    );
}
