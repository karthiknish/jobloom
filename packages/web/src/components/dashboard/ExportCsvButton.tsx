"use client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type Row = Record<string, unknown>;

function toCsv(rows: Row[]): string {
  if (!rows.length) return "";
  const cols = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const header = cols.join(",");
  const lines = rows.map((r) =>
    cols
      .map((k) => {
        const v = r[k];
        if (v == null) return "";
        const s = typeof v === "string" ? v : JSON.stringify(v);
        const escaped = s.replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(",")
  );
  return [header, ...lines].join("\n");
}

export function ExportCsvButton({
  fileName = "applications.csv",
  rows,
}: {
  fileName?: string;
  rows: Row[];
}) {
  const handleExport = () => {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button size="sm" variant="outline" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" /> Export CSV
    </Button>
  );
}
