import { StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { Type, useColors, type Palette } from "@/constants/theme";

/** El color marca un estado, no decora. */
export type Tone = "brand" | "ok" | "warn" | "bad" | "info" | "muted";

export function toneColor(C: Palette, tone: Tone): string {
  switch (tone) {
    case "ok":
      return C.ok;
    case "warn":
      return C.warn;
    case "bad":
      return C.bad;
    case "info":
      return C.info;
    case "muted":
      return C.ink3;
    case "brand":
      return C.accent;
  }
}

/** Estado: punto de 6 y texto 13/500 del mismo color, sin fondo. */
export function Badge({ label, tone = "brand" }: { label: string; tone?: Tone }) {
  const C = useColors();
  const color = toneColor(C, tone);

  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[Type.metaStrong, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
});
