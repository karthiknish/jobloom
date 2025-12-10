/**
 * Resume PDF Color System
 * 
 * Hireall brand colors and themed color schemes.
 */

import jsPDF from 'jspdf';

export interface ThemeColor {
  r: number;
  g: number;
  b: number;
}

export interface ColorScheme {
  primary: ThemeColor;
  secondary: ThemeColor;
  accent: ThemeColor;
  text: ThemeColor;
  textLight: ThemeColor;
  background: ThemeColor;
  border: ThemeColor;
}

export const COLOR_SCHEMES: Record<string, ColorScheme> = {
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
  orange: {
    primary: { r: 234, g: 88, b: 12 },
    secondary: { r: 194, g: 65, b: 12 },
    accent: { r: 251, g: 146, b: 60 },
    text: { r: 31, g: 41, b: 55 },
    textLight: { r: 107, g: 114, b: 128 },
    background: { r: 255, g: 247, b: 237 },
    border: { r: 254, g: 215, b: 170 },
  },
};

export function getColorScheme(name?: string): ColorScheme {
  return COLOR_SCHEMES[name || 'hireall'] || COLOR_SCHEMES.hireall;
}

export function applyTextColor(pdf: jsPDF, color: ThemeColor): void {
  pdf.setTextColor(color.r, color.g, color.b);
}

export function applyFillColor(pdf: jsPDF, color: ThemeColor): void {
  pdf.setFillColor(color.r, color.g, color.b);
}

export function applyDrawColor(pdf: jsPDF, color: ThemeColor): void {
  pdf.setDrawColor(color.r, color.g, color.b);
}
