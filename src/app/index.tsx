import { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
  Keyboard,
  Platform,
} from "react-native";
import { Text } from "../components/common/Text";
import { useRouter } from "expo-router";
import Head from "expo-router/head";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChatBotAvatar from "../components/ChatBotAvatar";
import ChatWindow from "../components/ciudadano/ChatWindow";
import DownloadSection from "../components/ciudadano/DownloadSection";
import ExternalAccess from "../components/ciudadano/ExternalAccess";
import Icon, { type IconName } from "../components/common/Icon";
import Toggle from "../components/common/Toggle";
import {
  Motion,
  Palette,
  Radius,
  Size,
  Spacing,
  Type,
  Typography,
  useColors,
  useColorScheme,
  setColorScheme,
} from "../constants/theme";
import { useAuth } from "../context/AuthContext";

type Tab = "chat" | "descargas" | "accesos";

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "chat", label: "Asistente", icon: "chat" },
  { id: "descargas", label: "Descargas", icon: "download" },
  { id: "accesos", label: "Accesos", icon: "grid" },
];

const TITLES: Record<Tab, string> = {
  chat: "ChatAP",
  descargas: "Descargas",
  accesos: "Accesos",
};

const ease = Easing.bezier(...Motion.bezier);

function initialsOf(name: string) {
  return name
    .trim()
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function CiudadanoPage() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [menuMounted, setMenuMounted] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [chatKey, setChatKey] = useState(0);
  const [chatStarted, setChatStarted] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // 320 deja 70 px de velo en un teléfono de 390: espacio de sobra para cerrar
  const drawerWidth = Math.min(Size.drawer, width - 56);
  const { user } = useAuth();

  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const dark = useColorScheme() === "dark";

  const slide = useRef(new Animated.Value(-1)).current; // -1 cerrado, 0 abierto

  // con el teclado arriba, el borde inferior lo pone el teclado y no la barra del sistema
  const bottomInset =
    keyboardHeight > 0 ? Spacing[3] : Math.max(insets.bottom, Spacing[3]);

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
      setMenuMounted(false);
      then?.();
    });
  };

  const newChat = () => {
    setActiveTab("chat");
    setChatStarted(false);
    setChatKey((k) => k + 1);
  };

  const goInternal = () =>
    closeMenu(() => router.push(user ? "/admin" : "/login"));

  const showNewChat = activeTab === "chat" && chatStarted;

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

      {/* Header de 56: menú, título 17/600 y nuevo chat. Los botones van a 9 px
          del borde para que el trazo del ícono caiga sobre la línea de 20. */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, height: insets.top + Size.header },
        ]}
      >
        <Pressable
          onPress={openMenu}
          accessibilityRole="button"
          accessibilityLabel="Abrir menú"
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
        >
          <Icon name="menu" size={22} color={C.ink} />
        </Pressable>

        <Text style={styles.title}>{TITLES[activeTab]}</Text>

        {showNewChat ? (
          <Pressable
            onPress={newChat}
            accessibilityRole="button"
            accessibilityLabel="Nuevo chat"
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          >
            <Icon name="newChat" size={21} color={C.ink} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      <View style={[styles.content, { paddingBottom: keyboardHeight }]}>
        {activeTab === "chat" && (
          <ChatWindow
            key={chatKey}
            onConversationStart={setChatStarted}
            greetingName={user?.name}
            bottomInset={bottomInset}
          />
        )}

        {activeTab === "descargas" && (
          <ScrollView
            style={styles.scrollTab}
            contentContainerStyle={[
              styles.scrollTabContent,
              { paddingBottom: insets.bottom + Spacing[10] },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <DownloadSection />
          </ScrollView>
        )}

        {activeTab === "accesos" && (
          <ScrollView
            style={styles.scrollTab}
            contentContainerStyle={[
              styles.scrollTabContent,
              { paddingBottom: insets.bottom + Spacing[10] },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <ExternalAccess />
          </ScrollView>
        )}
      </View>

      <Modal
        visible={menuMounted}
        transparent
        animationType="none"
        onRequestClose={() => closeMenu()}
        statusBarTranslucent
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
            <View style={styles.brandText}>
              <Text style={styles.brandName}>ChatAP</Text>
              <Text style={styles.brandSub}>Subsec. de Recursos Humanos</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Secciones</Text>
          <View style={styles.drawerItems}>
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => closeMenu(() => setActiveTab(tab.id))}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.menuItem,
                    active
                      ? { backgroundColor: C.activeBg }
                      : pressed && { backgroundColor: C.surface },
                  ]}
                >
                  <Icon
                    name={tab.icon}
                    size={20}
                    color={active ? C.activeInk : C.ink2}
                  />
                  <Text
                    style={[styles.menuLabel, active && styles.menuLabelActive]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.flex} />

          {/* La fila entera es el interruptor: es un ajuste, no una sección */}
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
            onPress={goInternal}
            accessibilityRole="button"
            accessibilityLabel={user ? "Ir al panel de administración" : "Acceso interno"}
            style={({ pressed }) => [
              styles.account,
              { backgroundColor: pressed ? C.surface2 : C.surface },
            ]}
          >
            <View style={styles.accountAvatar}>
              <Text style={styles.accountInitials}>
                {user ? initialsOf(user.name || user.email) : "?"}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.accountLabel} numberOfLines={1}>
                {user ? user.name : "Acceso interno"}
              </Text>
              <Text style={styles.accountSub} numberOfLines={1}>
                {user ? "Ir al panel" : "Para agentes de la provincia"}
              </Text>
            </View>
            <Icon name="chevronRight" size={18} color={C.ink3} />
          </Pressable>
        </Animated.View>
      </Modal>
    </View>
  );
}

const createStyles = (C: Palette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: C.canvas,
    },
    flex: {
      flex: 1,
    },

    header: {
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
    iconBtnPressed: {
      backgroundColor: C.surface,
    },
    title: {
      ...Type.cardTitle,
      color: C.ink,
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
    brandText: {
      flex: 1,
    },
    brandName: {
      ...Type.cardTitle,
      color: C.ink,
    },
    brandSub: {
      ...Type.meta,
      color: C.ink2,
    },
    sectionLabel: {
      ...Type.overline,
      color: C.ink3,
      marginTop: Spacing[8],
      marginBottom: Spacing[2],
      marginHorizontal: Spacing[3],
    },
    drawerItems: {
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
    },
    account: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing[3],
      marginTop: Spacing[2],
      height: 56,
      paddingHorizontal: Spacing[3],
      borderRadius: Radius.xl,
    },
    accountAvatar: {
      width: 32,
      height: 32,
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
    accountLabel: {
      fontSize: Typography.base,
      fontWeight: Typography.medium,
      color: C.ink,
    },
    accountSub: {
      fontSize: 12,
      lineHeight: 16,
      color: C.ink2,
    },

    content: {
      flex: 1,
    },

    scrollTab: {
      flex: 1,
    },
    scrollTabContent: {
      paddingHorizontal: Spacing[5],
      paddingTop: Spacing[1],
    },
  });
