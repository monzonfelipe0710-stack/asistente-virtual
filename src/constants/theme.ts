import { useSyncExternalStore } from "react";
import { Appearance } from "react-native";

/**
 * Paleta ChatAP v6.
 *
 * Neutros sin tinte (blanco y grises en claro, negro y grises en oscuro) y el
 * azul ChatAP solo donde algo es accionable o está activo:
 *
 * - `accentBlue` (#2F6BFF / #4D7DFF): acentos SIN texto encima. Foco, pestaña
 *   activa, interruptores, barra destacada del gráfico.
 * - `primary` (#1C44B6 / #3A6AE0): la acción principal, con texto blanco. Una
 *   sola por pantalla.
 * - `accentText` (#1C44B6 / #9DB3FF): enlaces y texto del ítem activo.
 *
 * Nunca azul en texto de lectura, burbujas, tarjetas ni fondos de página.
 */
const V6Light = {
  canvas: "#FFFFFF",
  surface: "#F4F5F7",
  surface2: "#EAECF0",
  bubble: "#F0F1F3",
  border: "#E3E5EA",
  cborder: "#ECEEF1",
  ink: "#0E1116",
  ink2: "#596070",
  ink3: "#666D7A",
  accentBlue: "#2F6BFF",
  accentText: "#1C44B6",
  ring: "rgba(47,107,255,0.18)",
  primary: "#1C44B6",
  primaryHover: "#17399A",
  activeBg: "#EBF2FF",
  activeInk: "#1C44B6",
  danger: "#D93636",
  bot: "#121A3A",
  botEye: "#FFFFFF",
  thumb: "#FFFFFF",
  toggleOff: "#E3E5EA",
  ok: "#16A34A",
  okBg: "rgba(22,163,74,0.12)",
  scrim: "rgba(0,0,0,0.4)",

  statusIngresado: "#1C44B6",
  statusProcess: "#B45309",
  statusObserved: "#C62828",
  statusFinished: "#15803D",
  priorityHigh: "#D93636",
} as const;

type V6Palette = Record<keyof typeof V6Light, string>;

const V6Dark: V6Palette = {
  canvas: "#000000",
  surface: "#141414",
  surface2: "#1F1F1F",
  bubble: "#262626",
  border: "#2A2A2A",
  cborder: "#1F1F1F",
  ink: "#EDEDED",
  ink2: "#A1A1A1",
  ink3: "#808080",
  accentBlue: "#4D7DFF",
  accentText: "#9DB3FF",
  ring: "rgba(77,125,255,0.28)",
  primary: "#3A6AE0",
  primaryHover: "#3260D0",
  activeBg: "#0D1B40",
  activeInk: "#9DB8FF",
  danger: "#FF6B6B",
  bot: "#FFFFFF",
  botEye: "#000000",
  thumb: "#2A2A2A",
  toggleOff: "#2A2A2A",
  ok: "#4ADE80",
  okBg: "rgba(74,222,128,0.14)",
  scrim: "rgba(0,0,0,0.4)",

  statusIngresado: "#9DB3FF",
  statusProcess: "#F5C451",
  statusObserved: "#FF8A8A",
  statusFinished: "#4ADE80",
  priorityHigh: "#FF8A8A",
};

/**
 * Paleta del lado ciudadano. Conserva los nombres viejos (`slate*`, `white`,
 * `primaryLight`) para que los componentes no cambien de nombre, pero sus
 * valores salen de V6. Lo nuevo se escribe contra los nombres de V6.
 */
export const Colors = {
  ...V6Light,

  primaryLight: V6Light.activeBg,
  primaryMid: V6Light.accentBlue,
  primaryDark: V6Light.primaryHover,

  accent: V6Light.accentBlue,
  emerald: V6Light.statusFinished,
  emeraldLight: V6Light.okBg,

  statusActive: V6Light.statusFinished,
  statusInactive: V6Light.ink3,

  white: V6Light.canvas,
  slate50: V6Light.surface,
  slate100: V6Light.surface,
  slate200: V6Light.border,
  slate300: "#D9DCE2",
  slate400: V6Light.ink3,
  slate500: V6Light.ink2,
  slate600: V6Light.ink2,
  slate700: V6Light.ink,
  slate800: V6Light.ink,
  slate900: V6Light.ink,

  pdfBg: V6Light.surface,
  pdfText: V6Light.ink2,
  docxBg: V6Light.surface,
  docxText: V6Light.ink2,
  xlsxBg: V6Light.surface,
  xlsxText: V6Light.ink2,

  background: V6Light.canvas,
  borderFocus: V6Light.accentBlue,
} as const;

