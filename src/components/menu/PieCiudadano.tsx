import type { DrawerContentComponentProps } from "expo-router/drawer";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { cerrarMenu } from "./MenuLateral";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { MenuEmergente, type Ancla, type OpcionDeMenu } from "@/components/ui/MenuEmergente";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Weight, useColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

/**
 * Pie del menú de la app: la cuenta. Sin sesión, una tarjeta lleva al login.
 * Con sesión, tocarla o mantenerla apretada abre un menú emergente con Mi
 * perfil, Administración (si la cuenta es de personal) y Cerrar sesión.
 */
export function PieCiudadano({ drawer }: { drawer: DrawerContentComponentProps }) {
  const C = useColors();
  const router = useRouter();
  const { user, isStaff, logout } = useAuth();
  const tarjeta = useRef<View>(null);
  const [ancla, setAncla] = useState<Ancla | null>(null);

  function ir(ruta: "/login" | "/perfil" | "/admin") {
    setAncla(null);
    cerrarMenu(drawer, () => router.push(ruta));
  }

  async function cerrarSesion() {
    setAncla(null);
    cerrarMenu(drawer);
    await logout();
  }

  function abrir() {
    if (!user) return ir("/login");
    tarjeta.current?.measureInWindow((x, y, width, height) => setAncla({ x, y, width, height }));
  }

  const opciones: OpcionDeMenu[] = [
    { texto: "Mi perfil", icono: "user", onPress: () => ir("/perfil") },
    ...(isStaff
      ? [{ texto: "Administración", icono: "shield" as const, onPress: () => ir("/admin") }]
      : []),
    { texto: "Cerrar sesión", icono: "logout", onPress: cerrarSesion, peligro: true },
  ];

  return (
    <>
      <Pressable
        ref={tarjeta}
        onPress={abrir}
        onLongPress={abrir}
        accessibilityRole="button"
        accessibilityLabel={user ? `${user.name}, ${user.role}` : "Acceso interno"}
        accessibilityState={user ? { expanded: !!ancla } : undefined}
        style={({ pressed }) => [
          styles.tarjeta,
          { backgroundColor: pressed ? C.surface2 : C.surface, borderColor: C.border },
        ]}
      >
        <Avatar name={user ? user.name || user.email : "?"} />
        <View style={styles.texto}>
          <Text style={[styles.nombre, { color: C.ink }]} numberOfLines={1}>
            {user ? user.name : "Acceso interno"}
          </Text>
          <Text style={[styles.detalle, { color: C.ink2 }]} numberOfLines={1}>
            {user ? user.role : "Para agentes de la provincia"}
          </Text>
        </View>
        <Icon name={user ? "more" : "chevronRight"} size={24} color={C.ink} />
      </Pressable>

      <MenuEmergente ancla={ancla} opciones={opciones} onClose={() => setAncla(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    minHeight: 64,
    paddingHorizontal: Spacing[3],
    paddingVertical: 10,
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
  detalle: {
    fontSize: 14,
    lineHeight: 18,
  },
});
