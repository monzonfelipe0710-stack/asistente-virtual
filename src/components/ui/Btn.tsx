import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";
import { Radius, Size, Spacing, Weight, useColors } from "@/constants/theme";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dangerFill";

/**
 * Botón de 56 con radio 18; `size="md"` es el compacto de 48.
 * - primary:    azul con texto `onAccent`. Uno por pantalla.
 * - secondary:  contorno fuerte.
 * - ghost:      texto azul, sin superficie (un enlace).
 * - danger:     contorno y texto rojos.
 * - dangerFill: relleno rojo, para confirmar un borrado.
 * Deshabilitado se ve como una pastilla gris plana.
 */
export function Btn({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  icon,
  disabled = false,
  loading = false,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: "lg" | "md";
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const C = useColors();

  function colors(): { fg: string; bg: string; border: string } {
    if (disabled) return { fg: C.ink3, bg: C.surface2, border: C.surface2 };
    switch (variant) {
      case "primary":
        return { fg: C.onAccent, bg: C.accent, border: C.accent };
      case "secondary":
        return { fg: C.ink, bg: "transparent", border: C.borderStrong };
      case "ghost":
        return { fg: C.accentText, bg: "transparent", border: "transparent" };
      case "danger":
        return { fg: C.danger, bg: "transparent", border: C.danger };
      case "dangerFill":
        return { fg: C.onDangerFill, bg: C.dangerFill, border: C.dangerFill };
    }
  }

  const { fg, bg, border } = colors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.btn,
        {
          minHeight: size === "md" ? Size.buttonCompact : Size.button,
          backgroundColor: bg,
          borderColor: border,
          opacity: pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {!!icon && <Icon name={icon} size={20} color={fg} />}
          <Text style={{ fontSize: 17, lineHeight: 21, fontWeight: Weight.semibold, color: fg }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: Radius.button,
    borderWidth: 1,
  },
});
