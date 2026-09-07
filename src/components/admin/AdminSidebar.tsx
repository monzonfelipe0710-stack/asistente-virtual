import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Palette,
  Radius,
  Spacing,
  Typography,
  setColorScheme,
  useColorScheme,
  useColors,
} from "../../constants/theme";
import { useAdmin, type Permission } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";
import ChatBotAvatar from "../ChatBotAvatar";

/**
 * Menú del panel.
 *
 * Está escrito contra la misma paleta y las mismas medidas que el menú de la
 * pantalla de inicio (`src/app/index.tsx`), no contra las del panel: son el
 * mismo cajón, y si cada uno usara sus propios tamaños la app se sentiría como
 * dos productos apenas se abre el menú.
 */

interface NavItem {
  to: string;
  label: string;
  perm: Permission;
  icon: keyof typeof Ionicons.glyphMap;
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Principal",
    items: [
      { to: "/admin", label: "Panel general", perm: "dashboard", icon: "home-outline" },
      {
        to: "/admin/mesa-de-entrada",
        label: "Mesa de Entradas",
        perm: "mesa_entrada",
        icon: "cube-outline",
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        to: "/admin/solicitudes",
        label: "Solicitudes",
        perm: "solicitudes",
        icon: "checkmark-circle-outline",
      },
      { to: "/admin/usuarios", label: "Usuarios", perm: "usuarios", icon: "people-outline" },
      {
        to: "/admin/conocimiento",
        label: "Conocimiento",
        perm: "conocimiento",
        icon: "bulb-outline",
      },
      {
        to: "/admin/documentos",
        label: "Documentos",
        perm: "documentos",
        icon: "folder-outline",
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        to: "/admin/siged",
        label: "Integración SIGED",
        perm: "siged",
        icon: "terminal-outline",
      },
      {
        to: "/admin/configuracion",
        label: "Configuración",
        perm: "configuracion",
        icon: "settings-outline",
      },
      { to: "/admin/reportes", label: "Reportes", perm: "reportes", icon: "bar-chart-outline" },
    ],
  },
];

interface Props {
  open: boolean;
  slide: Animated.Value;
  onClose: (then?: () => void) => void;
}

export default function AdminSidebar({ open, slide, onClose }: Props) {
  const C = useColors();
  const styles = createStyles(C);
  const dark = useColorScheme() === "dark";

  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { can, role } = useAdmin();
  const { user, logout } = useAuth();

  const drawerWidth = Math.min(width * 0.82, 340);

  const go = (to: string) => onClose(() => router.push(to as never));

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={() => onClose()}
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: slide.interpolate({ inputRange: [-1, 0], outputRange: [0, 1] }) },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => onClose()} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            width: drawerWidth,
            paddingTop: insets.top + Spacing[4],
            paddingBottom: insets.bottom + Spacing[4],
            transform: [
              {
                translateX: slide.interpolate({
                  inputRange: [-1, 0],
                  outputRange: [-drawerWidth, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.brand}>
          <ChatBotAvatar size={40} />
          <View style={styles.brandText}>
            <Text style={styles.brandName}>Acceso interno</Text>
            <Text style={styles.brandSub}>Subsec. de Recursos Humanos</Text>
          </View>
        </View>

        <ScrollView
          style={styles.drawerItems}
          contentContainerStyle={{ gap: 2 }}
          showsVerticalScrollIndicator={false}
        >
          {SECTIONS.map((section) => {
            const visible = section.items.filter((it) => can(it.perm));
            if (visible.length === 0) return null;

            return (
              <View key={section.title} style={{ marginBottom: Spacing[5] }}>
                <Text style={styles.sectionLabel}>{section.title}</Text>

                {visible.map((link) => {
                  // "/admin" solo coincide exacto: si no, quedaría activo siempre.
                  const active =
                    link.to === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(link.to);

                  return (
                    <Pressable
                      key={link.to}
                      onPress={() => go(link.to)}
                      accessibilityRole="link"
                      accessibilityState={{ selected: active }}
                      style={[styles.menuItem, active && styles.menuItemActive]}
                    >
                      <Ionicons
                        name={link.icon}
                        size={22}
                        color={active ? C.primary : C.slate600}
                      />
                      <Text
                        style={[styles.menuLabel, active && styles.menuLabelActive]}
                        numberOfLines={1}
                      >
                        {link.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.drawerFooter}>
          <Text style={styles.sectionLabel}>Preferencias</Text>

          {/* Switch, no otro ítem de lista: es un ajuste, no una sección */}
          <View style={styles.menuItem}>
            <Ionicons
              name={dark ? "moon" : "moon-outline"}
              size={22}
              color={C.slate600}
            />
            <Text style={styles.menuLabel}>Modo oscuro</Text>
            <Switch
              value={dark}
              onValueChange={(on) => setColorScheme(on ? "dark" : "light")}
              trackColor={{ false: C.slate300, true: C.primary }}
              thumbColor="#ffffff"
              accessibilityLabel="Modo oscuro"
            />
          </View>

          <Pressable
            onPress={() => onClose(() => router.replace("/"))}
            accessibilityRole="link"
            style={styles.menuItem}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color={C.slate600}
            />
            <Text style={styles.menuLabel}>Ir al asistente</Text>
            <Ionicons name="chevron-forward" size={18} color={C.slate400} />
          </Pressable>

          {!!user && (
            <Pressable
              onPress={() =>
                onClose(async () => {
                  await logout();
                  router.replace("/");
                })
              }
              accessibilityRole="button"
              style={styles.menuItem}
            >
              <Ionicons name="log-out-outline" size={22} color={C.slate600} />
              {/* Quién está adentro vive acá desde que salió del encabezado */}
              <View style={styles.userText}>
                <Text style={styles.menuLabel} numberOfLines={1}>
                  Cerrar sesión
                </Text>
                <Text style={styles.userMeta} numberOfLines={1}>
                  {user.name} · {role}
                </Text>
              </View>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (C: Palette) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    drawer: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: C.white,
      paddingHorizontal: Spacing[4],
    },
    brand: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing[3],
    },
    brandText: {
      flex: 1,
    },
    brandName: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: C.slate800,
    },
    brandSub: {
      fontSize: Typography.sm,
      color: C.slate500,
    },
    sectionLabel: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: C.slate500,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      paddingHorizontal: Spacing[3],
      marginBottom: Spacing[2],
    },
    drawerItems: {
      flex: 1,
      marginTop: Spacing[6],
    },
    drawerFooter: {
      gap: 2,
      borderTopWidth: 1,
      borderTopColor: C.slate200,
      paddingTop: Spacing[4],
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing[4],
      paddingHorizontal: Spacing[3],
      paddingVertical: Spacing[3],
      borderRadius: Radius.lg,
      minHeight: 48,
    },
    menuItemActive: {
      backgroundColor: C.primaryLight,
    },
    menuLabel: {
      flex: 1,
      fontSize: Typography.md,
      color: C.slate700,
      fontWeight: Typography.medium,
    },
    menuLabelActive: {
      color: C.primary,
      fontWeight: Typography.semibold,
    },
    userText: {
      flex: 1,
    },
    userMeta: {
      fontSize: Typography.sm,
      color: C.slate500,
      marginTop: 1,
    },
  });
