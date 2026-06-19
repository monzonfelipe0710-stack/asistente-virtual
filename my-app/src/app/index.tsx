import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Keyboard,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChatWindow from "../components/ciudadano/ChatWindow";
import DownloadSection from "../components/ciudadano/DownloadSection";
import ExternalAccess from "../components/ciudadano/ExternalAccess";
import { Colors, Typography, Spacing, Radius } from "../constants/theme";

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // useSafeAreaInsets está disponible porque @react-navigation/native
  // incluye SafeAreaProvider automáticamente en el árbol.
  const insets = useSafeAreaInsets();

  const keyboardVisible = keyboardHeight > 0;

  // El teclado en iOS reporta su altura desde el borde FÍSICO de la pantalla.
  // El SafeAreaView ya consume insets.bottom (home indicator, ~34px en iPhone X+).
  // Si no restamos insets.bottom, el padding quedaría 34px más grande de lo necesario
  // y aparecería ese hueco entre el input y el teclado.
  const contentPaddingBottom = Math.max(0, keyboardHeight - insets.bottom);

  useEffect(() => {
    // keyboardWillShow en iOS dispara ANTES de que el teclado aparezca,
    // lo que permite animar el layout al mismo tiempo que el teclado sube.
    // En Android usamos Did (no existe Will).
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

  return (
    // backgroundColor: Colors.white → la safe area superior (donde vive el reloj
    // y la batería) toma este color y queda continua con el navbar blanco.
    <SafeAreaView style={styles.safe}>
      {/* ── Navbar ── */}
      <View style={styles.navbar}>
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>AP</Text>
          </View>
          <View>
            <Text style={styles.brandName}>ChatAP</Text>
            <Text style={styles.brandSub}>Subsec. de Recursos Humanos</Text>
          </View>
        </View>
        <Link href={"/admin" as any} asChild>
          <TouchableOpacity style={styles.adminLink} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={14} color={Colors.primary} />
            <Text style={styles.adminLinkText}>Admin</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* ── Contenido ──
          paddingBottom empuja el contenido ENCIMA del teclado cuando está abierto.
          Se calcula dinámicamente con el listener del teclado de arriba. */}
      <View style={[styles.content, { paddingBottom: contentPaddingBottom }]}>
        {activeTab === "chat" && (
          <View style={styles.chatScreen}>
            <View style={styles.chatHeader}>
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>AP</Text>
              </View>
              <View>
                <Text style={styles.chatTitle}>ChatAP</Text>
                <Text style={styles.chatOnline}>
                  <Text style={styles.onlineDot}>● </Text>
                  En línea
                </Text>
              </View>
            </View>
            <ChatWindow />
          </View>
        )}

        {activeTab === "descargas" && (
          <ScrollView
            style={styles.scrollTab}
            contentContainerStyle={styles.scrollTabContent}
            showsVerticalScrollIndicator={false}
          >
            <DownloadSection />
            <View style={styles.tabBottomPad} />
          </ScrollView>
        )}

        {activeTab === "accesos" && (
          <ScrollView
            style={styles.scrollTab}
            contentContainerStyle={styles.scrollTabContent}
            showsVerticalScrollIndicator={false}
          >
            <ExternalAccess />
            <View style={styles.tabBottomPad} />
          </ScrollView>
        )}
      </View>

      {/* ── Tab bar ──
          Se oculta cuando el teclado está abierto: de esta forma el chat
          ocupa toda la pantalla y el input queda pegado al teclado,
          exactamente como lo hace WhatsApp. */}
      {!keyboardVisible && (
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.tabIndicator,
                    active && styles.tabIndicatorActive,
                  ]}
                />
                <Ionicons
                  name={tab.icon}
                  size={22}
                  color={active ? Colors.primary : Colors.slate400}
                />
                <Text
                  style={[styles.tabLabel, active && styles.tabLabelActive]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    // FIX status bar: la safe area superior hereda este color.
    // Al igualarlo al navbar (blanco) desaparece el corte visual.
    backgroundColor: Colors.white,
  },

  /* ── Navbar ── */
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate200,
    paddingHorizontal: Spacing[4],
    height: 56,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  brandIcon: {
    width: 36,
    height: 36,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  brandIconText: {
    color: Colors.white,
    fontWeight: Typography.bold as any,
    fontSize: Typography.sm,
  },
  brandName: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold as any,
    color: Colors.slate800,
    lineHeight: 17,
  },
  brandSub: {
    fontSize: Typography.xs,
    color: Colors.slate500,
    lineHeight: 14,
  },
  adminLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
  },
  adminLinkText: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontWeight: Typography.medium as any,
  },

  /* ── Área principal ── */
  content: {
    flex: 1,
    // paddingBottom se aplica dinámicamente en el componente
  },

  /* Chat ocupa todo el alto disponible */
  chatScreen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  chatHeader: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  chatAvatar: {
    width: 32,
    height: 32,
    backgroundColor: Colors.primaryMid,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  chatAvatarText: {
    color: Colors.white,
    fontWeight: Typography.semibold as any,
    fontSize: Typography.xs,
  },
  chatTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold as any,
    color: Colors.white,
  },
  chatOnline: {
    fontSize: Typography.xs,
    color: "rgba(191,219,254,1)",
  },
  onlineDot: {
    color: Colors.accent,
  },

  /* Tabs scrolleables */
  scrollTab: {
    flex: 1,
  },
  scrollTabContent: {
    padding: Spacing[4],
  },
  tabBottomPad: {
    height: Spacing[4],
  },

  /* ── Tab bar inferior ── */
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.slate200,
    height: 64,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    top: 0,
    width: 28,
    height: 2,
    borderRadius: Radius.full,
    backgroundColor: "transparent",
  },
  tabIndicatorActive: {
    backgroundColor: Colors.primary,
  },
  tabLabel: {
    fontSize: 10,
    color: Colors.slate400,
    fontWeight: Typography.medium as any,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.semibold as any,
  },
});