import {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_500Medium,
  AtkinsonHyperlegibleNext_700Bold,
} from "@expo-google-fonts/atkinson-hyperlegible-next";
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from "@expo-google-fonts/figtree";
import { IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { useSyncExternalStore } from "react";
import { Appearance } from "react-native";

import { useAjustes } from "@/compartido/lib/accesibilidad";

const light = {
  canvas: "#F9FAFD",
  surface: "#EFF2F9",
  surface2: "#E1E7F3",
  bubble: "#E1E7F3",
  border: "#CFD7E8",
  borderStrong: "#6F7A94",

  ink: "#0F1626",
  ink2: "#3B4560",
  ink3: "#505A75",

  accent: "#1E40AF",
  accentText: "#1E40AF",
  onAccent: "#FFFFFF",
  ring: "#E3EAFB",
  activeBg: "#E3EAFB",
  activeInk: "#1E40AF",

  bot: "#121A3A",
  botEye: "#FFFFFF",
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

  ink: "#F0EEE6",
  ink2: "#C2C0B6",
  ink3: "#A9A79F",

  accent: "#8FB0FF",
  accentText: "#8FB0FF",
  onAccent: "#0B1536",
  ring: "#243459",
  activeBg: "#243459",
  activeInk: "#8FB0FF",

  bot: "#FFFFFF",
  botEye: "#000000",
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

const lightContrast: Palette = {
  ...light,
  canvas: "#FFFFFF",
  surface: "#FFFFFF",
  surface2: "#F0F0F0",
  bubble: "#F0F0F0",
  border: "#000000",
  borderStrong: "#000000",

  ink: "#000000",
  ink2: "#1A1A1A",
  ink3: "#262626",

  accent: "#0A2A8A",
  accentText: "#0A2A8A",
  onAccent: "#FFFFFF",
  ring: "#FFFFFF",
  activeBg: "#FFFFFF",
  activeInk: "#0A2A8A",

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

const darkContrast: Palette = {
  ...dark,
  canvas: "#000000",
  surface: "#000000",
  surface2: "#1A1A1A",
  bubble: "#1A1A1A",
  border: "#FFFFFF",
  borderStrong: "#FFFFFF",

  ink: "#FFFFFF",
  ink2: "#F2F2F2",
  ink3: "#E0E0E0",

  accent: "#A9C4FF",
  accentText: "#A9C4FF",
  onAccent: "#000000",
  ring: "#000000",
  activeBg: "#000000",
  activeInk: "#A9C4FF",

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

type Scheme = "light" | "dark";

let scheme: Scheme = "light";
const listeners = new Set<() => void>();

export function setColorScheme(next: Scheme) {
  scheme = next;
  Appearance.setColorScheme?.(next);
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

export function useColors(): Palette {
  const oscuro = useColorScheme() === "dark";
  const { altoContraste } = useAjustes();
  if (altoContraste) return oscuro ? darkContrast : lightContrast;
  return oscuro ? dark : light;
}

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

export const ArchivosDeFuentes = {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  IBMPlexMono_500Medium,
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_500Medium,
  AtkinsonHyperlegibleNext_700Bold,
};

export const SombraDeMenu = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.28,
  shadowRadius: 24,
  elevation: 12,
} as const;

export const Weight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const Type = {
  pageTitle: { fontSize: 28, lineHeight: 34, fontWeight: Weight.bold, letterSpacing: -0.3 },
  lead: { fontSize: 17, lineHeight: 24, fontWeight: Weight.normal },
  cardTitle: { fontSize: 20, lineHeight: 25, fontWeight: Weight.bold },
  sheetTitle: { fontSize: 22, lineHeight: 28, fontWeight: Weight.bold },
  figure: { fontSize: 36, lineHeight: 40, fontWeight: Weight.bold, letterSpacing: -0.5 },
  rowTitle: { fontSize: 17, lineHeight: 22, fontWeight: Weight.semibold },
  body: { fontSize: 17, lineHeight: 24, fontWeight: Weight.normal },
  bodyStrong: { fontSize: 17, lineHeight: 24, fontWeight: Weight.semibold },
  label: { fontSize: 15, lineHeight: 20, fontWeight: Weight.medium },
  meta: { fontSize: 15, lineHeight: 21, fontWeight: Weight.normal },
  metaStrong: { fontSize: 15, lineHeight: 21, fontWeight: Weight.medium },
  mono: { fontSize: 14, lineHeight: 19, fontFamily: Fonts.mono },
  overline: { fontSize: 14, lineHeight: 18, fontWeight: Weight.semibold },
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
  sm: 8,
  lg: 12,
  xl: 16,
  button: 18,
  "2xl": 20,
  "3xl": 28,
  full: 999,
} as const;

export const Size = {
  header: 56,
  touch: 48,
  input: 56,
  button: 56,
  buttonCompact: 48,
  composer: 56,
  drawer: 320,
} as const;

export const Motion = {
  duration: 240,
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
  sheet: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 16,
  },
} as const;
