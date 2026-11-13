import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";
import { Spacing, Type, useColors } from "@/compartido/constantes/theme";

export function PantallaAviso({
  icono,
  titulo,
  texto,
  children,
}: {
  icono: IconName;
  titulo: string;
  texto: string;
  children: React.ReactNode;
}) {
  const C = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.pantalla,
        {
          backgroundColor: C.canvas,
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, Spacing[5]),
        },
      ]}
    >
      <View style={styles.mensaje}>
        <View style={[styles.icono, { backgroundColor: C.surface2, borderColor: C.borderStrong }]}>
          <Icon name={icono} size={38} color={C.ink} />
        </View>
        <Text style={[Type.pageTitle, { color: C.ink, textAlign: "center" }]}>{titulo}</Text>
        <Text style={[Type.lead, { color: C.ink2, textAlign: "center", maxWidth: 320 }]}>
          {texto}
        </Text>
      </View>
      <View style={styles.acciones}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    paddingHorizontal: Spacing[5],
  },
  mensaje: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  icono: {
    width: 80,
    height: 80,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  acciones: {
    gap: Spacing[2],
  },
});
