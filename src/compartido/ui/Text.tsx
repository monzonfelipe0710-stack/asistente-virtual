import { StyleSheet, Text as RNText, type TextProps, type TextStyle } from "react-native";

import { Fonts } from "@/compartido/constantes/theme";
import { ESCALAS, useAjustes } from "@/compartido/lib/accesibilidad";

function familyFor(weight: TextStyle["fontWeight"], legible: boolean): string {
  switch (String(weight ?? "400")) {
    case "500":
      return legible ? Fonts.legibleMedium : Fonts.medium;
    case "600":
      return legible ? Fonts.legibleNegrita : Fonts.semibold;
    case "700":
    case "800":
    case "900":
    case "bold":
      return legible ? Fonts.legibleNegrita : Fonts.bold;
    default:
      return legible ? Fonts.legible : Fonts.regular;
  }
}

export function useEscalaDeTexto(): number {
  return ESCALAS[useAjustes().tamanoDeTexto];
}

const TOPE_DE_TITULO = 1.3;

export function withFont(style: TextProps["style"], escala = 1, legible = false) {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const fontFamily = (legible ? undefined : flat.fontFamily) ?? familyFor(flat.fontWeight, legible);
  const factor = flat.fontSize && flat.fontSize >= 20 ? Math.min(escala, TOPE_DE_TITULO) : escala;
  const tamano: { fontSize?: number; lineHeight?: number; letterSpacing?: number } = {};
  if (flat.fontSize) tamano.fontSize = flat.fontSize * factor;
  if (flat.lineHeight) tamano.lineHeight = flat.lineHeight * factor;
  if (legible) {
    tamano.letterSpacing = 0.3;
    if (flat.lineHeight) tamano.lineHeight = flat.lineHeight * factor * 1.15;
  }
  return [style, { fontFamily, fontWeight: "normal" as const }, tamano];
}

export function Text({ style, ...rest }: TextProps) {
  const { tamanoDeTexto, letraLegible } = useAjustes();
  return <RNText {...rest} style={withFont(style, ESCALAS[tamanoDeTexto], letraLegible)} />;
}
