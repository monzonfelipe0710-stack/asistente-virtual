import { useSyncExternalStore } from "react";
import { Appearance } from "react-native";

/**
 * Paleta ChatAP. Neutros sin tinte (blanco y grises en claro, negro y grises en
 * oscuro) y el azul solo donde algo es accionable o está activo:
 *
 * - `accent`     azul para acentos SIN texto encima: foco, pestaña activa,
 *                interruptores.
 * - `primary`    azul profundo de la acción principal, con texto blanco.
 *                Una sola por pantalla.
 * - `accentText` azul para enlaces y para el texto del ítem activo.
 *
 * Nunca azul en texto de lectura, burbujas, tarjetas ni fondos de página.
 */
const light = {
  canvas: "#FFFFFF",
  surface: "#F4F5F7",
  surface2: "#EAECF0",
  bubble: "#F0F1F3",
  border: "#E3E5EA",
  composerBorder: "#ECEEF1",

  ink: "#0E1116",
  ink2: "#596070",
  ink3: "#666D7A",

  accent: "#2F6BFF",
  accentText: "#1C44B6",
  ring: "rgba(47,107,255,0.18)",
  primary: "#1C44B6",
  primaryHover: "#17399A",
  activeBg: "#EBF2FF",
  activeInk: "#1C44B6",

  bot: "#121A3A",
  botEye: "#FFFFFF",
  thumb: "#FFFFFF",
  toggleOff: "#E3E5EA",
  scrim: "rgba(0,0,0,0.4)",

  // Estados de un expediente o de un pedido.
  info: "#1C44B6",
  warn: "#B45309",
  bad: "#C62828",
  ok: "#15803D",
  okBg: "rgba(22,163,74,0.12)",
  danger: "#D93636",
};

export type Palette = typeof light;

const dark: Palette = {
  canvas: "#000000",
  surface: "#141414",
  surface2: "#1F1F1F",
  bubble: "#262626",
  border: "#2A2A2A",
  composerBorder: "#1F1F1F",

  ink: "#EDEDED",
  ink2: "#A1A1A1",
  ink3: "#808080",

  accent: "#4D7DFF",
  accentText: "#9DB3FF",
  ring: "rgba(77,125,255,0.28)",
  primary: "#3A6AE0",
  primaryHover: "#3260D0",
  activeBg: "#0D1B40",
  activeInk: "#9DB8FF",

  bot: "#FFFFFF",
  botEye: "#000000",
  thumb: "#2A2A2A",
  toggleOff: "#2A2A2A",
  scrim: "rgba(0,0,0,0.4)",

  info: "#9DB3FF",
  warn: "#F5C451",
  bad: "#FF8A8A",
  ok: "#4ADE80",
  okBg: "rgba(74,222,128,0.14)",
  danger: "#FF6B6B",
};

/**
 * react-native-web no implementa `Appearance.setColorScheme`: su Appearance solo
 * lee el media query del SO. Por eso el esquema vive acá y no en Appearance, y
 * arranca en claro: así el switch del menú funciona también en web, y el render
 * inicial del cliente coincide con el prerender estático (que corre en Node y
 * siempre sale claro). Si el cliente siguiera al SO, la hidratación rompería.
 */
type Scheme = "light" | "dark";

let scheme: Scheme = "light";
const listeners = new Set<() => void>();

export function setColorScheme(next: Scheme) {
  scheme = next;
  Appearance.setColorScheme?.(next); // en nativo, para la barra del sistema
  listeners.forEach((avisar) => avisar());
}

function subscribe(avisar: () => void) {
  listeners.add(avisar);
  return () => void listeners.delete(avisar);
}

const getScheme = () => scheme;

export function useColorScheme(): Scheme {
  return useSyncExternalStore(subscribe, getScheme, getScheme);
}

/** Paleta del esquema activo. */
export function useColors(): Palette {
  return useColorScheme() === "dark" ? dark : light;
}

/**
 * Familias cargadas en `src/app/_layout.tsx`. Geist en tres pesos y Geist Mono
 * solo para números de expediente, fechas y microetiquetas. Los textos no
 * nombran la familia: `components/ui/Text` la elige según el `fontWeight`.
 */
export const Fonts = {
  regular: "Geist_400Regular",
  medium: "Geist_500Medium",
  semibold: "Geist_600SemiBold",
  mono: "GeistMono_500Medium",
} as const;

/** Tres pesos en toda la app. */
export const Weight = {
  normal: "400",
  medium: "500",
  semibold: "600",
} as const;

/**
 * Estilos de texto por rol. Escala: 34 · 28 · 20 · 17 · 16 · 15 · 14 · 13 · 12 · 11.
 * Nada por debajo de 11.
 */
export const Type = {
  /** Título de pantalla. */
  pageTitle: { fontSize: 28, lineHeight: 34, fontWeight: Weight.semibold, letterSpacing: -0.56 },
  /** Bajada del título. */
  lead: { fontSize: 15, lineHeight: 22, fontWeight: Weight.normal },
  /** Título de sección. */
  cardTitle: { fontSize: 17, lineHeight: 22, fontWeight: Weight.semibold, letterSpacing: -0.17 },
  /** Título de hoja inferior. */
  sheetTitle: { fontSize: 20, lineHeight: 26, fontWeight: Weight.semibold, letterSpacing: -0.4 },
  /** Cifra de un indicador. */
  figure: { fontSize: 34, lineHeight: 40, fontWeight: Weight.semibold, letterSpacing: -1 },
  /** Título de una fila de lista. */
  rowTitle: { fontSize: 16, lineHeight: 22, fontWeight: Weight.semibold },
  body: { fontSize: 15, lineHeight: 20, fontWeight: Weight.normal },
  bodyStrong: { fontSize: 15, lineHeight: 20, fontWeight: Weight.semibold },
  /** Dato secundario de una fila. */
  label: { fontSize: 14, lineHeight: 20, fontWeight: Weight.medium },
  meta: { fontSize: 13, lineHeight: 18, fontWeight: Weight.normal },
  metaStrong: { fontSize: 13, lineHeight: 18, fontWeight: Weight.medium },
  /** Dato técnico: número de expediente, fecha. */
  mono: { fontSize: 12, lineHeight: 16, fontFamily: Fonts.mono },
  /** Microetiqueta de un grupo. */
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: Fonts.mono,
    letterSpacing: 0.88,
    textTransform: "uppercase" as const,
  },
} as const;

/** Base de 4 pt. El margen lateral de cada pantalla es `Spacing[5]` (20). */
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

/** Escala de radios: 8 · 12 · 16 · 20 · 28 · 999. */
export const Radius = {
  sm: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 28,
  full: 999,
} as const;

/** Alturas fijas. */
export const Size = {
  header: 56,
  touch: 44,
  input: 52,
  button: 52,
  composer: 56,
  drawer: 320,
} as const;

/** Curva de todo el movimiento: cubic-bezier(.22, 1, .36, 1). */
export const Motion = {
  duration: 240,
  drawer: 320,
  sheet: 340,
  bezier: [0.22, 1, 0.36, 1] as const,
} as const;

export const Shadows = {
  /** Pastilla blanca del control segmentado. */
  sm: {
    shadowColor: "#0E1116",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 1,
  },
  /** Perilla de un interruptor. */
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  /** Hoja inferior. */
  sheet: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 16,
  },
} as const;