export type Palette = Record<keyof typeof Colors, string>;

export const DarkColors: Palette = {
  ...V6Dark,

  primaryLight: V6Dark.activeBg,
  primaryMid: V6Dark.accentBlue,
  primaryDark: V6Dark.primaryHover,

  accent: V6Dark.accentBlue,
  emerald: V6Dark.statusFinished,
  emeraldLight: V6Dark.okBg,

  statusActive: V6Dark.statusFinished,
  statusInactive: V6Dark.ink3,

  white: V6Dark.canvas,
  slate50: V6Dark.surface,
  slate100: V6Dark.surface,
  slate200: V6Dark.border,
  slate300: "#333333",
  slate400: V6Dark.ink3,
  slate500: V6Dark.ink2,
  slate600: V6Dark.ink2,
  slate700: V6Dark.ink,
  slate800: V6Dark.ink,
  slate900: V6Dark.ink,

  pdfBg: V6Dark.surface,
  pdfText: V6Dark.ink2,
  docxBg: V6Dark.surface,
  docxText: V6Dark.ink2,
  xlsxBg: V6Dark.surface,
  xlsxText: V6Dark.ink2,

  background: V6Dark.canvas,
  borderFocus: V6Dark.accentBlue,
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
 * Paleta del panel admin. Mismos valores que el lado ciudadano, con nombres
 * por rol. Regla de uso: el color marca ESTADO, no decora.
 *
 * - `brand`: azul ChatAP para acentos sin texto (subrayado de pestaña, foco).
 * - `brandDeep`: texto en azul (enlaces, ítem activo).
 * - `primary`: fondo del botón principal, con texto blanco.
 */
export const AdminColors = {
  ink: V6Light.ink,
  canvas: V6Light.canvas,
  paper: V6Light.canvas,
  mist: V6Light.surface,
  soft: V6Light.surface2,
  line: V6Light.border,
  muted: V6Light.ink2,
  faint: V6Light.ink3,

  brand: V6Light.accentBlue,
  brandDark: V6Light.primaryHover,
  brandDeep: V6Light.accentText,
  primary: V6Light.primary,
  primaryHover: V6Light.primaryHover,
  ring: V6Light.ring,
  activeBg: V6Light.activeBg,
  activeInk: V6Light.activeInk,
  thumb: V6Light.thumb,
  toggleOff: V6Light.toggleOff,
  scrim: V6Light.scrim,

  ok: V6Light.statusFinished,
  okBg: V6Light.okBg,
  warn: V6Light.statusProcess,
  bad: V6Light.statusObserved,
  danger: V6Light.danger,
  info: V6Light.statusIngresado,

  sidebarBg: V6Light.canvas,
  sidebarBorder: V6Light.border,
  sidebarHover: V6Light.surface,
  sidebarText: V6Light.ink,
  sidebarTextHover: V6Light.ink,
  sidebarSectionText: V6Light.ink3,
  sidebarActiveBg: V6Light.activeBg,
  sidebarActiveText: V6Light.activeInk,
} as const;

export type AdminPalette = Record<keyof typeof AdminColors, string>;

export const AdminDarkColors: AdminPalette = {
  ink: V6Dark.ink,
  canvas: V6Dark.canvas,
  paper: V6Dark.canvas,
  mist: V6Dark.surface,
  soft: V6Dark.surface2,
  line: V6Dark.border,
  muted: V6Dark.ink2,
  faint: V6Dark.ink3,

  brand: V6Dark.accentBlue,
  brandDark: V6Dark.primaryHover,
  brandDeep: V6Dark.accentText,
  primary: V6Dark.primary,
  primaryHover: V6Dark.primaryHover,
  ring: V6Dark.ring,
  activeBg: V6Dark.activeBg,
  activeInk: V6Dark.activeInk,
  thumb: V6Dark.thumb,
  toggleOff: V6Dark.toggleOff,
  scrim: V6Dark.scrim,

  ok: V6Dark.statusFinished,
  okBg: V6Dark.okBg,
  warn: V6Dark.statusProcess,
  bad: V6Dark.statusObserved,
  danger: V6Dark.danger,
  info: V6Dark.statusIngresado,

  sidebarBg: V6Dark.canvas,
  sidebarBorder: V6Dark.border,
  sidebarHover: V6Dark.surface,
  sidebarText: V6Dark.ink,
  sidebarTextHover: V6Dark.ink,
  sidebarSectionText: V6Dark.ink3,
  sidebarActiveBg: V6Dark.activeBg,
  sidebarActiveText: V6Dark.activeInk,
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

/**
 * Familias cargadas en `src/app/_layout.tsx`. Geist en tres pesos (400, 500,
 * 600) y Geist Mono 500 solo para microetiquetas. Los textos no las nombran:
 * `components/common/Text` elige la familia según el `fontWeight`.
 */
export const Fonts = {
  regular: "Geist_400Regular",
  medium: "Geist_500Medium",
  semibold: "Geist_600SemiBold",
  mono: "GeistMono_500Medium",
} as const;

/** Escala v6: 34 · 28 · 20 · 17 · 16 · 15 · 14 · 13 · 12 · 11. Nada debajo de 11. */
export const Typography = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 17,
  xl: 20,
  "2xl": 28,

  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  // v6 usa tres pesos: lo que antes iba en negrita sale en 600
  bold: "600" as const,
} as const;

/**
 * Estilos de texto por rol, compartidos entre el inicio y el panel admin.
 * Medidas de la anatomía de pantalla v6.
 */
export const Type = {
  /** Título de pantalla: 28/34 · 600 · −0.02em. */
  pageTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: Typography.semibold,
    letterSpacing: -0.56,
  },
  /** Bajada del título: 15/22. */
  lead: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: Typography.normal,
  },
  /** Título de sección: 17/22 · 600 · −0.01em. */
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: Typography.semibold,
    letterSpacing: -0.17,
  },
  /** Título de hoja inferior: 20/26 · 600 · −0.02em. */
  sheetTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: Typography.semibold,
    letterSpacing: -0.4,
  },
  /** Cifra de indicador: 34/40 · 600 · −0.03em. */
  figure: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: Typography.semibold,
    letterSpacing: -1,
  },
  /** Título de fila de lista: 16/22 · 600. */
  rowTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: Typography.semibold,
  },
  body: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: Typography.normal,
  },
  bodyStrong: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: Typography.semibold,
  },
  /** Meta de fila: 14/20. */
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: Typography.medium,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: Typography.normal,
  },
  metaStrong: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: Typography.medium,
  },
  /** Dato técnico (número de expediente, fecha): Geist Mono 12. */
  mono: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.mono,
  },
  /** Microetiqueta de grupo: Geist Mono 11 · +0.08em · mayúsculas. */
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: Fonts.mono,
    letterSpacing: 0.88,
    textTransform: "uppercase" as const,
  },
} as const;

/** Base de 4 pt. Margen lateral de pantalla: 20. */
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

/** Escala de radios v6: 8 · 12 · 16 · 20 · 28 · 999. */
export const Radius = {
  sm: 8,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 28,
  full: 999,
} as const;

/** Alturas fijas v6. */
export const Size = {
  header: 56,
  touch: 44,
  input: 52,
  button: 52,
  composer: 56,
  drawer: 320,
} as const;

/** Curva de todo el movimiento: 240 ms · cubic-bezier(.22,1,.36,1). */
export const Motion = {
  duration: 240,
  drawer: 320,
  sheet: 340,
  bezier: [0.22, 1, 0.36, 1] as const,
} as const;

export const Shadows = {
  sm: {
    shadowColor: "#0E1116",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  /** Hoja inferior: 0 −12 40 · 18 %. */
  sheet: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 16,
  },
  /** Botón flotante "Aprobar todas": 0 12 30 · 40 %. */
  float: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
} as const;
