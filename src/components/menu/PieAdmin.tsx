import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import {
  cerrarMenu,
  FilaDelMenu,
  FilaModoOscuro,
  iniciales,
} from "./MenuLateral";
import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Weight, useColors } from "@/constants/theme";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";

/**
 * Pie del menú del panel: modo oscuro, volver al asistente y la cuenta con su
 * botón de cerrar sesión.
 */
export function PieAdmin({ drawer }: { drawer: DrawerContentComponentProps }) {
  const C = useColors();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { role } = useAdmin();

  async function cerrarSesion() {
    cerrarMenu(drawer);
    await logout();
    router.replace("/");
  }

  return (
    <>
      <FilaModoOscuro />

      <FilaDelMenu
        icono="chat"
        texto="Ir al asistente"
        accesibilidad="link"
        onPress={() => cerrarMenu(drawer, () => router.replace("/"))}
        derecha={<Icon name="chevronRight" size={18} color={C.ink3} />}
      />

      {!!user && (
        <View style={[styles.cuenta, { backgroundColor: C.surface }]}>
          <View style={[styles.avatar, { backgroundColor: C.surface2 }]}>
            <Text style={[styles.iniciales, { color: C.ink2 }]}>
              {iniciales(user.name || user.email)}
            </Text>
          </View>
          <View style={styles.texto}>
            <Text style={[styles.nombre, { color: C.ink }]} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={[styles.rol, { color: C.ink2 }]} numberOfLines={1}>
              {role}
            </Text>
          </View>
          <Pressable
            onPress={cerrarSesion}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            style={({ pressed }) => [styles.salir, pressed && { backgroundColor: C.surface2 }]}
          >
            {({ pressed }) => <Icon name="logout" size={20} color={pressed ? C.danger : C.ink2} />}
          </Pressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  cuenta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    marginTop: 6,
    paddingVertical: Spacing[2],
    paddingLeft: Spacing[3],
    paddingRight: Spacing[2],
    borderRadius: Radius.xl,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iniciales: {
    fontSize: 13,
    fontWeight: Weight.semibold,
  },
  texto: {
    flex: 1,
    minWidth: 0,
  },
  nombre: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: Weight.medium,
  },
  rol: {
    fontSize: 12,
    lineHeight: 16,
  },
  salir: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
