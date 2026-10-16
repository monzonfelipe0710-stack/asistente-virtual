import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Weight, useColors } from "@/constants/theme";

/** Barra horizontal con etiqueta y valor. */
export function HBarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const C = useColors();
  const pct = max ? Math.round((value / max) * 100) : 0;

  return (
    <View style={styles.hbarRow}>
      <Text style={[styles.hbarLabel, { color: C.ink2 }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.hbarTrack, { backgroundColor: C.surface }]}>
        <View
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: Radius.full,
          }}
        />
      </View>
      <Text style={[styles.hbarValue, { color: C.ink }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  hbarLabel: {
    width: 92,
    fontSize: 13,
    fontWeight: Weight.medium,
  },
  hbarTrack: {
    flex: 1,
    height: 16,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  hbarValue: {
    width: 26,
    textAlign: "right",
    fontSize: 13,
    fontWeight: Weight.semibold,
  },
});
