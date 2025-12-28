import jsPDF from "jspdf";

/**
 * Format a value for display in PDF
 */
function formatValue(value: unknown): string {
  if (value == null) return "-";

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
    return value.length > 0 ? value.map((v) => formatValue(v)).join(", ") : "-";
  }

  // Handle objects
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  const str = String(value);
  return str.length > 50 ? str.substring(0, 47) + "..." : str;
}

export interface PDFExportColumn {
  key: string;
  label: string;
  width: number;
}

export interface PDFExportOptions {
  fileName?: string;
  title?: string;
  columns: PDFExportColumn[];
  summaryLines?: string[];
}

export async function exportToPdf(
  rows: Record<string, any>[],
  options: PDFExportOptions
): Promise<void> {
  const { fileName = "export.pdf", title = "Data Report", columns, summaryLines = [] } = options;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = margin;

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(title, margin, currentY);
  currentY += 8;

  // Subtitle with date and count
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  const subtitle = `Generated on ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })} • ${rows.length} record${rows.length !== 1 ? "s" : ""}`;
  pdf.text(subtitle, margin, currentY);
  pdf.setTextColor(0);
  currentY += 12;

  // Calculate total width and scale if needed
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const availableWidth = pageWidth - margin * 2;
  const scale = totalWidth > availableWidth ? availableWidth / totalWidth : 1;

  // Table header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, currentY - 4, availableWidth, 8, "F");

  let xPos = margin;
  columns.forEach((col) => {
    pdf.text(col.label, xPos + 2, currentY);
    xPos += col.width * scale;
  });
  currentY += 8;

  // Table rows
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);

  rows.forEach((row, index) => {
    // Check if we need a new page
    if (currentY > pageHeight - margin - 10) {
      pdf.addPage();
      currentY = margin;

      // Repeat header on new page
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, currentY - 4, availableWidth, 8, "F");

      xPos = margin;
      columns.forEach((col) => {
        pdf.text(col.label, xPos + 2, currentY);
        xPos += col.width * scale;
      });
      currentY += 8;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
    }

    // Alternate row background
    if (index % 2 === 0) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(margin, currentY - 4, availableWidth, 7, "F");
    }

    xPos = margin;
    columns.forEach((col) => {
      const value = formatValue(row[col.key]);
      const truncated =
        value.length > Math.floor(col.width / 2)
          ? value.substring(0, Math.floor(col.width / 2) - 3) + "..."
          : value;
      pdf.text(truncated, xPos + 2, currentY);
      xPos += col.width * scale;
    });
    currentY += 7;
  });

  // Summary section
  if (summaryLines && summaryLines.length > 0) {
    currentY += 10;
    if (currentY > pageHeight - 30) {
      pdf.addPage();
      currentY = margin;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Summary", margin, currentY);
    currentY += 6;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    summaryLines.forEach((line) => {
      pdf.text(line, margin, currentY);
      currentY += 5;
    });
  }

  // Footer
  const pageCount = pdf.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin - 20,
      pageHeight - 8
    );
    pdf.text("HireAll Application Export", margin, pageHeight - 8);
    pdf.setTextColor(0);
  }

  // Download
  pdf.save(fileName);
}
