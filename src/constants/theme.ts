import { useSyncExternalStore } from "react";
import { Appearance } from "react-native";

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

/**
 * react-native-web no implementa `Appearance.setColorScheme`: su Appearance solo
 * lee el media query del SO. Por eso el esquema vive acá y no en Appearance, y
 * arranca en claro: así el switch del menú funciona también en web, y el render
 * inicial del cliente coincide con el prerender estático (que corre en Node y
 * siempre sale claro). Si el cliente siguiera al SO, la hidratación rompería.
 */
let scheme: "light" | "dark" = "light";
const listeners = new Set<() => void>();

export function setColorScheme(next: "light" | "dark") {
  scheme = next;
  Appearance.setColorScheme?.(next); // en nativo, para el chrome del sistema
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => void listeners.delete(notify);
}

const getSnapshot = () => scheme;

export function useColorScheme(): "light" | "dark" {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Paleta activa. */
export function useColors(): Palette {
  return useColorScheme() === "dark" ? DarkColors : Colors;
}

/**
 * Paleta del panel admin: son los mismos tokens semánticos que usaba el panel
 * web (`--color-ink`, `--sidebar-bg`, …), traídos tal cual para que el panel se
 * vea igual. Van aparte de `Colors` porque el lado ciudadano usa la escala
 * slate y este usa nombres por rol.
 */
/**
 * Paleta del panel admin.
 *
 * Los nombres son semánticos (`ink`, `line`, `brand`) porque el panel se piensa
 * por rol y no por tono, pero los VALORES salen de `Colors`: el azul de marca,
 * los grises y los estados son los mismos que usa el lado ciudadano. Antes el
 * panel traía su propio celeste (#0284c7) y su propio gris de texto (#172033),
 * y con dos azules en pantalla la app se leía como dos productos distintos.
 *
 * Regla de uso: el color marca ESTADO, no decora. Un ícono, un borde o un fondo
 * teñido tienen que significar algo (activo, pendiente, error); si no, van en
 * neutro.
 */
export const AdminColors = {
  ink: Colors.slate900,
  /** Fondo de la pantalla. Va un escalón por debajo de `paper` para que la
   *  tarjeta se despegue por contraste y no necesite un borde dibujado. */
  canvas: Colors.slate100,
  paper: Colors.white,
  mist: Colors.slate100,
  soft: Colors.slate50,
  line: Colors.slate200,
  muted: Colors.slate500,
  faint: Colors.slate400,

  brand: Colors.primary,
  brandDark: Colors.primaryDark,
  brandDeep: Colors.primary,

  ok: Colors.statusActive,
  warn: Colors.statusObserved,
  bad: "#dc2626",
  info: Colors.statusProcess,

  sidebarBg: Colors.slate50,
  sidebarBorder: Colors.slate200,
  sidebarHover: Colors.slate100,
  sidebarText: Colors.slate600,
  sidebarTextHover: Colors.slate900,
  sidebarSectionText: Colors.slate400,
  sidebarActiveBg: Colors.primary,
  sidebarActiveText: "#ffffff",
} as const;

export type AdminPalette = Record<keyof typeof AdminColors, string>;

/** Mismo criterio en oscuro: los valores salen de `DarkColors`. */
export const AdminDarkColors: AdminPalette = {
  ...AdminColors,

  ink: DarkColors.slate900,
  // En oscuro se invierte la relación: el lienzo es el negro y la tarjeta sube
  // un escalón. Así la tarjeta sigue estando por encima del fondo.
  canvas: DarkColors.slate50,
  paper: DarkColors.slate100,
  mist: DarkColors.slate200,
  soft: DarkColors.slate200,
  line: DarkColors.slate300,
  muted: DarkColors.slate500,
  faint: DarkColors.slate400,

  brand: DarkColors.primary,
  brandDark: DarkColors.primaryMid,
  brandDeep: DarkColors.primary,

  // Los estados suben de luminosidad sobre fondo negro; en los valores claros
  // quedarían por debajo del contraste mínimo.
  ok: "#4ade80",
  warn: "#fbbf24",
  bad: "#f87171",
  info: "#60a5fa",

  sidebarBg: DarkColors.slate100,
  sidebarBorder: DarkColors.slate200,
  sidebarHover: DarkColors.slate200,
  sidebarText: DarkColors.slate600,
  sidebarTextHover: DarkColors.slate900,
  sidebarSectionText: DarkColors.slate400,
  sidebarActiveBg: DarkColors.primary,
};

export function useAdminColors(): AdminPalette {
  return useColorScheme() === "dark" ? AdminDarkColors : AdminColors;
}

/**
 * El panel web pintaba los fondos suaves con `bg-ok/10`. React Native no tiene
 * esa sintaxis, así que el alfa se aplica acá: `withAlpha(C.ok, 0.1)`.
 */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

/**
 * Estilos de texto por rol, compartidos entre el inicio y el panel admin.
 *
 * Existe porque el panel venía inventando tamaños sueltos (10 y 11 px) y
 * mayúsculas con tracking en cada etiqueta. Con una familia tipográfica única
 * en toda la app, esa mezcla de tamaños y cajas es lo que hacía parecer que el
 * admin usaba otra fuente. Acá el piso son 12 px y la caja es normal: la
 * jerarquía la dan el peso y el color, no el grito.
 *
 * `pageTitle` sale de `2xl`, `cardTitle` de `md`, `body` de `base`, `meta` de
 * `sm`: son los mismos escalones que ya usaba la pantalla de inicio.
 */
export const Type = {
  pageTitle: {
    fontSize: Typography["2xl"],
    lineHeight: 30,
    fontWeight: Typography.bold,
  },
  cardTitle: {
    fontSize: Typography.md,
    lineHeight: 22,
    fontWeight: Typography.semibold,
  },
  /** Cifra grande de las tarjetas de resumen: es el dato, no la etiqueta. */
  figure: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: Typography.bold,
  },
  body: {
    fontSize: Typography.base,
    lineHeight: 20,
    fontWeight: Typography.normal,
  },
  bodyStrong: {
    fontSize: Typography.base,
    lineHeight: 20,
    fontWeight: Typography.semibold,
  },
  meta: {
    fontSize: Typography.sm,
    lineHeight: 17,
    fontWeight: Typography.normal,
  },
  metaStrong: {
    fontSize: Typography.sm,
    lineHeight: 17,
    fontWeight: Typography.semibold,
  },
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
