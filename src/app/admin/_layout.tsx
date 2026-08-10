import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography } from "../../constants/theme";
import { AppDataProvider } from "../../context/AppDataContext";

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "grid-outline",
  usuarios: "people-outline",
  conocimiento: "library-outline",
  siged: "document-text-outline",
};

const TAB_LABELS: Record<string, string> = {
  index: "Dashboard",
  usuarios: "Usuarios",
  conocimiento: "Conocimiento",
  siged: "SIGED",
};

export default function AdminLayout() {
  return (
    <AppDataProvider>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: true,
          headerStyle: { backgroundColor: Colors.white },
          headerTitleStyle: {
            fontSize: Typography.base,
            fontWeight: Typography.semibold,
            color: Colors.slate800,
          },
          headerShadowVisible: true,
          tabBarStyle: {
            backgroundColor: Colors.white,
            borderTopColor: Colors.slate200,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.slate400,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: Typography.medium,
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={TAB_ICONS[route.name] ?? "ellipse-outline"}
              size={size}
              color={color}
            />
          ),
          title: TAB_LABELS[route.name] ?? route.name,
        })}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="usuarios" />
        <Tabs.Screen name="conocimiento" />
        <Tabs.Screen name="siged" />
      </Tabs>
    </AppDataProvider>
  );
}