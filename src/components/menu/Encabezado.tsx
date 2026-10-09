import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { Radius, Size, Type, useColors } from "@/constants/theme";

/**
 * Barra superior de 56: botón del menú a la izquierda, título al centro y, si
 * hace falta, una acción a la derecha. Los botones van a 9 px del borde para
 * que el trazo del ícono caiga sobre la línea de 20 del contenido.
 */
export function Encabezado({
  titulo,
  derecha,
}: {
  titulo?: string;
  /** Botón de la derecha. Sin él queda un hueco del mismo ancho, para centrar el título. */
  derecha?: React.ReactNode;
}) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.barra, { paddingTop: insets.top, height: insets.top + Size.header }]}>
      <Pressable
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        accessibilityRole="button"
        accessibilityLabel="Abrir menú"
        style={({ pressed }) => [styles.boton, pressed && { backgroundColor: C.surface }]}
      >
        <Icon name="menu" size={22} color={C.ink} />
      </Pressable>

      {!!titulo && <Text style={[Type.cardTitle, { color: C.ink }]}>{titulo}</Text>}

      {derecha ?? <View style={styles.boton} />}
    </View>
  );
}

/** Botón de ícono de 44 para la derecha del encabezado. */
export function BotonDeEncabezado({
  icono,
  etiqueta,
  onPress,
}: {
  icono: "newChat";
  etiqueta: string;
  onPress: () => void;
}) {
  const C = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={({ pressed }) => [styles.boton, pressed && { backgroundColor: C.surface }]}
    >
      <Icon name={icono} size={21} color={C.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 9,
  },
  boton: {
    width: Size.touch,
    height: Size.touch,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
