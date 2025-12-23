/**
 * PDF Generation Utility for Cover Letters
 * Provides functionality to generate and download professional PDF cover letters
 * Supports multiple templates and color schemes
 */

import jsPDF from 'jspdf';

// ============ THEME COLOR SYSTEM ============

interface ThemeColor {
  r: number;
  g: number;
  b: number;
}

interface ColorScheme {
  primary: ThemeColor;
  secondary: ThemeColor;
  accent: ThemeColor;
  text: ThemeColor;
  textLight: ThemeColor;
  background: ThemeColor;
  border: ThemeColor;
}

const COLOR_SCHEMES: Record<string, ColorScheme> = {
  hireall: {
    primary: { r: 16, g: 183, b: 127 },
    secondary: { r: 15, g: 118, b: 110 },
    accent: { r: 45, g: 212, b: 191 },
    text: { r: 31, g: 41, b: 55 },
    textLight: { r: 107, g: 114, b: 128 },
    background: { r: 249, g: 250, b: 251 },
    border: { r: 209, g: 213, b: 219 },
  },
  blue: {
    primary: { r: 37, g: 99, b: 235 },
    secondary: { r: 30, g: 64, b: 175 },
    accent: { r: 96, g: 165, b: 250 },
    text: { r: 31, g: 41, b: 55 },
    textLight: { r: 107, g: 114, b: 128 },
    background: { r: 239, g: 246, b: 255 },
    border: { r: 191, g: 219, b: 254 },
  },
  gray: {
    primary: { r: 55, g: 65, b: 81 },
    secondary: { r: 31, g: 41, b: 55 },
    accent: { r: 107, g: 114, b: 128 },
    text: { r: 31, g: 41, b: 55 },
    textLight: { r: 107, g: 114, b: 128 },
    background: { r: 249, g: 250, b: 251 },
    border: { r: 209, g: 213, b: 219 },
  },
  green: {
    primary: { r: 22, g: 163, b: 74 },
    secondary: { r: 21, g: 128, b: 61 },
    accent: { r: 74, g: 222, b: 128 },
    text: { r: 31, g: 41, b: 55 },
    textLight: { r: 107, g: 114, b: 128 },
    background: { r: 240, g: 253, b: 244 },
    border: { r: 187, g: 247, b: 208 },
  },
  purple: {
    primary: { r: 147, g: 51, b: 234 },
    secondary: { r: 126, g: 34, b: 206 },
    accent: { r: 192, g: 132, b: 252 },
    text: { r: 31, g: 41, b: 55 },
    textLight: { r: 107, g: 114, b: 128 },
    background: { r: 250, g: 245, b: 255 },
    border: { r: 233, g: 213, b: 255 },
  },
};

function getColorScheme(name?: string): ColorScheme {
  return COLOR_SCHEMES[name || 'hireall'] || COLOR_SCHEMES.hireall;
}

function applyTextColor(pdf: jsPDF, color: ThemeColor): void {
  pdf.setTextColor(color.r, color.g, color.b);
}

function applyFillColor(pdf: jsPDF, color: ThemeColor): void {
  pdf.setFillColor(color.r, color.g, color.b);
}

function applyDrawColor(pdf: jsPDF, color: ThemeColor): void {
  pdf.setDrawColor(color.r, color.g, color.b);
}

export interface PDFOptions {
  template?: 'modern' | 'classic' | 'creative' | 'executive' | 'minimal';
  colorScheme?: 'hireall' | 'blue' | 'gray' | 'green' | 'purple';
  fontSize?: number;
  lineHeight?: number;
  margin?: number;
  font?: 'helvetica' | 'times' | 'courier';
  fontStyle?: 'normal' | 'bold' | 'italic';
}

export interface CoverLetterMetadata {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  date: string;
  recipientName?: string;
  recipientTitle?: string;
  email?: string;
  phone?: string;
  location?: string;
}

export class PDFGenerator {
  private static readonly DEFAULT_OPTIONS: PDFOptions = {
    template: 'modern',
    colorScheme: 'hireall',
    fontSize: 12,
    lineHeight: 1.5,
    margin: 20,
    font: 'helvetica',
    fontStyle: 'normal'
  };

