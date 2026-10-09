import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "./Text";
import { Radius, Size, Spacing, Weight, useColors } from "@/constants/theme";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dangerFill";

/**
 * Botón.
 * - primary:    azul profundo con texto blanco. Uno por pantalla.
 * - secondary:  contorno neutro.
 * - ghost:      texto azul, sin superficie (un enlace).
 * - danger:     texto rojo, sin superficie.
 * - dangerFill: relleno rojo, para confirmar un borrado.
 * `size="md"` es la variante de 44 con radio 12, para pares de botones.
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
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const C = useColors();
  const compact = size === "md";
  const filled = variant === "primary" || variant === "dangerFill";

  function textColor() {
    if (filled) return "#FFFFFF";
    if (variant === "ghost") return C.accentText;
    if (variant === "danger") return C.danger;
    return C.ink;
  }

  function background(pressed: boolean) {
    if (variant === "dangerFill") return C.danger;
    if (variant === "primary") return pressed ? C.primaryHover : C.primary;
    if (variant === "ghost") return "transparent";
    return pressed ? C.surface : "transparent";
  }

  function opacity(pressed: boolean) {
    if (disabled) return 0.45;
    if (variant === "ghost" && pressed) return 0.6;
    return 1;
  }

  const color = textColor();

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
          height: compact || variant === "ghost" ? Size.touch : Size.button,
          borderRadius: compact ? Radius.lg : Radius.xl,
          backgroundColor: background(pressed),
          opacity: opacity(pressed),
        },
        variant === "ghost" && styles.ghost,
        variant === "secondary" && { borderWidth: 1, borderColor: C.border },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          {!!icon && <Ionicons name={icon} size={20} color={color} />}
          <Text
            style={{
              fontSize: compact ? 15 : 16,
              fontWeight: filled ? Weight.semibold : Weight.medium,
              color,
            }}
          >
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
  },
  ghost: {
    paddingHorizontal: 0,
  },
});
