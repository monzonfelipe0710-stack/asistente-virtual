import { StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { Spacing, Type, useColors } from "@/constants/theme";

/** Título de un bloque (17/600) con su bajada; la acción va a la derecha. */
export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const C = useColors();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionText}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>{title}</Text>
        {!!subtitle && <Text style={[Type.meta, { color: C.ink2 }]}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: Spacing[3],
    paddingBottom: Spacing[1],
  },
  sectionText: {
    flexShrink: 1,
    gap: 2,
  },
});
