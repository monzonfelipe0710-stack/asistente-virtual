import { useColorScheme } from "react-native";

export const Colors = {
  primary: "#1e3a8a",
  primaryLight: "#dbeafe",
  primaryMid: "#1d4ed8",
  primaryDark: "#1e2e6b",
  primaryHover: "#1e3a8a",

  accent: "#22c55e",
  emerald: "#059669",
  emeraldLight: "#d1fae5",

  statusActive: "#16a34a",
  statusInactive: "#6b7280",
  statusProcess: "#2563eb",
  statusObserved: "#d97706",
  statusFinished: "#16a34a",
  statusIngresado: "#7c3aed",

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

  pdfBg: "#fef2f2",
  pdfText: "#dc2626",
  docxBg: "#eff6ff",
  docxText: "#2563eb",
  xlsxBg: "#f0fdf4",
  xlsxText: "#16a34a",

  background: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  borderFocus: "#60a5fa",
} as const;

export type Palette = Record<keyof typeof Colors, string>;

// Mismas claves que Colors, con la escala slate invertida: los componentes no
// cambian de nombre, solo de valor. `white` es "la superficie", no el color.
export const DarkColors: Palette = {
  ...Colors,

  // no más claro que esto: la burbuja del usuario lleva texto blanco encima
  primary: "#2563eb",
  primaryLight: "#1e3a5f",
  primaryMid: "#60a5fa",

  white: "#000000",
  slate50: "#000000",
  slate100: "#16161a",
  slate200: "#26262c",
  slate300: "#3d3d44",
  slate400: "#6e6e78",
  slate500: "#8e8e99",
  slate600: "#a8a8b3",
  slate700: "#d6d6dd",
  slate800: "#f0f0f3",
  slate900: "#ffffff",

  pdfBg: "#2a1616",
  docxBg: "#151f2e",
  xlsxBg: "#14251a",

  background: "#000000",
  surface: "#000000",
  border: "#26262c",
};

/** Paleta activa. Sigue el esquema del sistema y a `Appearance.setColorScheme`. */
export function useColors(): Palette {
  return useColorScheme() === "dark" ? DarkColors : Colors;
}

export const Typography = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,

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
