import { StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { Radius, Weight, useColors } from "@/constants/theme";
import { iniciales } from "@/utils/text";

/** Iniciales en un círculo, sobre el gris de superficie. Por defecto de 44. */
export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const C = useColors();
  const initials = iniciales(name);

  return (
    <View
      style={[styles.avatar, { width: size, height: size, backgroundColor: C.surface2 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[styles.avatarText, { color: C.ink, fontSize: Math.round(size * 0.36) }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: Weight.bold,
  },
});
