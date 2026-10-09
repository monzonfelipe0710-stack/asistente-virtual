import { Slot, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../../components/common/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AdminSidebar from "../../components/admin/AdminSidebar";
import { Btn } from "../../components/admin/ui";
import Icon from "../../components/common/Icon";
import {
  Motion,
  Radius,
  Size,
  Spacing,
  Type,
  useAdminColors,
} from "../../constants/theme";
import { AdminProvider } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";

const ease = Easing.bezier(...Motion.bezier);

/** Pantalla de bloqueo: la ve el ciudadano y quien no inició sesión. */
function Locked({ signedIn }: { signedIn: boolean }) {
  const C = useAdminColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.lockedWrap,
        {
          backgroundColor: C.canvas,
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, Spacing[5]),
        },
      ]}
    >
      <View style={styles.lockedBody}>
        <View style={[styles.lockedIcon, { backgroundColor: C.mist }]}>
          <Icon name="lock" size={22} color={C.muted} />
        </View>
        <Text style={[Type.pageTitle, { color: C.ink, textAlign: "center" }]}>
          Acceso restringido
        </Text>
        <Text style={[Type.lead, { color: C.muted, textAlign: "center" }]}>
          {signedIn
            ? "Tu cuenta de Ciudadano no tiene permiso para entrar al Acceso Interno."
            : "Iniciá sesión con una cuenta de Administrador o Superadmin para entrar al Acceso Interno."}
        </Text>
      </View>
      <View style={styles.lockedActions}>
        {!signedIn && (
          <Btn label="Iniciar sesión" onPress={() => router.push("/login")} />
        )}
        <Btn
          label="Volver al asistente"
          variant="secondary"
          onPress={() => router.replace("/")}
        />
      </View>
    </View>
  );
}

export default function AdminLayout() {
  const C = useAdminColors();
  const insets = useSafeAreaInsets();
  const { user, userRole, loading } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const slide = useRef(new Animated.Value(-1)).current;

  const openMenu = () => {
    setMenuOpen(true);
    Animated.timing(slide, {
      toValue: 0,
      duration: Motion.drawer,
      easing: ease,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = (then?: () => void) => {
    Animated.timing(slide, {
      toValue: -1,
      duration: Motion.duration,
      easing: ease,
      useNativeDriver: true,
    }).start(() => {
      setMenuOpen(false);
      then?.();
    });
  };

  // La sesión se lee de forma asíncrona: sin esto, en el primer render se
  // vería "acceso restringido" incluso teniendo sesión válida.
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.canvas }]}>
        <ActivityIndicator color={C.brand} />
      </View>
    );
  }

  const allowed =
    !!user && (userRole === "Superadmin" || userRole === "Administrador");

  if (!allowed) return <Locked signedIn={!!user} />;

  return (
    <AdminProvider>
      <View style={[styles.root, { backgroundColor: C.canvas, paddingTop: insets.top }]}>
        {/* Barra superior de 56, igual que la de la app */}
        <View style={styles.header}>
          <Pressable
            onPress={openMenu}
            accessibilityRole="button"
            accessibilityLabel="Abrir menú"
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && { backgroundColor: C.mist },
            ]}
          >
            <Icon name="menu" size={22} color={C.ink} />
          </Pressable>
        </View>

        <View style={{ flex: 1 }}>
          <Slot />
        </View>

        <AdminSidebar open={menuOpen} slide={slide} onClose={closeMenu} />
      </View>
    </AdminProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    height: Size.header,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 9,
  },
  iconBtn: {
    width: Size.touch,
    height: Size.touch,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedWrap: {
    flex: 1,
    paddingHorizontal: Spacing[5],
  },
  lockedBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[3],
  },
  lockedIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing[2],
  },
  lockedActions: {
    gap: Spacing[3],
  },
});
