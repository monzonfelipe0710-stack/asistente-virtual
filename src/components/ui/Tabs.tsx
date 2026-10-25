import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { BottomSheet } from "./BottomSheet";
import { Icon } from "./Icon";
import { Text } from "./Text";
import { Radius, Size, Spacing, Type, Weight, useColors } from "@/constants/theme";
import { vibrarAlElegir } from "@/lib/haptica";

interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

/**
 * Filtro en un solo campo: muestra la opción elegida con su contador y, al
 * tocarlo, abre una hoja inferior con todas las opciones a la vista, sin
 * desplazar hacia los costados.
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
  const [open, setOpen] = useState(false);
  const actual = items.find((t) => t.id === value) ?? items[0];

  function elegir(id: T) {
    onChange(id);
    vibrarAlElegir();
    setOpen(false);
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Filtro: ${actual?.label}${actual?.count !== undefined ? `, ${actual.count}` : ""}`}
        accessibilityHint="Abre la lista de filtros"
        style={({ pressed }) => [
          styles.campo,
          { backgroundColor: pressed ? C.surface : C.canvas, borderColor: C.borderStrong },
        ]}
      >
        <Icon name="sliders" size={20} color={C.ink} />
        <Text style={[styles.valor, { color: C.ink }]} numberOfLines={1}>
          {actual?.label}
        </Text>
        {actual?.count !== undefined && (
          <View style={[styles.contador, { backgroundColor: C.activeBg }]}>
            <Text style={[styles.contadorTexto, { color: C.accentText }]}>{actual.count}</Text>
          </View>
        )}
        <Icon name="chevronDown" size={22} color={C.ink} />
      </Pressable>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <Text style={[Type.overline, styles.titulo, { color: C.ink2 }]}>Filtrar por</Text>
        <ScrollView style={styles.lista} showsVerticalScrollIndicator={false}>
          {items.map((t) => {
            const elegida = t.id === value;
            return (
              <Pressable
                key={t.id}
                onPress={() => elegir(t.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: elegida }}
                style={({ pressed }) => [
                  styles.opcion,
                  { borderBottomColor: C.border, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text
                  style={[
                    styles.opcionTexto,
                    { color: elegida ? C.accentText : C.ink, fontWeight: elegida ? Weight.bold : Weight.normal },
                  ]}
                  numberOfLines={1}
                >
                  {t.label}
                </Text>
                {t.count !== undefined && (
                  <Text style={[styles.opcionCuenta, { color: C.ink2 }]}>{t.count}</Text>
                )}
                {elegida && <Icon name="check" size={22} color={C.accent} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginVertical: Spacing[2],
  },
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    minHeight: Size.input,
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.xl,
    borderWidth: 1.5,
  },
  valor: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    fontWeight: Weight.semibold,
  },
  contador: {
    minWidth: 28,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignItems: "center",
  },
  contadorTexto: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: Weight.bold,
  },
  titulo: {
    marginBottom: Spacing[1],
  },
  lista: {
    maxHeight: 420,
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    minHeight: Size.input,
    borderBottomWidth: 1,
  },
  opcionTexto: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
  },
  opcionCuenta: {
    fontSize: 15,
    fontWeight: Weight.semibold,
  },
});
