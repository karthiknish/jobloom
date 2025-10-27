/**
 * PDF Generation Utility for Cover Letters
 * Provides functionality to generate and download professional PDF cover letters
 */

import jsPDF from 'jspdf';

export interface PDFOptions {
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
}

export class PDFGenerator {
  private static readonly DEFAULT_OPTIONS: PDFOptions = {
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

    // Add header with candidate info
    currentY = this.addHeader(pdf, metadata, pageWidth, opts.margin!, currentY);

    // Add date
    pdf.setFontSize(opts.fontSize!);
    pdf.text(metadata.date, pageWidth - opts.margin! - 40, currentY, { align: 'right' });
    currentY += lineHeight * 2;

    // Add recipient info
    if (metadata.recipientName || metadata.recipientTitle) {
      currentY = this.addRecipientInfo(pdf, metadata, pageWidth, opts.margin!, currentY);
      currentY += lineHeight;
    }

    // Add salutation
    pdf.setFont(opts.font!, 'normal');
    const salutation = metadata.recipientName ? `Dear ${metadata.recipientName},` : 'Dear Hiring Manager,';
    pdf.text(salutation, opts.margin!, currentY);
    currentY += lineHeight * 2;

    // Add cover letter content
    currentY = this.addContent(pdf, content, opts.margin!, currentY, contentWidth, lineHeight);

    // Add closing
    currentY = this.addClosing(pdf, metadata, pageWidth, opts.margin!, currentY, lineHeight);

    // Add footer
    this.addFooter(pdf, metadata, pageWidth, pageHeight, opts.margin!);

    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
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
   * Add header with candidate information
   */
  private static addHeader(
    pdf: jsPDF,
    metadata: CoverLetterMetadata,
    pageWidth: number,
    margin: number,
    currentY: number
  ): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(metadata.candidateName, margin, currentY);
    currentY += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    // Add contact info (placeholder - in real implementation, this would come from user profile)
    const contactInfo = [
      'Email: your.email@example.com',
      'Phone: (555) 123-4567',
      'Location: Your City, State'
    ];

    contactInfo.forEach(line => {
      pdf.text(line, margin, currentY);
      currentY += 5;
    });

    currentY += 5; // Extra space after header

    return currentY;
  }

  /**
   * Add recipient information
   */
  private static addRecipientInfo(
    pdf: jsPDF,
    metadata: CoverLetterMetadata,
    pageWidth: number,
    margin: number,
    currentY: number
  ): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    
    if (metadata.recipientName) {
      pdf.text(metadata.recipientName, margin, currentY);
      currentY += 6;
    }
    
    if (metadata.recipientTitle) {
      pdf.text(metadata.recipientTitle, margin, currentY);
      currentY += 6;
    }
    
    pdf.text(metadata.companyName, margin, currentY);

    return currentY;
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
    lineHeight: number
  ): number {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);

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
   * Add closing section
   */
  private static addClosing(
    pdf: jsPDF,
    metadata: CoverLetterMetadata,
    pageWidth: number,
    margin: number,
    currentY: number,
    lineHeight: number
  ): number {
    currentY += lineHeight;

    // Add closing phrase
    pdf.setFont('helvetica', 'normal');
    pdf.text('Sincerely,', margin, currentY);
    currentY += lineHeight * 2;

    // Add signature placeholder
    pdf.setFont('helvetica', 'bold');
    pdf.text(metadata.candidateName, margin, currentY);

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
    
    // Add page number
    const pageNumber = pdf.internal.getCurrentPageInfo().pageNumber;
    const pageText = `Page ${pageNumber}`;
    pdf.text(pageText, pageWidth - margin - 20, footerY, { align: 'right' });
    
    // Add confidentiality note
    const confidentiality = 'Confidential Cover Letter';
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
      // Note: In production, you might want to revoke the URL after some time
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
    
    if (content.length < 200) {
      errors.push('Cover letter is too short (minimum 200 characters)');
    }
    
    if (content.length > 10000) {
      errors.push('Cover letter is too long (maximum 10,000 characters)');
    }
    
    // Check for basic structure
    if (!content.toLowerCase().includes('dear')) {
      errors.push('Cover letter should include a salutation (e.g., "Dear Hiring Manager,")');
    }
    
    if (!content.toLowerCase().includes('sincerely') && !content.toLowerCase().includes('best regards')) {
      errors.push('Cover letter should include a closing (e.g., "Sincerely,")');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get estimated PDF file size before generation
   */
  static estimateFileSize(content: string): number {
    // Rough estimate: ~2KB per page + content size
    const estimatedPages = Math.ceil(content.length / 2000);
    return estimatedPages * 2048 + content.length;
  }

  /**
   * Generate multiple cover letters in a single PDF
   */
  static async generateMultipleCoverLetters(
    coverLetters: Array<{ content: string; metadata: CoverLetterMetadata }>,
    options?: PDFOptions
  ): Promise<Blob> {
    if (coverLetters.length === 0) {
      throw new Error('No cover letters provided');
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    for (let i = 0; i < coverLetters.length; i++) {
      const { content, metadata } = coverLetters[i];
      
      if (i > 0) {
        pdf.addPage();
      }

      // Generate each cover letter
      const letterBlob = await this.generateCoverLetterPDF(content, metadata, options);
      
      // Add the cover letter content to the combined PDF
      // Note: Since jsPDF doesn't have loadBlob, we'll regenerate the content
      await this.addCoverLetterToPDF(pdf, content, metadata, options);
    }

    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  }

  /**
   * Add cover letter content to existing PDF
   */
  private static async addCoverLetterToPDF(
    pdf: jsPDF,
    content: string,
    metadata: CoverLetterMetadata,
    options: PDFOptions = {}
  ): Promise<void> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = opts.margin || 15;
    const contentWidth = pageWidth - (margin * 2);
    const lineHeight = opts.fontSize! * opts.lineHeight! * 0.3527;

    let currentY = margin;

    // Add header
    pdf.setFont(opts.font!, 'bold');
    pdf.setFontSize(16);
    pdf.text(metadata.candidateName, margin, currentY);
    currentY += 10;

    pdf.setFont(opts.font!, 'normal');
    pdf.setFontSize(10);
    pdf.text(`${metadata.date}`, margin, currentY);
    currentY += 8;

    // Add recipient
    pdf.setFont(opts.font!, 'bold');
    pdf.setFontSize(12);
    pdf.text(metadata.companyName, margin, currentY);
    currentY += 8;

    pdf.setFont(opts.font!, 'normal');
    pdf.setFontSize(11);
    pdf.text(`Hiring Manager`, margin, currentY);
    currentY += 6;
    pdf.text(`${metadata.companyName}`, margin, currentY);
    currentY += 15;

    // Add content
    const lines = pdf.splitTextToSize(content, contentWidth);
    lines.forEach((line: string) => {
      if (currentY > pageHeight - margin - 20) {
        pdf.addPage();
        currentY = margin;
      }
      pdf.text(line, margin, currentY);
      currentY += lineHeight;
    });
  }
}

export default PDFGenerator;
