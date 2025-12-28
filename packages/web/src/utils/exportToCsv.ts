export type CsvRow = Record<string, unknown>;

/**
 * Format a value for CSV export
 */
function formatValue(value: unknown): string {
  if (value == null) return "";
  
  // Handle dates
  if (value instanceof Date) {
    return value.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  
  // Handle timestamps (numbers > year 2000 in milliseconds)
  if (typeof value === "number" && value > 946684800000) {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  
  // Handle booleans
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(v => formatValue(v)).join("; ");
  }
  
  // Handle objects
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Convert rows to CSV with proper escaping and formatting
 */
export function toCsv(rows: CsvRow[]): string {
  if (!rows.length) return "";
  
  // Collect all unique columns
  const cols = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  
  // Create human-readable headers
  const formatHeader = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, " ")
      .trim();
  };
  
  const header = cols.map(formatHeader).join(",");
  
  const lines = rows.map((r) =>
    cols
      .map((k) => {
        const formatted = formatValue(r[k]);
        // Escape quotes and wrap in quotes if needed
        const escaped = formatted.replace(/"/g, '""');
        // Wrap in quotes if contains comma, newline, or quotes
        if (escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')) {
          return `"${escaped}"`;
        }
        return escaped || '""';
      })
      .join(",")
  );
  
  return [header, ...lines].join("\n");
}

/**
 * Export data to a CSV file
 */
export function exportToCsv(
  filename: string,
  rows: CsvRow[]
): void {
  if (!rows || rows.length === 0) return;

  const csvContent = toCsv(rows);

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
