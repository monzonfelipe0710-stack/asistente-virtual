import type { DrawerContentComponentProps } from "expo-router/drawer";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { DialogoCerrarSesion } from "./DialogoCerrarSesion";
import { cerrarMenu } from "./MenuLateral";
import { FilaDelMenu } from "./FilaDelMenu";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Weight, useColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";

/**
 * Pie del menú del panel: volver al asistente y la cuenta con su botón de
 * cerrar sesión.
 */
export function PieAdmin({ drawer }: { drawer: DrawerContentComponentProps }) {
  const C = useColors();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { role } = usePermisos();
  const [confirmando, setConfirmando] = useState(false);

  async function cerrarSesion() {
    router.replace("/");
    await logout();
  }

  return (
    <>
      <FilaDelMenu
        icono="chat"
        texto="Ir al asistente"
        accesibilidad="link"
        destacada
        onPress={() => cerrarMenu(drawer, () => router.replace("/"))}
        derecha={<Icon name="chevronRight" size={20} color={C.accentText} />}
      />

      {!!user && (
        <View style={[styles.cuenta, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Avatar name={user.name || user.email} />
          <View style={styles.texto}>
            <Text style={[styles.nombre, { color: C.ink }]} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={[styles.rol, { color: C.ink2 }]} numberOfLines={1}>
              {role}
            </Text>
          </View>
          <Pressable
            onPress={() => setConfirmando(true)}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            style={({ pressed }) => [styles.salir, pressed && { backgroundColor: C.surface2 }]}
          >
            {({ pressed }) => <Icon name="logout" size={22} color={pressed ? C.danger : C.ink} />}
          </Pressable>
        </View>
      )}

      <DialogoCerrarSesion
        open={confirmando}
        onClose={() => setConfirmando(false)}
        onConfirmar={cerrarSesion}
      />
    </>
  );
}

const styles = StyleSheet.create({
  cuenta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    minHeight: 64,
    paddingVertical: 10,
    paddingLeft: Spacing[3],
    paddingRight: Spacing[2],
    borderRadius: Radius["2xl"],
    borderWidth: 1,
  },
  texto: {
    flex: 1,
    minWidth: 0,
  },
  nombre: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: Weight.semibold,
  },
  rol: {
    fontSize: 14,
    lineHeight: 18,
  },
  salir: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
