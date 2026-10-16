import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";

const DEPT_SHORT: Record<string, string> = {
  "Mesa de Entradas": "Mesa",
  "Recursos Humanos": "RR.HH.",
  Legajos: "Legajos",
  Liquidaciones: "Liquid.",
  Sistemas: "Sistemas",
};

/** Barras verticales por área. */
export function VBars({ data }: { data: { label: string; value: number }[] }) {
  const C = useColors();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <View style={styles.vbars}>
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        const pctTotal = total ? Math.round((d.value / total) * 100) : 0;
        const isActive = active === i;

        return (
          <Pressable
            key={d.label}
            onPress={() => setActive(isActive ? null : i)}
            accessibilityRole="button"
            accessibilityLabel={`${d.label}: ${d.value} expedientes, ${pctTotal} por ciento`}
            style={styles.vbarCol}
          >
            <Text
              style={[styles.vbarValue, { color: isActive ? C.accentText : C.ink }]}
            >
              {isActive ? `${pctTotal}%` : d.value}
            </Text>
            <View style={[styles.vbarTrack, { backgroundColor: C.surface }]}>
              <View
                style={{
                  width: "60%",
                  height: `${d.value > 0 ? Math.max(pct, 6) : 0}%`,
                  backgroundColor: isActive ? C.accentText : C.accent,
                  borderTopLeftRadius: Radius.sm,
                  borderTopRightRadius: Radius.sm,
                }}
              />
            </View>
            <Text style={[styles.vbarLabel, { color: C.ink2 }]} numberOfLines={1}>
              {DEPT_SHORT[d.label] ?? d.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  vbars: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: Spacing[2],
    height: 190,
  },
  vbarCol: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  vbarValue: {
    fontSize: 13,
    fontWeight: Weight.semibold,
    marginBottom: Spacing[1],
  },
  vbarTrack: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: Radius.sm,
    overflow: "hidden",
  },
  vbarLabel: {
    ...Type.meta,
    marginTop: 6,
    textAlign: "center",
  },
});
