import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

/**
 * Export utilities for admin reports
 * Supports CSV, Excel (XLSX), and PDF formats
 */

export interface ExportOptions {
  filename?: string;
  title?: string;
  headers?: string[];
  orientation?: 'portrait' | 'landscape';
}

/**
 * Convert data to CSV format using PapaParse
 */
export function exportToCSV(data: any[], options: ExportOptions = {}): string {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  const csv = Papa.unparse(data, {
    header: true,
    columns: options.headers,
  });

  return csv;
}

/**
 * Generate CSV download response
 */
export function createCSVResponse(data: any[], filename: string): Response {
  const csv = exportToCSV(data);
  const timestamp = new Date().toISOString().split('T')[0];
  
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}-${timestamp}.csv"`,
    },
  });
}

/**
 * Convert data to Excel (XLSX) format
 */
export function exportToExcel(data: any[], options: ExportOptions = {}): ArrayBuffer {
  if (!data || data.length === 0) {
    const emptyWorkbook = XLSX.utils.book_new();
    const emptySheet = XLSX.utils.aoa_to_sheet([['No data available']]);
    XLSX.utils.book_append_sheet(emptyWorkbook, emptySheet, 'Report');
    return XLSX.write(emptyWorkbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  }

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const columnWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, 15)
  }));
  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, options.title || 'Report');

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return buffer as ArrayBuffer;
}

/**
 * Generate Excel download response
 */
export function createExcelResponse(data: any[], filename: string, title?: string): Response {
  const buffer = exportToExcel(data, { title });
  const timestamp = new Date().toISOString().split('T')[0];
  
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}-${timestamp}.xlsx"`,
    },
  });
}

/**
 * Convert data to PDF format
 */
export function exportToPDF(
  data: any[], 
  options: ExportOptions = {}
): jsPDF {
  const doc = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Add title
  const title = options.title || 'Report';
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Add timestamp
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  if (!data || data.length === 0) {
    doc.setFontSize(12);
    doc.text('No data available', 14, 40);
    return doc;
  }

  // Prepare table data
  const headers = options.headers || Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object' && value instanceof Date) {
        return value.toLocaleDateString();
      }
      return String(value);
    })
  );

  // Add table (simple text-based implementation)
  let yPos = 40;
  const lineHeight = 6;
  const pageHeight = doc.internal.pageSize.height;

  // Add headers
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  let headerText = headers.join(' | ');
  doc.text(headerText, 14, yPos);
  yPos += lineHeight;

  // Add separator
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  // Add rows
  rows.forEach((row, index) => {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }
    
    const rowText = row.join(' | ');
    doc.text(rowText, 14, yPos);
    yPos += lineHeight;
  });

  return doc;
}

/**
 * Generate PDF download response
 */
export function createPDFResponse(data: any[], filename: string, title?: string): Response {
  const pdf = exportToPDF(data, { title });
  const pdfBlob = pdf.output('arraybuffer');
  const timestamp = new Date().toISOString().split('T')[0];
  
  return new Response(pdfBlob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}-${timestamp}.pdf"`,
    },
  });
}

/**
 * Format currency for Ethiopian Birr
 */
export function formatETB(amount: number): string {
  try {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  } catch (error) {
    // Fallback to en-US if en-ET is not supported
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  }
}

/**
 * Format date for reports
 */
export function formatReportDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    return d.toLocaleDateString('en-ET', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    // Fallback to en-US if en-ET is not supported
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

/**
 * Calculate period-based aggregations (daily, weekly, monthly)
 */
export function aggregateByPeriod(
  data: any[],
  dateField: string,
  period: 'daily' | 'weekly' | 'monthly'
): Record<string, any[]> {
  const groups: Record<string, any[]> = {};

  data.forEach(item => {
    const date = new Date(item[dateField]);
    let key: string;

    if (period === 'daily') {
      key = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (period === 'weekly') {
      const year = date.getFullYear();
      const week = getWeekNumber(date);
      key = `${year}-W${week.toString().padStart(2, '0')}`;
    } else {
      key = date.toISOString().substring(0, 7); // YYYY-MM
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });

  return groups;
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
