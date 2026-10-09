import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";
import { Radius, Spacing, Type, useColors } from "@/constants/theme";

/**
 * Pantalla completa con un mensaje al centro y las acciones abajo. La usan el
 * acceso restringido y el 404.
 */
export function PantallaAviso({
  icono,
  titulo,
  texto,
  children,
}: {
  icono: IconName;
  titulo: string;
  texto: string;
  /** Botones de abajo. */
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
        <View style={[styles.icono, { backgroundColor: C.surface }]}>
          <Icon name={icono} size={22} color={C.ink2} />
        </View>
        <Text style={[Type.pageTitle, { color: C.ink, textAlign: "center" }]}>{titulo}</Text>
        <Text style={[Type.lead, { color: C.ink2, textAlign: "center" }]}>{texto}</Text>
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
    gap: Spacing[3],
  },
  icono: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing[2],
  },
  acciones: {
    gap: Spacing[3],
  },
});
