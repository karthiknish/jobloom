"use client";

import { motion } from "framer-motion";
import { CheckCircle, Briefcase, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getSalaryDisplay } from "@/utils/dashboard";

interface ExtensionJob {
    id?: string;
    title: string;
    company: string;
    location: string;
    url: string;
    description?: string;
    salary?: string;
    source?: string;
    dateFound?: number;
    isSponsored?: boolean;
    sponsorshipType?: string;
}

interface ExtensionJobsListProps {
    jobs: ExtensionJob[];
    selectedIds: Set<string>;
    onToggleSelection: (id: string) => void;
    onToggleAll: () => void;
    isAllSelected: boolean;
    isLoading: boolean;
    isImporting: boolean;
    importProgress: number;
    onImport: () => void;
    onRefresh: () => void;
    onClose: () => void;
}

export function ExtensionJobsList({
    jobs,
    selectedIds,
    onToggleSelection,
    onToggleAll,
    isAllSelected,
    isLoading,
    isImporting,
    importProgress,
    onImport,
    onRefresh,
    onClose,
}: ExtensionJobsListProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading saved jobs...</p>
                </div>
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="text-center py-12 rounded-xl bg-muted/30 border border-dashed border-border">
                <Briefcase className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <h4 className="font-medium text-foreground mb-1">No saved jobs found</h4>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Use the extension&apos;s &quot;Add to Board&quot; button on job listings to save them here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700">Extension Connected</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            <div className="flex items-center justify-between py-2">
                <Button variant="ghost" size="sm" onClick={onToggleAll} className="text-sm">
                    {isAllSelected ? "Deselect All" : "Select All"}
                </Button>
                <Badge variant="secondary" className="font-medium">
                    {selectedIds.size} of {jobs.length} selected
                </Badge>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                {jobs.map((job, index) => {
                    const jobId = job.id || `job-${index}`;
                    const isSelected = selectedIds.has(jobId);
                    return (
                        <motion.div
                            key={jobId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => onToggleSelection(jobId)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? "border-emerald-300 bg-emerald-50" : "border-border hover:border-emerald-200 hover:bg-muted/50"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/30"
                                        }`}
                                >
                                    {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{job.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {job.company} • {job.location} {job.salary && `• ${getSalaryDisplay(job.salary)}`}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {job.source && (
                                            <Badge variant="outline" className="text-xxs px-1.5 py-0">
                                                {job.source}
                                            </Badge>
                                        )}
                                        {job.isSponsored && (
                                            <Badge className="text-xxs px-1.5 py-0 bg-green-500 hover:bg-green-500">
                                                Sponsored
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {isImporting && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Importing jobs...</span>
                        <span className="font-medium">{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={onClose} disabled={isImporting}>
                    Cancel
                </Button>
                <Button
                    onClick={onImport}
                    disabled={isImporting || selectedIds.size === 0}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2"
                >
                    {isImporting ? (
                        <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Importing...
                        </>
                    ) : (
                        `Import ${selectedIds.size} Job${selectedIds.size !== 1 ? "s" : ""}`
                    )}
                </Button>
            </div>
        </div>
    );
}
