import { Children, isValidElement, cloneElement, type ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { Radius, Spacing, Weight, useColors } from "@/constants/theme";

/** Par etiqueta / valor: la etiqueta a la izquierda, el valor en negrita a la derecha. */
export function KeyValue({
  label,
  value,
  last = false,
  children,
}: {
  label: string;
  value?: string;
  /** La última fila de una tarjeta no lleva línea. */
  last?: boolean;
  /** En lugar de `value`, un elemento a la derecha, como una etiqueta de estado. */
  children?: React.ReactNode;
}) {
  const C = useColors();
  return (
    <View style={[styles.keyValue, { borderBottomColor: last ? "transparent" : C.border }]}>
      <Text style={[styles.key, { color: C.ink2 }]}>{label}</Text>
      {children ? (
        // El contenedor centra la etiqueta en vertical; la etiqueta sola se alinea al borde.
        <View style={styles.derecha}>{children}</View>
      ) : (
        <Text style={[styles.key, styles.valor, { color: C.ink }]}>{value}</Text>
      )}
    </View>
  );
}

/** Tarjeta de superficie con filas de clave y valor; marca la última sin línea. */
export function KeyValueCard({ children }: { children: React.ReactNode }) {
  const C = useColors();
  const filas = Children.toArray(children);
  return (
    <View style={[styles.tarjeta, { backgroundColor: C.surface, borderColor: C.border }]}>
      {filas.map((fila, indice) =>
        isValidElement(fila)
          ? cloneElement(fila as ReactElement<{ last?: boolean }>, {
              last: indice === filas.length - 1,
            })
          : fila,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    paddingHorizontal: Spacing[4],
    borderRadius: Radius["2xl"],
    borderWidth: 1,
  },
  keyValue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing[3],
    minHeight: 56,
    borderBottomWidth: 1,
  },
  key: {
    flexShrink: 1,
    fontSize: 17,
    lineHeight: 22,
  },
  derecha: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  valor: {
    fontWeight: Weight.semibold,
    textAlign: "right",
  },
});
