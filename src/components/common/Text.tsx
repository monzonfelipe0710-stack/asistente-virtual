import { forwardRef } from "react";
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from "react-native";

import { Fonts } from "../../constants/theme";

/**
 * Text y TextInput con Geist.
 *
 * En nativo, una familia cargada con `useFonts` es UN archivo: `fontWeight` no
 * elige otro corte, y en Android además fuerza una negrita sintética. Por eso
 * el peso se traduce acá a la familia del corte correcto y se anula el
 * `fontWeight`. Si el estilo ya trae `fontFamily` (Geist Mono), se respeta.
 */
function familyFor(weight: TextStyle["fontWeight"]): string {
  switch (String(weight ?? "400")) {
    case "500":
      return Fonts.medium;
    case "600":
    case "700":
    case "800":
    case "900":
    case "bold":
      return Fonts.semibold;
    default:
      return Fonts.regular;
  }
}

function withFont(style: TextProps["style"]) {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const fontFamily = flat.fontFamily ?? familyFor(flat.fontWeight);
  return [style, { fontFamily, fontWeight: "normal" as const }];
}

export function Text({ style, ...rest }: TextProps) {
  return <RNText {...rest} style={withFont(style)} />;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { style, ...rest },
  ref
) {
  return <RNTextInput ref={ref} {...rest} style={withFont(style)} />;
});
