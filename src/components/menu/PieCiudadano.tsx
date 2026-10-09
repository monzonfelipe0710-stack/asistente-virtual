import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { cerrarMenu, FilaModoOscuro, iniciales } from "./MenuLateral";
import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Weight, useColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

/**
 * Pie del menú de la app: modo oscuro y una tarjeta de acceso interno. Sin
 * sesión lleva al login; con sesión, al panel.
 */
export function PieCiudadano({ drawer }: { drawer: DrawerContentComponentProps }) {
  const C = useColors();
  const router = useRouter();
  const { user } = useAuth();

  function irAlAcceso() {
    cerrarMenu(drawer, () => router.push(user ? "/admin" : "/login"));
  }

  return (
    <>
      <FilaModoOscuro />

      <Pressable
        onPress={irAlAcceso}
        accessibilityRole="button"
        accessibilityLabel={user ? "Ir al panel de administración" : "Acceso interno"}
        style={({ pressed }) => [
          styles.tarjeta,
          { backgroundColor: pressed ? C.surface2 : C.surface },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: C.surface2 }]}>
          <Text style={[styles.iniciales, { color: C.ink2 }]}>
            {user ? iniciales(user.name || user.email) : "?"}
          </Text>
        </View>
        <View style={styles.texto}>
          <Text style={[styles.nombre, { color: C.ink }]} numberOfLines={1}>
            {user ? user.name : "Acceso interno"}
          </Text>
          <Text style={[styles.detalle, { color: C.ink2 }]} numberOfLines={1}>
            {user ? "Ir al panel" : "Para agentes de la provincia"}
          </Text>
        </View>
        <Icon name="chevronRight" size={18} color={C.ink3} />
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    marginTop: Spacing[2],
    height: 56,
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.xl,
  },
  avatar: {
    width: 32,
    height: 32,
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
  },
  nombre: {
    fontSize: 15,
    fontWeight: Weight.medium,
  },
  detalle: {
    fontSize: 12,
    lineHeight: 16,
  },
});
