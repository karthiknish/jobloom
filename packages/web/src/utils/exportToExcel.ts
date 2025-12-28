import * as XLSX from "xlsx";

/**
 * Export data to an Excel (.xlsx) file
 */
export function exportToExcel(
  data: any[],
  filename: string,
  sheetName: string = "Sheet1"
): void {
  if (!data || data.length === 0) return;

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