  /**
   * Generate a professional PDF from cover letter content
   */
  static async generateCoverLetterPDF(
    content: string,
    metadata: CoverLetterMetadata,
    options: PDFOptions = {}
  ): Promise<Blob> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (opts.margin! * 2);
    const lineHeight = opts.fontSize! * opts.lineHeight! * 0.3527; // Convert to mm

    // Set font
    pdf.setFont(opts.font!, opts.fontStyle);
    pdf.setFontSize(opts.fontSize!);

    let currentY = opts.margin!;

    // Generate based on template
    switch (opts.template) {
      case 'classic':
        currentY = this.generateClassicLetter(pdf, content, metadata, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'creative':
        currentY = this.generateCreativeLetter(pdf, content, metadata, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'executive':
        currentY = this.generateExecutiveLetter(pdf, content, metadata, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'minimal':
        currentY = this.generateMinimalLetter(pdf, content, metadata, opts, pageWidth, contentWidth, currentY, lineHeight);
        break;
      case 'modern':
      default:
        currentY = this.generateModernLetter(pdf, content, metadata, opts, pageWidth, contentWidth, currentY, lineHeight);
    }

    // Add footer
    this.addFooter(pdf, metadata, pageWidth, pageHeight, opts.margin!);

    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  }

  /**
   * Modern Template
   */
  private static generateModernLetter(
    pdf: jsPDF,
    content: string,
    metadata: CoverLetterMetadata,
    opts: PDFOptions,
    pageWidth: number,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    const colors = getColorScheme(opts.colorScheme);
    
    // Header
    applyTextColor(pdf, colors.primary);
    pdf.setFont(opts.font!, 'bold');
    pdf.setFontSize(20);
    pdf.text(metadata.candidateName, opts.margin!, currentY);
    currentY += 10;

    applyTextColor(pdf, colors.textLight);
    pdf.setFontSize(10);
    pdf.setFont(opts.font!, 'normal');
    const contactInfo = [metadata.email, metadata.phone, metadata.location].filter(Boolean).join('  •  ');
    pdf.text(contactInfo, opts.margin!, currentY);
    currentY += 15;

    // Date
    applyTextColor(pdf, colors.text);
    pdf.text(metadata.date, opts.margin!, currentY);
    currentY += 15;

    // Recipient
    pdf.setFont(opts.font!, 'bold');
    pdf.text('To:', opts.margin!, currentY);
    currentY += 6;
    pdf.setFont(opts.font!, 'normal');
    if (metadata.recipientName) {
      pdf.text(metadata.recipientName, opts.margin!, currentY);
      currentY += 5;
    }
    if (metadata.recipientTitle) {
      pdf.text(metadata.recipientTitle, opts.margin!, currentY);
      currentY += 5;
    }
    pdf.text(metadata.companyName, opts.margin!, currentY);
    currentY += 15;

    // Salutation
    const salutation = metadata.recipientName ? `Dear ${metadata.recipientName},` : 'Dear Hiring Manager,';
    pdf.text(salutation, opts.margin!, currentY);
    currentY += 10;

    // Content
    currentY = this.addContent(pdf, content, opts.margin!, currentY, contentWidth, lineHeight);

    // Closing
    currentY += 10;
    pdf.text('Sincerely,', opts.margin!, currentY);
    currentY += 15;
    pdf.setFont(opts.font!, 'bold');
    pdf.text(metadata.candidateName, opts.margin!, currentY);

    return currentY;
  }

  /**
   * Classic Template
   */
  private static generateClassicLetter(
    pdf: jsPDF,
    content: string,
    metadata: CoverLetterMetadata,
    opts: PDFOptions,
    pageWidth: number,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    // Centered Header
    pdf.setFont(opts.font!, 'bold');
    pdf.setFontSize(18);
    pdf.text(metadata.candidateName, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    pdf.setFont(opts.font!, 'normal');
    pdf.setFontSize(10);
    const contactInfo = [metadata.email, metadata.phone, metadata.location].filter(Boolean).join(' | ');
    pdf.text(contactInfo, pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;

    // Date (Right aligned)
    pdf.text(metadata.date, pageWidth - opts.margin!, currentY, { align: 'right' });
    currentY += 15;

    // Recipient
    if (metadata.recipientName) {
      pdf.text(metadata.recipientName, opts.margin!, currentY);
      currentY += 5;
    }
    pdf.text(metadata.companyName, opts.margin!, currentY);
    currentY += 15;

    // Salutation
    const salutation = metadata.recipientName ? `Dear ${metadata.recipientName},` : 'Dear Hiring Manager,';
    pdf.text(salutation, opts.margin!, currentY);
    currentY += 10;

    // Content
    currentY = this.addContent(pdf, content, opts.margin!, currentY, contentWidth, lineHeight);

    // Closing
    currentY += 10;
    pdf.text('Sincerely,', opts.margin!, currentY);
    currentY += 15;
    pdf.text(metadata.candidateName, opts.margin!, currentY);

    return currentY;
  }

  /**
   * Creative Template
   */
  private static generateCreativeLetter(
    pdf: jsPDF,
    content: string,
    metadata: CoverLetterMetadata,
    opts: PDFOptions,
    pageWidth: number,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    const colors = getColorScheme(opts.colorScheme);
    
    // Sidebar
    applyFillColor(pdf, colors.primary);
    pdf.rect(0, 0, 60, pdf.internal.pageSize.getHeight(), 'F');

    // Name in sidebar
    applyTextColor(pdf, { r: 255, g: 255, b: 255 });
    pdf.setFont(opts.font!, 'bold');
    pdf.setFontSize(16);
    const nameLines = pdf.splitTextToSize(metadata.candidateName, 40);
    nameLines.forEach((line: string, i: number) => {
      pdf.text(line, 10, currentY + (i * 7));
    });
    currentY += nameLines.length * 7 + 10;

    // Contact in sidebar
    pdf.setFontSize(9);
    pdf.setFont(opts.font!, 'normal');
    if (metadata.email) {
      pdf.text(metadata.email, 10, currentY);
      currentY += 6;
    }
    if (metadata.phone) {
      pdf.text(metadata.phone, 10, currentY);
      currentY += 6;
    }
    if (metadata.location) {
      pdf.text(metadata.location, 10, currentY);
    }

    // Main Content
    applyTextColor(pdf, colors.text);
    currentY = opts.margin!;
    const mainX = 70;
    const mainWidth = pageWidth - 85;

    pdf.setFontSize(10);
    pdf.text(metadata.date, mainX, currentY);
    currentY += 15;

    pdf.setFont(opts.font!, 'bold');
    pdf.text(`To: ${metadata.companyName}`, mainX, currentY);
    currentY += 15;

    pdf.setFont(opts.font!, 'normal');
    pdf.setFontSize(11);
    const salutation = metadata.recipientName ? `Dear ${metadata.recipientName},` : 'Dear Hiring Manager,';
    pdf.text(salutation, mainX, currentY);
    currentY += 10;

    currentY = this.addContent(pdf, content, mainX, currentY, mainWidth, lineHeight);

    currentY += 10;
    pdf.text('Best regards,', mainX, currentY);
    currentY += 15;
    pdf.setFont(opts.font!, 'bold');
    pdf.text(metadata.candidateName, mainX, currentY);

    return currentY;
  }

  /**
   * Executive Template
   */
  private static generateExecutiveLetter(
    pdf: jsPDF,
    content: string,
    metadata: CoverLetterMetadata,
    opts: PDFOptions,
    pageWidth: number,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    // Use Times for executive look
    pdf.setFont('times', 'bold');
    pdf.setFontSize(18);
    pdf.text(metadata.candidateName, opts.margin!, currentY);
    currentY += 10;

    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    const contact = [metadata.email, metadata.phone, metadata.location].filter(Boolean).join(' | ');
    pdf.text(contact, opts.margin!, currentY);
    currentY += 20;

    pdf.text(metadata.date, opts.margin!, currentY);
    currentY += 15;

    pdf.setFont('times', 'bold');
    pdf.text(metadata.companyName, opts.margin!, currentY);
    currentY += 15;

    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    const salutation = metadata.recipientName ? `Dear ${metadata.recipientName},` : 'Dear Hiring Manager,';
    pdf.text(salutation, opts.margin!, currentY);
    currentY += 12;

    currentY = this.addContent(pdf, content, opts.margin!, currentY, contentWidth, lineHeight, 'times');

    currentY += 15;
    pdf.text('Sincerely,', opts.margin!, currentY);
    currentY += 20;
    pdf.setFont('times', 'bold');
    pdf.text(metadata.candidateName, opts.margin!, currentY);

    return currentY;
  }

  /**
   * Minimal Template
   */
  private static generateMinimalLetter(
    pdf: jsPDF,
    content: string,
    metadata: CoverLetterMetadata,
    opts: PDFOptions,
    pageWidth: number,
    contentWidth: number,
    currentY: number,
    lineHeight: number
  ): number {
    pdf.setFont(opts.font!, 'bold');
    pdf.setFontSize(14);
    pdf.text(metadata.candidateName, opts.margin!, currentY);
    currentY += 15;

    pdf.setFont(opts.font!, 'normal');
    pdf.setFontSize(10);
    pdf.text(metadata.date, opts.margin!, currentY);
    currentY += 10;

    const salutation = metadata.recipientName ? `Dear ${metadata.recipientName},` : 'Dear Hiring Manager,';
    pdf.text(salutation, opts.margin!, currentY);
    currentY += 10;

    currentY = this.addContent(pdf, content, opts.margin!, currentY, contentWidth, lineHeight);

    currentY += 10;
    pdf.text('Sincerely,', opts.margin!, currentY);
    currentY += 10;
    pdf.text(metadata.candidateName, opts.margin!, currentY);

    return currentY;
  }

  /**
   * Download the generated PDF
   */
  static downloadPDF(pdfBlob: Blob, filename: string): void {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate and download PDF in one step
   */
  static async generateAndDownloadCoverLetter(
    content: string,
    metadata: CoverLetterMetadata,
    filename?: string,
    options?: PDFOptions
  ): Promise<void> {
    try {
      const pdfBlob = await this.generateCoverLetterPDF(content, metadata, options);
      const defaultFilename = `${metadata.candidateName.replace(/\s+/g, '_')}_Cover_Letter_${metadata.companyName.replace(/\s+/g, '_')}.pdf`;
      this.downloadPDF(pdfBlob, filename || defaultFilename);
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error('Failed to generate PDF cover letter');
    }
  }

  /**
   * Add cover letter content with proper text wrapping
   */
  private static addContent(
    pdf: jsPDF,
    content: string,
    margin: number,
    currentY: number,
    contentWidth: number,
    lineHeight: number,
    font?: string
  ): number {
    pdf.setFont(font || 'helvetica', 'normal');
    pdf.setFontSize(11);

    // Split content into paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    for (const paragraph of paragraphs) {
      const lines = pdf.splitTextToSize(paragraph.trim(), contentWidth);
      
      for (const line of lines) {
        // Check if we need a new page
        if (currentY > pdf.internal.pageSize.getHeight() - margin - 20) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.text(line, margin, currentY);
        currentY += lineHeight;
      }
      
      currentY += lineHeight * 0.5; // Space between paragraphs
    }

    return currentY;
  }

  /**
   * Add footer with page numbers and additional info
   */
  private static addFooter(
    pdf: jsPDF,
    metadata: CoverLetterMetadata,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ): void {
    const footerY = pageHeight - 10;
    
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    
    // Add page number
    const pageNumber = pdf.internal.getCurrentPageInfo().pageNumber;
    const pageText = `Page ${pageNumber}`;
    pdf.text(pageText, pageWidth - margin - 20, footerY, { align: 'right' });
    
    // Add confidentiality note
    const confidentiality = 'Generated by Hireall AI';
    pdf.text(confidentiality, margin, footerY);
  }

  /**
   * Preview PDF in new tab before downloading
   */
  static async previewPDF(content: string, metadata: CoverLetterMetadata, options?: PDFOptions): Promise<void> {
    try {
      const pdfBlob = await this.generateCoverLetterPDF(content, metadata, options);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000); // Revoke after 1 minute
    } catch (error) {
      console.error('PDF preview failed:', error);
      throw new Error('Failed to generate PDF preview');
    }
  }

  /**
   * Validate cover letter content for PDF generation
   */
  static validateContent(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!content || content.trim().length === 0) {
      errors.push('Cover letter content cannot be empty');
    }
    
    if (content.length < 100) {
      errors.push('Cover letter is too short');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default PDFGenerator;
