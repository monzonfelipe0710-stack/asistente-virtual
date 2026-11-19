import { StyleSheet, View } from "react-native";

import { Icon } from "./Icon";
import { Text } from "./Text";
import { Spacing, Type, useColors } from "@/compartido/constantes/theme";

export function EmptyState({
  title,
  detalle,
}: {
  title: string;
  detalle?: string;
}) {
  const C = useColors();
  return (
    <View style={styles.empty}>
      <View style={[styles.icono, { backgroundColor: C.surface2, borderColor: C.borderStrong }]}>
        <Icon name="inbox" size={30} color={C.ink} />
      </View>
      <Text style={[Type.cardTitle, { color: C.ink, textAlign: "center" }]}>{title}</Text>
      {!!detalle && <Text style={[Type.lead, { color: C.ink2, textAlign: "center" }]}>{detalle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[3],
    paddingVertical: Spacing[10],
    paddingHorizontal: Spacing[4],
  },
  icono: {
    width: 72,
    height: 72,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
