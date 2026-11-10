import { useSyncExternalStore } from "react";
import { Appearance } from "react-native";

import { useAjustes } from "@/lib/accesibilidad";

/**
 * Paleta ChatAP. Neutros sin tinte (azulados en claro, grises cálidos en
 * oscuro) y el azul solo donde algo es accionable o está activo:
 *
 * - `accent`       azul de la acción principal, del foco, de la pestaña activa y de
 *                  los enlaces. Con él va `onAccent` encima.
 * - `activeBg`     tinte del azul para el ítem o la pestaña activa.
 * - `borderStrong` borde de campos, botones y controles; `border` es solo el separador.
 *
 * Nunca azul en texto de lectura, burbujas, tarjetas ni fondos de página.
 */
const light = {
  canvas: "#F9FAFD",
  surface: "#EFF2F9",
  surface2: "#E1E7F3",
  bubble: "#E1E7F3",
  border: "#CFD7E8",
  borderStrong: "#6F7A94",
  composerBorder: "#6F7A94",

  ink: "#0F1626",
  ink2: "#3B4560",
  ink3: "#505A75",

  accent: "#1E40AF",
  accentText: "#1E40AF",
  onAccent: "#FFFFFF",
  ring: "#E3EAFB",
  primary: "#1E40AF",
  primaryHover: "#1E40AF",
  activeBg: "#E3EAFB",
  activeInk: "#1E40AF",

  bot: "#121A3A",
  botEye: "#FFFFFF",
  thumb: "#F9FAFD",
  toggleOff: "#6F7A94",
  scrim: "rgba(20,18,14,0.5)",

  info: "#1F4F8F",
  infoBg: "#E1EAF6",
  warn: "#8A4A00",
  warnBg: "#F8EAD2",
  bad: "#B3261E",
  badBg: "#F9E1DE",
  ok: "#1D6B34",
  okBg: "#E1F0E4",
  danger: "#B3261E",
  dangerFill: "#B3261E",
  onDangerFill: "#FFFFFF",
};

export type Palette = typeof light;

const dark: Palette = {
  canvas: "#262624",
  surface: "#30302E",
  surface2: "#3A3A37",
  bubble: "#3A3A37",
  border: "#4A4A47",
  borderStrong: "#8E8D88",
  composerBorder: "#8E8D88",

  ink: "#F0EEE6",
  ink2: "#C2C0B6",
  ink3: "#A9A79F",

  accent: "#8FB0FF",
  accentText: "#8FB0FF",
  onAccent: "#0B1536",
  ring: "#243459",
  primary: "#8FB0FF",
  primaryHover: "#8FB0FF",
  activeBg: "#243459",
  activeInk: "#8FB0FF",

  bot: "#FFFFFF",
  botEye: "#000000",
  thumb: "#262624",
  toggleOff: "#8E8D88",
  scrim: "rgba(0,0,0,0.55)",

  info: "#9DBDF0",
  infoBg: "#243349",
  warn: "#F0BD6A",
  warnBg: "#40321A",
  bad: "#FF9A92",
  badBg: "#4A2623",
  ok: "#7BD08F",
  okBg: "#213A28",
  danger: "#FF9A92",
  dangerFill: "#FF9A92",
  onDangerFill: "#3A0D0A",
};

/** Alto contraste claro: negro puro sobre blanco puro y bordes del color del texto. */
const lightContrast: Palette = {
  ...light,
  canvas: "#FFFFFF",
  surface: "#FFFFFF",
  surface2: "#F0F0F0",
  bubble: "#F0F0F0",
  border: "#000000",
  borderStrong: "#000000",
  composerBorder: "#000000",

  ink: "#000000",
  ink2: "#1A1A1A",
  ink3: "#262626",

  accent: "#0A2A8A",
  accentText: "#0A2A8A",
  onAccent: "#FFFFFF",
  ring: "#FFFFFF",
  primary: "#0A2A8A",
  primaryHover: "#0A2A8A",
  activeBg: "#FFFFFF",
  activeInk: "#0A2A8A",

  thumb: "#FFFFFF",
  toggleOff: "#000000",
  scrim: "rgba(0,0,0,0.7)",

  info: "#0F3A75",
  infoBg: "#FFFFFF",
  warn: "#5E3200",
  warnBg: "#FFFFFF",
  bad: "#8A0F08",
  badBg: "#FFFFFF",
  ok: "#0B4A1F",
  okBg: "#FFFFFF",
  danger: "#8A0F08",
  dangerFill: "#8A0F08",
  onDangerFill: "#FFFFFF",
};

