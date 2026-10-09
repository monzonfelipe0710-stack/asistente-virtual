import { usePathname, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Text } from "../common/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Palette,
  Radius,
  Size,
  Spacing,
  Type,
  Typography,
  setColorScheme,
  useColorScheme,
  useColors,
} from "../../constants/theme";
import { useAdmin, type Permission } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";
import ChatBotAvatar from "../ChatBotAvatar";
import Icon, { type IconName } from "../common/Icon";
import Toggle from "../common/Toggle";

/**
 * Menú del panel. Mismo cajón que el de la pantalla de inicio (320 de ancho,
 * radio 28, filas de 48 con la línea de inicio en x = 24): si cada uno usara
 * sus propias medidas, la app se sentiría como dos productos.
 */

interface NavItem {
  to: string;
  label: string;
  perm: Permission;
  icon: IconName;
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Principal",
    items: [
      { to: "/admin", label: "Panel general", perm: "dashboard", icon: "home" },
      {
        to: "/admin/mesa-de-entrada",
        label: "Mesa de Entradas",
        perm: "mesa_entrada",
        icon: "box",
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      { to: "/admin/solicitudes", label: "Solicitudes", perm: "solicitudes", icon: "checkCircle" },
      { to: "/admin/usuarios", label: "Usuarios", perm: "usuarios", icon: "users" },
      { to: "/admin/conocimiento", label: "Conocimiento", perm: "conocimiento", icon: "bulb" },
      { to: "/admin/documentos", label: "Documentos", perm: "documentos", icon: "folder" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { to: "/admin/siged", label: "Integración SIGED", perm: "siged", icon: "terminal" },
      { to: "/admin/configuracion", label: "Configuración", perm: "configuracion", icon: "settings" },
      { to: "/admin/reportes", label: "Reportes", perm: "reportes", icon: "chart" },
    ],
  },
];

interface Props {
  open: boolean;
  slide: Animated.Value;
  onClose: (then?: () => void) => void;
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function AdminSidebar({ open, slide, onClose }: Props) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const dark = useColorScheme() === "dark";

  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { can, role } = useAdmin();
  const { user, logout } = useAuth();

  const drawerWidth = Math.min(Size.drawer, width - 56);

  const go = (to: string) => onClose(() => router.push(to as never));

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={() => onClose()}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: slide.interpolate({ inputRange: [-1, 0], outputRange: [0, 1] }) },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => onClose()}
          accessibilityLabel="Cerrar menú"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            width: drawerWidth,
            paddingTop: insets.top + Spacing[2],
            paddingBottom: Math.max(insets.bottom, Spacing[3]),
            transform: [
              {
                translateX: slide.interpolate({
                  inputRange: [-1, 0],
                  outputRange: [-drawerWidth - 8, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.brand}>
          <ChatBotAvatar size={40} tight static />
          <View style={styles.flex}>
            <Text style={styles.brandName}>Acceso interno</Text>
            <Text style={styles.brandSub}>Subsec. de Recursos Humanos</Text>
          </View>
        </View>

        <ScrollView
          style={styles.drawerItems}
          showsVerticalScrollIndicator={false}
        >
          {SECTIONS.map((section) => {
            const visible = section.items.filter((it) => can(it.perm));
            if (visible.length === 0) return null;

            return (
              <View key={section.title}>
                <Text style={styles.sectionLabel}>{section.title}</Text>

                <View style={styles.group}>
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
                        style={({ pressed }) => [
                          styles.menuItem,
                          active
                            ? { backgroundColor: C.activeBg }
                            : pressed && { backgroundColor: C.surface },
                        ]}
                      >
                        <Icon
                          name={link.icon}
                          size={20}
                          color={active ? C.activeInk : C.ink2}
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
              </View>
            );
          })}
        </ScrollView>

        {/* Preferencias y cuenta quedan fijas abajo, siempre visibles */}
        <View style={styles.drawerFooter}>
          <Pressable
            onPress={() => setColorScheme(dark ? "light" : "dark")}
            accessibilityRole="switch"
            accessibilityState={{ checked: dark }}
            accessibilityLabel="Modo oscuro"
            style={styles.menuItem}
          >
            <Icon name="moon" size={20} color={C.ink2} />
            <Text style={styles.menuLabel}>Modo oscuro</Text>
            <Toggle value={dark} />
          </Pressable>

          <Pressable
            onPress={() => onClose(() => router.replace("/"))}
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.menuItem,
              pressed && { backgroundColor: C.surface },
            ]}
          >
            <Icon name="chat" size={20} color={C.ink2} />
            <Text style={styles.menuLabel}>Ir al asistente</Text>
            <Icon name="chevronRight" size={18} color={C.ink3} />
          </Pressable>

          {!!user && (
            <View style={styles.account}>
              <View style={styles.accountAvatar}>
                <Text style={styles.accountInitials}>
                  {initialsOf(user.name || user.email)}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.accountName} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text style={styles.accountRole} numberOfLines={1}>
                  {role}
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  onClose(async () => {
                    await logout();
                    router.replace("/");
                  })
                }
                accessibilityRole="button"
                accessibilityLabel="Cerrar sesión"
                style={({ pressed }) => [
                  styles.logout,
                  pressed && { backgroundColor: C.surface2 },
                ]}
              >
                {({ pressed }) => (
                  <Icon name="logout" size={20} color={pressed ? C.danger : C.ink2} />
                )}
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (C: Palette) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      minWidth: 0,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: C.scrim,
    },
    drawer: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: C.canvas,
      paddingHorizontal: Spacing[3],
      borderTopRightRadius: Radius["3xl"],
      borderBottomRightRadius: Radius["3xl"],
    },
    brand: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing[3],
      paddingHorizontal: Spacing[3],
    },
    brandName: {
      ...Type.cardTitle,
      color: C.ink,
    },
    brandSub: {
      ...Type.meta,
      color: C.ink2,
    },
    drawerItems: {
      flex: 1,
      marginTop: Spacing[3],
    },
    sectionLabel: {
      ...Type.overline,
      color: C.ink3,
      marginTop: Spacing[5],
      marginBottom: Spacing[2],
      marginHorizontal: Spacing[3],
    },
    group: {
      gap: 2,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing[3],
      paddingHorizontal: Spacing[3],
      height: 48,
      borderRadius: Radius.lg,
    },
    menuLabel: {
      flex: 1,
      fontSize: Typography.md,
      fontWeight: Typography.medium,
      color: C.ink,
    },
    menuLabelActive: {
      color: C.activeInk,
      fontWeight: Typography.semibold,
    },
    drawerFooter: {
      gap: 2,
      borderTopWidth: 1,
      borderTopColor: C.border,
      marginTop: Spacing[2],
      paddingTop: Spacing[2],
    },
    account: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing[3],
      marginTop: 6,
      paddingVertical: Spacing[2],
      paddingLeft: Spacing[3],
      paddingRight: Spacing[2],
      borderRadius: Radius.xl,
      backgroundColor: C.surface,
    },
    accountAvatar: {
      width: 36,
      height: 36,
      borderRadius: Radius.full,
      backgroundColor: C.surface2,
      alignItems: "center",
      justifyContent: "center",
    },
    accountInitials: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: C.ink2,
    },
    accountName: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: Typography.medium,
      color: C.ink,
    },
    accountRole: {
      fontSize: 12,
      lineHeight: 16,
      color: C.ink2,
    },
    logout: {
      width: 40,
      height: 40,
      borderRadius: Radius.lg,
      alignItems: "center",
      justifyContent: "center",
    },
  });
