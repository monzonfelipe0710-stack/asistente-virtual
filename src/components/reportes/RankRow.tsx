import { StyleSheet, View } from "react-native";

import { CountUp } from "@/components/ui/CountUp";
import { Text } from "@/components/ui/Text";
import { Spacing, Type, useColors } from "@/constants/theme";

export function RankRow({
  index,
  title,
  subtitle,
  value,
}: {
  index: number;
  title: string;
  subtitle: string;
  value: number;
}) {
  const C = useColors();
  // El puesto es solo el número: los tres primeros en el color de destaque.
  const badgeFg = index < 3 ? C.warn : C.ink3;

  return (
    <View style={styles.rankRow}>
      <Text style={[styles.rankBadgeText, { color: badgeFg }]}>{index + 1}</Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.rankTitle, { color: C.ink }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.rankSub, { color: C.ink2 }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <CountUp value={value} style={[styles.rankValue, { color: C.ink2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    paddingVertical: 6,
  },
  rankBadgeText: {
    ...Type.metaStrong,
    width: 18,
  },
  rankTitle: {
    ...Type.bodyStrong,
  },
  rankSub: {
    ...Type.meta,
    marginTop: 1,
  },
  rankValue: {
    ...Type.metaStrong,
  },
});
