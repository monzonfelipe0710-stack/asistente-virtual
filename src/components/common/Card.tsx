import type { ReactNode } from "react";
import { View, StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import { Colors, Radius, Spacing, Shadows } from "../../constants/theme";

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export default function Card({ children, style, padded = true }: Props) {
  return <View style={[styles.base, padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.slate200,
    overflow: "hidden",
    ...Shadows.sm,
  },
  padded: {
    padding: Spacing[4],
  },
});
