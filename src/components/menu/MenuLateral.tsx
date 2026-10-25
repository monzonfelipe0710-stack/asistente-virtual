import type { DrawerContentComponentProps } from "expo-router/drawer";
import { DrawerActions } from "expo-router/react-navigation";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBotAvatar } from "@/components/avatar/ChatBotAvatar";
import { Btn } from "@/components/ui/Btn";
import { Desvanecido } from "@/components/ui/Desvanecido";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";

export interface ItemDeMenu {
  /** Nombre de la pantalla del Drawer a la que lleva (el nombre del archivo). */
  pantalla?: string;
  /** Si lo trae, el ítem ejecuta esto en vez de ir a una pantalla. */
  onPress?: () => void;
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
 * El ítem activo lleva el tinte azul, el borde azul y el texto en negrita.
 */
export function MenuLateral({
  drawer,
  nombre,
  descripcion,
  secciones,
  acciones = [],
  lineaSobrePie = false,
  contenidoDesplazable,
  children,
}: {
  drawer: DrawerContentComponentProps;
  nombre: string;
  descripcion: string;
  secciones: SeccionDeMenu[];
  /** Acciones sueltas bajo la marca: no llevan a una pantalla, ejecutan algo. */
  acciones?: { titulo: string; icono: IconName; onPress: () => void }[];
  /** Dibuja una línea fina entre los ítems y el pie. */
  lineaSobrePie?: boolean;
  /** Si viene, es lo único que se desplaza: las acciones y las secciones quedan fijas arriba, y una línea lo separa. */
  contenidoDesplazable?: React.ReactNode;
  /** Pie del menú: preferencias y cuenta. */
  children?: React.ReactNode;
}) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const pantallaActiva = drawer.state.routes[drawer.state.index].name;

  const listaDeAcciones = acciones.map((accion) => (
    <View key={accion.titulo} style={styles.accion}>
      <Btn
        label={accion.titulo}
        icon={accion.icono}
        variant="secondary"
        size="md"
        onPress={accion.onPress}
      />
    </View>
  ));

  const listaDeSecciones = secciones.map((seccion, indice) => (
    <View key={seccion.titulo ?? indice}>
      {!!seccion.titulo && (
        <Text style={[Type.overline, styles.rotulo, { color: C.ink2 }]}>{seccion.titulo}</Text>
      )}

      <View style={styles.items}>
        {seccion.items.map((item) => {
          const activo = !!item.pantalla && item.pantalla === pantallaActiva;
          return (
            <Pressable
              key={item.titulo}
              onPress={() =>
                item.onPress ? item.onPress() : drawer.navigation.navigate(item.pantalla!)
              }
              accessibilityRole="menuitem"
              accessibilityState={{ selected: activo }}
              style={({ pressed }) => [
                styles.fila,
                {
                  backgroundColor: activo ? C.activeBg : pressed ? C.surface2 : "transparent",
                  borderColor: activo ? C.accent : "transparent",
                },
              ]}
            >
              <Icon name={item.icono} size={22} color={activo ? C.activeInk : C.ink} />
              <Text
                style={[
                  styles.filaTexto,
                  {
                    color: activo ? C.activeInk : C.ink,
                    fontWeight: activo ? Weight.bold : Weight.medium,
                  },
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
  ));

  return (
    <View
      style={[
        styles.menu,
        { paddingTop: insets.top + Spacing[2], paddingBottom: Math.max(insets.bottom - Spacing[2], Spacing[1]) },
      ]}
    >
      <View style={styles.marca}>
        <ChatBotAvatar size={44} static />
        <View style={styles.marcaTexto}>
          <Text style={[Type.cardTitle, { color: C.ink }]}>{nombre}</Text>
          <Text style={[Type.meta, { color: C.ink2 }]}>{descripcion}</Text>
        </View>
      </View>

      {contenidoDesplazable ? (
        <>
          <View style={styles.fijas}>
            {listaDeAcciones}
            {listaDeSecciones}
          </View>
          <View style={styles.secciones}>
            <ScrollView
              contentContainerStyle={styles.desplazable}
              showsVerticalScrollIndicator={false}
            >
              {contenidoDesplazable}
            </ScrollView>
            <Desvanecido alto={Spacing[4]} />
            <Desvanecido alto={Spacing[5]} lado="abajo" />
          </View>
        </>
      ) : (
        <View style={styles.secciones}>
          <ScrollView contentContainerStyle={styles.desplazable} showsVerticalScrollIndicator={false}>
            {listaDeAcciones}
            {listaDeSecciones}
          </ScrollView>
          <Desvanecido alto={Spacing[4]} />
          <Desvanecido alto={Spacing[5]} lado="abajo" />
        </View>
      )}

      <View style={styles.pie}>{children}</View>
    </View>
  );
}

/** Cierra el menú y ejecuta `despues`. */
export function cerrarMenu(drawer: DrawerContentComponentProps, despues?: () => void) {
  drawer.navigation.dispatch(DrawerActions.closeDrawer());
  despues?.();
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
    paddingLeft: 8,
    paddingRight: Spacing[2],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
  },
  marcaTexto: {
    flex: 1,
    minWidth: 0,
  },
  accion: {
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
    paddingHorizontal: Spacing[2],
  },
  desplazable: {
    paddingTop: Spacing[2],
    paddingBottom: Spacing[5],
  },
  secciones: {
    flex: 1,
    marginTop: Spacing[1],
  },
  rotulo: {
    marginTop: 14,
    marginBottom: 4,
    marginHorizontal: Spacing[2],
  },
  items: {
    gap: 2,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    minHeight: 52,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.button,
    borderWidth: 1,
  },
  filaTexto: {
    flex: 1,
    fontSize: 17,
    lineHeight: 21,
  },
  fijas: {},
  pie: {
    gap: Spacing[2],
    marginTop: Spacing[2],
    paddingTop: Spacing[3],
  },
});
