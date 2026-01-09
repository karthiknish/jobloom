"use client";

import { FileSpreadsheet, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadSampleCSV } from "@/utils/jobImport";
import { showWarning } from "@/components/ui/Toast";

interface CsvUploaderProps {
    csvFile: File | null;
    onFileChange: (file: File | null) => void;
    isImporting: boolean;
    onImport: () => void;
}

export function CsvUploader({
    csvFile,
    onFileChange,
    isImporting,
    onImport,
}: CsvUploaderProps) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
                showWarning("Invalid file type", "Select a .csv file to continue.");
                return;
            }
            onFileChange(file);
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-8 text-center transition-colors hover:bg-emerald-50/50">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                    <FileSpreadsheet className="h-8 w-8" />
                </div>
                <div className="space-y-2 mb-6">
                    <h3 className="text-lg font-bold text-emerald-900">Upload CSV File</h3>
                    <p className="text-sm text-emerald-700 max-w-sm mx-auto">
                        Choose a CSV file containing your job applications. Make sure to follow our suggested format.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <Input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="csv-upload"
                    />
                    <label
                        htmlFor="csv-upload"
                        className="cursor-pointer inline-flex items-center justify-center h-12 px-6 rounded-xl bg-white border-2 border-emerald-200 text-emerald-600 font-bold hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm"
                    >
                        {csvFile ? csvFile.name : "Select CSV File"}
                    </label>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={downloadSampleCSV}
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download Sample CSV
                    </Button>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button
                    onClick={onImport}
                    disabled={!csvFile || isImporting}
                    className="h-12 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 gap-2"
                >
                    {isImporting && <RefreshCw className="h-4 w-4 animate-spin" />}
                    Import Now
                </Button>
            </div>
        </div>
    );
}
