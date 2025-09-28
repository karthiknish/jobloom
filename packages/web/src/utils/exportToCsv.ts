export interface CsvRow {
  [key: string]: string | number | boolean | null | undefined;
}

const sanitizeValue = (value: CsvRow[keyof CsvRow]): string => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export function exportToCsv(
  filename: string,
  rows: CsvRow[],
  headerOrder?: string[]
): void {
  if (!rows || rows.length === 0) return;

  const headers = headerOrder?.length
    ? headerOrder
    : Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => sanitizeValue(row[header])).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
