import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Spacing, useColors } from "@/constants/theme";

/**
 * Fila de lista: mínimo 64, línea de 1 px abajo y 14 de aire arriba y abajo.
 * Si recibe `onPress`, se puede tocar.
 */
export function Row({
  children,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const C = useColors();
  const base = [styles.row, { borderBottomColor: C.border }, style];

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && { backgroundColor: C.surface }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    paddingVertical: Spacing[3] + 2,
    borderBottomWidth: 1,
  },
});
