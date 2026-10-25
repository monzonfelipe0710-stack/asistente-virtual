import {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_500Medium,
  AtkinsonHyperlegibleNext_700Bold,
} from "@expo-google-fonts/atkinson-hyperlegible-next";
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  useFonts,
} from "@expo-google-fonts/figtree";
import { IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AvisoNoDisponibleProvider } from "@/components/ui/AvisoNoDisponible";
import { ToastProvider } from "@/components/ui/Toast";
import { useColors, useColorScheme } from "@/constants/theme";
import { AuthProvider } from "@/context/AuthContext";
import { cargarAjustes } from "@/lib/accesibilidad";

// La splash queda hasta que Geist esté cargada: sin esto el primer cuadro sale
// con la fuente del sistema y salta al cambiar.
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Raíz de la app: fuentes, sesión y avisos. Debajo hay tres zonas:
 * - (ciudadano)  el asistente, las descargas y los accesos, con menú lateral.
 * - (publico)    el login, la recuperación y el restablecimiento de contraseña.
 * - admin        el panel interno; su layout decide quién entra.
 */
export default function RootLayout() {
  const C = useColors();
  const oscuro = useColorScheme() === "dark";
  const [fuentesListas, errorDeFuentes] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    IBMPlexMono_500Medium,
    AtkinsonHyperlegibleNext_400Regular,
    AtkinsonHyperlegibleNext_500Medium,
    AtkinsonHyperlegibleNext_700Bold,
  });
  const listo = fuentesListas || !!errorDeFuentes;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(C.canvas);
  }, [C.canvas]);

  useEffect(() => {
    if (listo) SplashScreen.hideAsync().catch(() => {});
  }, [listo]);

  useEffect(() => {
    cargarAjustes();
  }, []);

  if (!listo) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ToastProvider>
          <AvisoNoDisponibleProvider>
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.canvas } }}
          >
            {/* El title llena el <title> de la pestaña en web. */}
            <Stack.Screen name="(ciudadano)" />
            <Stack.Screen name="(publico)/login" options={{ title: "ChatAP · Iniciar sesión" }} />
            <Stack.Screen
              name="(publico)/recuperar"
              options={{ title: "ChatAP · Recuperar contraseña" }}
            />
            <Stack.Screen
              name="(publico)/restablecer"
              options={{ title: "ChatAP · Restablecer contraseña" }}
            />
            <Stack.Screen name="perfil" options={{ title: "ChatAP · Mi perfil" }} />
            <Stack.Screen
              name="admin"
              options={{ title: "ChatAP · Administración", gestureEnabled: false }}
            />
          </Stack>
          <StatusBar style={oscuro ? "light" : "dark"} />
          </AvisoNoDisponibleProvider>
        </ToastProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
