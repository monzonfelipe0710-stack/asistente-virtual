// ─── Design Tokens for ChatAP Mobile ───────────────────────────────────────
// Centralized constants replacing Tailwind CSS classes for React Native

export const Colors = {
  // Brand
  primary: "#1e3a8a",       // blue-800
  primaryLight: "#dbeafe",  // blue-100
  primaryMid: "#1d4ed8",    // blue-700
  primaryDark: "#1e2e6b",   // blue-900
  primaryHover: "#1e3a8a",

  // Accents
  accent: "#22c55e",        // green-400 (online indicator)
  emerald: "#059669",       // emerald-600
  emeraldLight: "#d1fae5",  // emerald-50/100

  // Status colors
  statusActive: "#16a34a",
  statusInactive: "#6b7280",
  statusProcess: "#2563eb",
  statusObserved: "#d97706",
  statusFinished: "#16a34a",
  statusIngresado: "#7c3aed",

  // Neutrals
  white: "#ffffff",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  slate900: "#0f172a",

  // Document format
  pdfBg: "#fef2f2",
  pdfText: "#dc2626",
  docxBg: "#eff6ff",
  docxText: "#2563eb",
  xlsxBg: "#f0fdf4",
  xlsxText: "#16a34a",

  // Backgrounds
  background: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  borderFocus: "#60a5fa",
} as const;

export const Typography = {
  // Font sizes (sp)
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,

  // Font weights
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
} as const;

export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const Radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;