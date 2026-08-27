import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Switch,
  useWindowDimensions,
  Keyboard,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import Head from "expo-router/head";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChatWindow from "../components/ciudadano/ChatWindow";
import DownloadSection from "../components/ciudadano/DownloadSection";
import ExternalAccess from "../components/ciudadano/ExternalAccess";
import {
  Palette,
  Typography,
  Spacing,
  Radius,
  Shadows,
  useColors,
  useColorScheme,
  setColorScheme,
} from "../constants/theme";

type Tab = "chat" | "descargas" | "accesos";

const TABS: {
  id: Tab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "chat", label: "Asistente", icon: "chatbubble-ellipses-outline" },
  { id: "descargas", label: "Descargas", icon: "download-outline" },
  { id: "accesos", label: "Accesos", icon: "grid-outline" },
];

export default function CiudadanoPage() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [menuMounted, setMenuMounted] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [chatKey, setChatKey] = useState(0);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(width * 0.82, 340);

  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const dark = useColorScheme() === "dark";

  const slide = useRef(new Animated.Value(-1)).current; // -1 cerrado, 0 abierto
  const headerOpacity = useRef(new Animated.Value(1)).current;

  const contentPaddingBottom =
    keyboardHeight > 0 ? keyboardHeight : Math.max(insets.bottom - 22, Spacing[1]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const openMenu = () => {
    setMenuMounted(true);
    Animated.timing(slide, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = (then?: () => void) => {
    Animated.timing(slide, {
      toValue: -1,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setMenuMounted(false);
      then?.();
    });
  };

  const fadeHeader = useCallback(
    (started: boolean) => {
      Animated.timing(headerOpacity, {
        toValue: started ? 0 : 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    },
    [headerOpacity]
  );

  const newChat = () => {
    setActiveTab("chat");
    setChatKey((k) => k + 1);
  };

  return (
    <View style={styles.safe}>
      {/* expo-router maneja el <title> del build web con react-helmet;
          sin este Head queda el <title data-rh> vacío y Lighthouse lo marca */}
      <Head>
        <title>ChatAP · Asistente virtual de trámites</title>
        <meta
          name="description"
          content="Consultá trámites, descargá formularios y accedé a los servicios en línea desde el asistente virtual ChatAP."
        />
      </Head>
      <View style={[styles.content, { paddingBottom: contentPaddingBottom }]}>
        {activeTab === "chat" && (
          <ChatWindow key={chatKey} onConversationStart={fadeHeader} />
        )}

        {activeTab === "descargas" && (
          <ScrollView
            style={styles.scrollTab}
            contentContainerStyle={[
              styles.scrollTabContent,
              { paddingTop: insets.top + 68 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <DownloadSection />
            <View style={styles.tabBottomPad} />
          </ScrollView>
        )}

        {activeTab === "accesos" && (
          <ScrollView
            style={styles.scrollTab}
            contentContainerStyle={[
              styles.scrollTabContent,
              { paddingTop: insets.top + 68 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <ExternalAccess />
            <View style={styles.tabBottomPad} />
          </ScrollView>
        )}
      </View>

      <TouchableOpacity
        style={[styles.fab, { top: insets.top + Spacing[2] }]}
        onPress={openMenu}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Abrir menú"
      >
        <Ionicons name="menu" size={26} color={C.slate700} />
      </TouchableOpacity>

      {activeTab === "chat" && (
        <Animated.View
          style={[
            styles.floatingTitle,
            { top: insets.top + Spacing[2], opacity: headerOpacity },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.title}>ChatAP</Text>
        </Animated.View>
      )}

      <Modal
        visible={menuMounted}
        transparent
        animationType="none"
        onRequestClose={() => closeMenu()}
      >
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: slide.interpolate({
                inputRange: [-1, 0],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => closeMenu()}
          />
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
            <View style={styles.brandAvatar}>
              <Text style={styles.brandAvatarText}>AP</Text>
            </View>
            <View style={styles.brandText}>
              <Text style={styles.brandName}>ChatAP</Text>
              <Text style={styles.brandSub}>Subsec. de Recursos Humanos</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.newChatBtn}
            onPress={() => closeMenu(newChat)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Nuevo chat"
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.newChatText}>Nuevo chat</Text>
          </TouchableOpacity>

          <View style={styles.drawerItems}>
            <Text style={styles.sectionLabel}>Secciones</Text>
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.menuItem, active && styles.menuItemActive]}
                  onPress={() => closeMenu(() => setActiveTab(tab.id))}
                  activeOpacity={0.7}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons
                    name={tab.icon}
                    size={22}
                    color={active ? C.primary : C.slate600}
                  />
                  <Text
                    style={[styles.menuLabel, active && styles.menuLabelActive]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

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
                onValueChange={(on) =>
                  setColorScheme(on ? "dark" : "light")
                }
                trackColor={{ false: C.slate300, true: C.primary }}
                thumbColor="#ffffff"
                accessibilityLabel="Modo oscuro"
              />
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => closeMenu(() => router.push("/admin"))}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Panel de administración"
            >
              <Ionicons name="settings-outline" size={22} color={C.slate600} />
              <Text style={styles.menuLabel}>Admin</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={C.slate400}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const createStyles = (C: Palette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: C.white,
    },

    fab: {
      position: "absolute",
      left: Spacing[3],
      width: 52,
      height: 52,
      borderRadius: Radius.full,
      backgroundColor: C.slate100,
      justifyContent: "center",
      alignItems: "center",
      ...Shadows.sm,
    },
    floatingTitle: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 52,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: C.slate800,
    },

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
      borderTopRightRadius: Radius.xl,
      borderBottomRightRadius: Radius.xl,
    },
    brand: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing[3],
      paddingHorizontal: Spacing[2],
      marginBottom: Spacing[5],
    },
    brandAvatar: {
      width: 40,
      height: 40,
      borderRadius: Radius.full,
      backgroundColor: C.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    brandAvatarText: {
      color: "#ffffff",
      fontSize: Typography.base,
      fontWeight: Typography.bold,
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
      gap: 2,
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
    newChatBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing[2],
      paddingVertical: Spacing[3],
      backgroundColor: C.primary,
      borderRadius: Radius.full,
    },
    newChatText: {
      color: "#ffffff",
      fontSize: Typography.base,
      fontWeight: Typography.semibold,
    },

    content: {
      flex: 1,
    },

    scrollTab: {
      flex: 1,
    },
    scrollTabContent: {
      padding: Spacing[4],
    },
    tabBottomPad: {
      height: Spacing[4],
    },
  });
