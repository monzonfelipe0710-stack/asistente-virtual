import { StyleSheet, Text as RNText, type TextProps, type TextStyle } from "react-native";

import { Fonts } from "@/constants/theme";
import { ESCALAS, useAjustes } from "@/lib/accesibilidad";

/**
 * Text con Figtree. TextInput.tsx reutiliza `withFont`.
 *
 * En nativo, una familia cargada con `useFonts` es UN archivo: `fontWeight` no
 * elige otro corte, y en Android además fuerza una negrita sintética. Por eso
 * el peso se traduce acá a la familia del corte correcto y se anula el
 * `fontWeight`. Si el estilo ya trae `fontFamily` (IBM Plex Mono), se respeta,
 * salvo con "Letra más legible", que usa Atkinson Hyperlegible Next en todo.
 */
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

/** Los títulos de 20 o más crecen como máximo 1,3 veces; si no, no caben en una pantalla chica. */
const TOPE_DE_TITULO = 1.3;

export function withFont(style: TextProps["style"], escala = 1, legible = false) {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const fontFamily = (legible ? undefined : flat.fontFamily) ?? familyFor(flat.fontWeight, legible);
  const factor = flat.fontSize && flat.fontSize >= 20 ? Math.min(escala, TOPE_DE_TITULO) : escala;
  const tamano: TextStyle = {};
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
