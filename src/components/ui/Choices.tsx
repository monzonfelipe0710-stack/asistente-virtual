import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { Radius, Shadows, Size, Spacing, useColors } from "@/constants/theme";

type ChoiceProps<T extends string> = {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
};

/**
 * Control segmentado: pista gris de 44 con radio 12 y 4 de relleno; la opción
 * elegida es una pastilla blanca de radio 8 (regla concéntrica: 12 − 4).
 */
export function Segmented<T extends string>({ value, options, onChange }: ChoiceProps<T>) {
  const C = useColors();
  return (
    <View style={[styles.track, { backgroundColor: C.surface }]}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && [{ backgroundColor: C.thumb }, Shadows.sm]]}
          >
            <Text
              style={[styles.segmentText, { color: active ? C.ink : C.ink2 }]}
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

/**
 * Opciones con radio en grilla de 2 columnas (separación 12): cada una es un
 * botón de 48 con radio 12, borde de 1.5 y el círculo de 16 a la izquierda.
 */
export function OptionGrid<T extends string>({ value, options, onChange }: ChoiceProps<T>) {
  const C = useColors();
  return (
    <View style={styles.grid}>
      {options.map((option) => {
        const checked = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="radio"
            accessibilityState={{ checked }}
            style={[
              styles.option,
              { borderColor: checked ? C.accent : C.border, backgroundColor: C.canvas },
            ]}
          >
            <View style={[styles.radio, { borderColor: checked ? C.accent : C.ink3 }]}>
              {checked && <View style={[styles.radioDot, { backgroundColor: C.accent }]} />}
            </View>
            <Text style={[styles.optionText, { color: C.ink }]} numberOfLines={1}>
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
    height: Size.touch,
    borderRadius: Radius.lg,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[2],
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing[3],
  },
  option: {
    flexGrow: 1,
    flexBasis: "45%",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Spacing[4],
  },
  optionText: {
    fontSize: 15,
    fontWeight: "500",
    flexShrink: 1,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
});