/** Alto contraste oscuro: blanco puro sobre negro puro. */
const darkContrast: Palette = {
  ...dark,
  canvas: "#000000",
  surface: "#000000",
  surface2: "#1A1A1A",
  bubble: "#1A1A1A",
  border: "#FFFFFF",
  borderStrong: "#FFFFFF",
  composerBorder: "#FFFFFF",

  ink: "#FFFFFF",
  ink2: "#F2F2F2",
  ink3: "#E0E0E0",

  accent: "#A9C4FF",
  accentText: "#A9C4FF",
  onAccent: "#000000",
  ring: "#000000",
  primary: "#A9C4FF",
  primaryHover: "#A9C4FF",
  activeBg: "#000000",
  activeInk: "#A9C4FF",

  thumb: "#000000",
  toggleOff: "#FFFFFF",
  scrim: "rgba(0,0,0,0.75)",

  info: "#B3D0FF",
  infoBg: "#000000",
  warn: "#FFD27F",
  warnBg: "#000000",
  bad: "#FFB3AD",
  badBg: "#000000",
  ok: "#8CF0A5",
  okBg: "#000000",
  danger: "#FFB3AD",
  dangerFill: "#FFB3AD",
  onDangerFill: "#000000",
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

/** Paleta del esquema activo, con más contraste si el ajuste de accesibilidad está encendido. */
export function useColors(): Palette {
  const oscuro = useColorScheme() === "dark";
  const { altoContraste } = useAjustes();
  if (altoContraste) return oscuro ? darkContrast : lightContrast;
  return oscuro ? dark : light;
}

/**
 * Familias cargadas en `src/app/_layout.tsx`. Figtree en cuatro pesos e IBM Plex
 * Mono solo para números de expediente y fechas. Los textos no nombran la
 * familia: `components/ui/Text` la elige según el `fontWeight`. Con "Letra más
 * legible" se usa Atkinson Hyperlegible Next, que tiene 400, 500 y 700.
 */
export const Fonts = {
  regular: "Figtree_400Regular",
  medium: "Figtree_500Medium",
  semibold: "Figtree_600SemiBold",
  bold: "Figtree_700Bold",
  mono: "IBMPlexMono_500Medium",
  legible: "AtkinsonHyperlegibleNext_400Regular",
  legibleMedium: "AtkinsonHyperlegibleNext_500Medium",
  legibleNegrita: "AtkinsonHyperlegibleNext_700Bold",
} as const;

/** Sombra del menú emergente de la cuenta. */
export const SombraDeMenu = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.28,
  shadowRadius: 24,
  elevation: 12,
} as const;

/** Cuatro pesos. */
export const Weight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

/**
 * Estilos de texto por rol. Escala: 36 · 28 · 24 · 22 · 20 · 18 · 17 · 16 · 15 · 14.
 * Nada por debajo de 14, salvo la microetiqueta de los gráficos.
 */
export const Type = {
  /** Título de pantalla. */
  pageTitle: { fontSize: 28, lineHeight: 34, fontWeight: Weight.bold, letterSpacing: -0.3 },
  /** Bajada del título. */
  lead: { fontSize: 17, lineHeight: 24, fontWeight: Weight.normal },
  /** Título de sección. */
  cardTitle: { fontSize: 20, lineHeight: 25, fontWeight: Weight.bold },
  /** Título de hoja inferior. */
  sheetTitle: { fontSize: 22, lineHeight: 28, fontWeight: Weight.bold },
  /** Cifra de un indicador. */
  figure: { fontSize: 36, lineHeight: 40, fontWeight: Weight.bold, letterSpacing: -0.5 },
  /** Título de una fila de lista. */
  rowTitle: { fontSize: 17, lineHeight: 22, fontWeight: Weight.semibold },
  body: { fontSize: 17, lineHeight: 24, fontWeight: Weight.normal },
  bodyStrong: { fontSize: 17, lineHeight: 24, fontWeight: Weight.semibold },
  /** Dato secundario de una fila. */
  label: { fontSize: 15, lineHeight: 20, fontWeight: Weight.medium },
  meta: { fontSize: 15, lineHeight: 21, fontWeight: Weight.normal },
  metaStrong: { fontSize: 15, lineHeight: 21, fontWeight: Weight.medium },
  /** Dato técnico: número de expediente, fecha. */
  mono: { fontSize: 14, lineHeight: 19, fontFamily: Fonts.mono },
  /** Rótulo de un grupo del menú o de un bloque. */
  overline: { fontSize: 14, lineHeight: 18, fontWeight: Weight.semibold },
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

/** Escala de radios: 8 · 12 · 16 · 18 · 20 · 24 · 28 · 999. */
export const Radius = {
  sm: 8,
  lg: 12,
  xl: 16,
  button: 18,
  "2xl": 20,
  "3xl": 28,
  full: 999,
} as const;

/** Alturas fijas. */
export const Size = {
  header: 56,
  touch: 48,
  chip: 44,
  input: 56,
  button: 56,
  buttonCompact: 48,
  composer: 56,
  drawer: 320,
} as const;

/** Curva de todo el movimiento: cubic-bezier(.22, 1, .36, 1). */
export const Motion = {
  duration: 240,
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
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 16,
  },
} as const;
