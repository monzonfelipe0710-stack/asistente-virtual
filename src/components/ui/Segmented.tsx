import { Platform, Pressable, StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { Radius, Spacing, Weight, useColors } from "@/constants/theme";
import { vibrarAlElegir } from "@/lib/haptica";

const RADIO = Platform.OS === "ios" ? Radius.lg : Radius.full;

/**
 * Control segmentado: pista de superficie con borde, relleno 4 y segmentos de
 * 48. El elegido va en azul con `onAccent`. Radio 12 en iOS y píldora en Android.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  const C = useColors();
  return (
    <View style={[styles.track, { backgroundColor: C.surface2, borderColor: C.border }]}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => {
              onChange(option);
              vibrarAlElegir();
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && { backgroundColor: C.accent }]}
          >
            <Text
              style={[styles.segmentText, { color: active ? C.onAccent : C.ink }]}
              numberOfLines={1}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: RADIO + 4,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIO,
    paddingHorizontal: Spacing[2],
  },
  segmentText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: Weight.semibold,
  },
});
