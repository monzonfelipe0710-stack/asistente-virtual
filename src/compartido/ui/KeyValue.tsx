import { Children, isValidElement, cloneElement, type ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { Radius, Spacing, Weight, useColors } from "@/compartido/constantes/theme";

export function KeyValue({
  label,
  value,
  last = false,
  children,
}: {
  label: string;
  value?: string;
  last?: boolean;
  children?: React.ReactNode;
}) {
  const C = useColors();
  return (
    <View style={[styles.keyValue, { borderBottomColor: last ? "transparent" : C.border }]}>
      <Text style={[styles.key, { color: C.ink2 }]}>{label}</Text>
      {children ? (
        <View style={styles.derecha}>{children}</View>
      ) : (
        <Text style={[styles.key, styles.valor, { color: C.ink }]}>{value}</Text>
      )}
    </View>
  );
}

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
