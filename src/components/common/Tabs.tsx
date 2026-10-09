import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "./Text";
import { Fonts, Spacing, useColors } from "../../constants/theme";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

/**
 * Pestañas v6: subrayado de 2 px en azul ChatAP, contador en Geist Mono, 44 de
 * alto. Corren de borde a borde (anulan los 20 de margen de la pantalla) y se
 * desplazan en horizontal; el margen final evita que la última quede cortada.
 */
export default function Tabs<T extends string>({
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
    <View style={[styles.wrap, { borderBottomColor: C.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {items.map((t) => {
          const on = t.id === value;
          return (
            <Pressable
              key={t.id}
              onPress={() => onChange(t.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={[styles.tab, { borderBottomColor: on ? C.accentBlue : "transparent" }]}
            >
              <Text style={[styles.label, { color: on ? C.accentText : C.ink2 }]}>
                {t.label}
              </Text>
              {t.count !== undefined && (
                <Text style={[styles.count, { color: on ? C.accentText : C.ink3 }]}>
                  {t.count}
                </Text>
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
    borderBottomWidth: 1,
  },
  scroll: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[6],
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 44,
    borderBottomWidth: 2,
    marginBottom: -1,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
  },
  count: {
    fontSize: 12,
    fontFamily: Fonts.mono,
  },
  endPad: {
    width: 4,
  },
});
