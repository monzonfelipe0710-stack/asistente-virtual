import { DrawerActions } from "expo-router/react-navigation";
import { useNavigation } from "expo-router";
import { Keyboard, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { Shadows, Size, Spacing, Weight, useColors } from "@/constants/theme";

const ES_IOS = Platform.OS === "ios";

/**
 * Barra superior de 56: botón del menú a la izquierda, título (centrado en iOS,
 * a la izquierda en Android) y, si hace falta, una acción a la derecha. En iOS
 * queda un hueco del mismo ancho a la derecha para centrar el título.
 */
export function Encabezado({
  titulo,
  derecha,
}: {
  titulo?: string;
  derecha?: React.ReactNode;
}) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.barra, { paddingTop: insets.top, minHeight: insets.top + Size.header }]}>
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          navigation.dispatch(DrawerActions.openDrawer());
        }}
        accessibilityRole="button"
        accessibilityLabel="Abrir menú"
        // Círculo con borde y sombra: sobre los mensajes no se confunde con texto.
        style={({ pressed }) => [
          styles.boton,
          styles.circulo,
          { backgroundColor: pressed ? C.surface2 : C.surface, borderColor: C.border },
        ]}
      >
        <Icon name="menu" size={24} color={C.ink} />
      </Pressable>

      <Text
        style={[styles.titulo, { color: C.ink, textAlign: ES_IOS ? "center" : "left" }]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {titulo}
      </Text>

      {derecha ?? (ES_IOS ? <View style={styles.boton} /> : null)}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    // En el chat flota sobre la lista: los toques fuera de los botones llegan a la lista.
    pointerEvents: "box-none",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  boton: {
    width: Size.touch,
    height: Size.touch,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  circulo: {
    marginLeft: Spacing[3] - 4,
    borderWidth: 1,
    ...Shadows.sm,
  },
  titulo: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: Weight.semibold,
  },
});
