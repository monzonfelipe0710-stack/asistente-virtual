import { Ionicons } from "@expo/vector-icons";
import { Slot, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AdminSidebar from "../../components/admin/AdminSidebar";
import { Btn } from "../../components/admin/ui";
import { ToastProvider } from "../../components/common/Toast";
import {
  Radius,
  Spacing,
  Type,

  useAdminColors,
} from "../../constants/theme";
import { AdminProvider } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";

/** Pantalla de bloqueo: la ve el ciudadano y quien no inició sesión. */
function Locked({ signedIn }: { signedIn: boolean }) {
  const C = useAdminColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.lockedWrap,
        { backgroundColor: C.canvas, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.lockedCard}>
        <Ionicons name="lock-closed-outline" size={34} color={C.bad} />
        <Text style={[styles.lockedTitle, { color: C.ink }]}>Acceso restringido</Text>
        <Text style={[styles.lockedText, { color: C.muted }]}>
          {signedIn
            ? "Tu cuenta de Ciudadano no tiene permiso para entrar al Acceso Interno."
            : "Iniciá sesión con una cuenta de Administrador o Superadmin para entrar al Acceso Interno."}
        </Text>
        <View style={styles.lockedActions}>
          {!signedIn && (
            <Btn label="Iniciar sesión" onPress={() => router.push("/login")} />
          )}
          <Btn label="Volver al inicio" variant="ghost" onPress={() => router.replace("/")} />
        </View>
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
    Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  };

  const closeMenu = (then?: () => void) => {
    Animated.timing(slide, { toValue: -1, duration: 180, useNativeDriver: true }).start(
      () => {
        setMenuOpen(false);
        then?.();
      }
    );
  };

  // La sesión se lee de forma asíncrona: sin esto, en el primer render se
  // vería "acceso restringido" incluso teniendo sesión válida.
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.paper }]}>
        <ActivityIndicator color={C.brand} />
      </View>
    );
  }

  const allowed =
    !!user && (userRole === "Superadmin" || userRole === "Administrador");

  if (!allowed) return <Locked signedIn={!!user} />;

  return (
    <AdminProvider>
      <ToastProvider>
      <View style={[styles.root, { backgroundColor: C.paper, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable
            onPress={openMenu}
            accessibilityRole="button"
            accessibilityLabel="Abrir menú"
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: pressed ? C.mist : "transparent" },
            ]}
          >
            <Ionicons name="menu" size={22} color={C.ink} />
          </Pressable>

        </View>

        <View style={{ flex: 1 }}>
          <Slot />
        </View>

        <AdminSidebar open={menuOpen} slide={slide} onClose={closeMenu} />
      </View>
      </ToastProvider>
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
    height: 52,
    justifyContent: "center",
    paddingHorizontal: Spacing[2],
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing[4],
  },
  lockedCard: {
    width: "100%",
    maxWidth: 400,
    padding: Spacing[8],
    alignItems: "center",
    gap: Spacing[2],
  },
  lockedTitle: {
    ...Type.cardTitle,
  },
  lockedText: {
    ...Type.body,
    textAlign: "center",
  },
  lockedActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing[2],
    marginTop: Spacing[5],
  },
});
