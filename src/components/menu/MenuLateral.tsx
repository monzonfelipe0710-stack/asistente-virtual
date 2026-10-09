import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { DrawerActions } from "@react-navigation/native";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBotAvatar } from "@/components/avatar/ChatBotAvatar";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { Toggle } from "@/components/ui/Toggle";
import {
  Radius,
  Spacing,
  Type,
  Weight,
  setColorScheme,
  useColors,
  useColorScheme,
} from "@/constants/theme";

export interface ItemDeMenu {
  /** Nombre de la pantalla del Drawer a la que lleva (el nombre del archivo). */
  pantalla: string;
  titulo: string;
  icono: IconName;
}

export interface SeccionDeMenu {
  /** Rótulo del grupo. Sin rótulo, los ítems van sueltos. */
  titulo?: string;
  items: ItemDeMenu[];
}

/**
 * Contenido del Drawer, el mismo para la app y para el panel: marca arriba,
 * ítems por sección en el medio y, abajo, lo que cada layout ponga como pie.
 * Cada ítem lleva a una pantalla del Drawer; la activa se marca con el tinte azul.
 */
export function MenuLateral({
  drawer,
  nombre,
  descripcion,
  secciones,
  lineaSobrePie = false,
  children,
}: {
  drawer: DrawerContentComponentProps;
  nombre: string;
  descripcion: string;
  secciones: SeccionDeMenu[];
  /** Dibuja una línea fina entre los ítems y el pie. */
  lineaSobrePie?: boolean;
  /** Pie del menú: preferencias y cuenta. */
  children?: React.ReactNode;
}) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const pantallaActiva = drawer.state.routes[drawer.state.index].name;

  return (
    <View
      style={[
        styles.menu,
        { paddingTop: insets.top + Spacing[2], paddingBottom: Math.max(insets.bottom, Spacing[3]) },
      ]}
    >
      <View style={styles.marca}>
        <ChatBotAvatar size={40} tight static />
        <View style={styles.marcaTexto}>
          <Text style={[Type.cardTitle, { color: C.ink }]}>{nombre}</Text>
          <Text style={[Type.meta, { color: C.ink2 }]}>{descripcion}</Text>
        </View>
      </View>

      <ScrollView style={styles.secciones} showsVerticalScrollIndicator={false}>
        {secciones.map((seccion, indice) => (
          <View key={seccion.titulo ?? indice}>
            {!!seccion.titulo && (
              <Text style={[Type.overline, styles.rotulo, { color: C.ink3 }]}>
                {seccion.titulo}
              </Text>
            )}

            <View style={styles.items}>
              {seccion.items.map((item) => {
                const activo = item.pantalla === pantallaActiva;
                return (
                  <Pressable
                    key={item.pantalla}
                    onPress={() => drawer.navigation.navigate(item.pantalla)}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: activo }}
                    style={({ pressed }) => [
                      styles.fila,
                      activo
                        ? { backgroundColor: C.activeBg }
                        : pressed && { backgroundColor: C.surface },
                    ]}
                  >
                    <Icon name={item.icono} size={20} color={activo ? C.activeInk : C.ink2} />
                    <Text
                      style={[
                        styles.filaTexto,
                        { color: activo ? C.activeInk : C.ink },
                        activo && { fontWeight: Weight.semibold },
                      ]}
                      numberOfLines={1}
                    >
                      {item.titulo}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.pie, lineaSobrePie && { borderTopWidth: 1, borderTopColor: C.border }]}>
        {children}
      </View>
    </View>
  );
}

/** Cierra el menú y ejecuta `despues`. */
export function cerrarMenu(drawer: DrawerContentComponentProps, despues?: () => void) {
  drawer.navigation.dispatch(DrawerActions.closeDrawer());
  despues?.();
}

/** Fila del pie: ícono, texto y algo a la derecha. Es un botón si recibe `onPress`. */
export function FilaDelMenu({
  icono,
  texto,
  derecha,
  onPress,
  accesibilidad,
}: {
  icono: IconName;
  texto: string;
  derecha?: React.ReactNode;
  onPress: () => void;
  accesibilidad?: "switch" | "link" | "button";
}) {
  const C = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={accesibilidad ?? "button"}
      accessibilityLabel={texto}
      style={({ pressed }) => [styles.fila, pressed && { backgroundColor: C.surface }]}
    >
      <Icon name={icono} size={20} color={C.ink2} />
      <Text style={[styles.filaTexto, { color: C.ink }]}>{texto}</Text>
      {derecha}
    </Pressable>
  );
}

/** Interruptor del modo oscuro: la fila entera es el área táctil. */
export function FilaModoOscuro() {
  const oscuro = useColorScheme() === "dark";
  return (
    <FilaDelMenu
      icono="moon"
      texto="Modo oscuro"
      accesibilidad="switch"
      onPress={() => setColorScheme(oscuro ? "light" : "dark")}
      derecha={<Toggle value={oscuro} />}
    />
  );
}

/** Iniciales de dos letras para el círculo de la cuenta. */
export function iniciales(nombre: string) {
  return nombre
    .trim()
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
}

const styles = StyleSheet.create({
  menu: {
    flex: 1,
    paddingHorizontal: Spacing[3],
  },
  marca: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    paddingHorizontal: Spacing[3],
  },
  marcaTexto: {
    flex: 1,
    minWidth: 0,
  },
  secciones: {
    flex: 1,
    marginTop: Spacing[3],
  },
  rotulo: {
    marginTop: Spacing[5],
    marginBottom: Spacing[2],
    marginHorizontal: Spacing[3],
  },
  items: {
    gap: 2,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    paddingHorizontal: Spacing[3],
    height: 48,
    borderRadius: Radius.lg,
  },
  filaTexto: {
    flex: 1,
    fontSize: 16,
    fontWeight: Weight.medium,
  },
  pie: {
    gap: 2,
    marginTop: Spacing[2],
    paddingTop: Spacing[2],
  },
});
