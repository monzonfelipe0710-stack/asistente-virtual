import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "./Text";
import { Size, Spacing, Weight, useColors } from "@/constants/theme";
import { vibrarAlElegir } from "@/lib/haptica";

interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

/**
 * Filtros en píldoras de 44: la activa lleva el tinte azul, el borde azul y el
 * texto azul; las demás, borde fuerte. El contador va en negrita. Corren de
 * borde a borde (anulan los 20 de margen de la pantalla) y se desplazan.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  const C = useColors();

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        accessibilityRole="tablist"
      >
        {items.map((t) => {
          const on = t.id === value;
          const color = on ? C.accentText : C.ink;
          return (
            <Pressable
              key={t.id}
              onPress={() => {
                onChange(t.id);
                vibrarAlElegir();
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={[
                styles.tab,
                {
                  backgroundColor: on ? C.activeBg : "transparent",
                  borderColor: on ? C.accent : C.borderStrong,
                },
              ]}
            >
              <Text style={[styles.label, { color }]}>{t.label}</Text>
              {t.count !== undefined && (
                <Text style={[styles.label, { color, fontWeight: Weight.bold }]}>{t.count}</Text>
              )}
            </Pressable>
          );
        })}
        <View style={styles.endPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: -Spacing[5],
    marginVertical: Spacing[2],
  },
  scroll: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[2],
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: Size.chip,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: Weight.semibold,
  },
  endPad: {
    width: 4,
  },
});
