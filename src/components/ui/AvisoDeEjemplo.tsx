import { StyleSheet, View } from "react-native";

import { Icon } from "./Icon";
import { Text } from "./Text";
import { Radius, Spacing, Weight, useColors } from "@/constants/theme";

/**
 * Cartel de rayas azul claro que avisa que lo de abajo es de ejemplo y todavía
 * no viene del servidor, para que un dato inventado no parezca real.
 */
export function AvisoDeEjemplo({
  texto = "Datos de ejemplo. Todavía no vienen del servidor.",
}: {
  texto?: string;
}) {
  const C = useColors();
  return (
    <View
      style={[styles.aviso, { backgroundColor: C.infoBg, borderColor: C.info }]}
      accessibilityRole="text"
    >
      <Icon name="info" size={18} color={C.info} />
      <Text style={[styles.texto, { color: C.info }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing[2],
    marginBottom: Spacing[4],
    paddingHorizontal: Spacing[3],
    paddingVertical: 10,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  texto: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: Weight.semibold,
  },
});
