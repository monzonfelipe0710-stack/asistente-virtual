import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  useFonts,
} from "@expo-google-fonts/geist";
import { GeistMono_500Medium } from "@expo-google-fonts/geist-mono";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ToastProvider } from "@/components/ui/Toast";
import { useColors, useColorScheme } from "@/constants/theme";
import { AuthProvider } from "@/context/AuthContext";

// La splash queda hasta que Geist esté cargada: sin esto el primer cuadro sale
// con la fuente del sistema y salta al cambiar.
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Raíz de la app: fuentes, sesión y avisos. Debajo hay tres zonas:
 * - (ciudadano)  el asistente, las descargas y los accesos, con menú lateral.
 * - (publico)    el login y el restablecimiento de contraseña.
 * - admin        el panel interno; su layout decide quién entra.
 */
export default function RootLayout() {
  const C = useColors();
  const oscuro = useColorScheme() === "dark";
  const [fuentesListas, errorDeFuentes] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    GeistMono_500Medium,
  });
  const listo = fuentesListas || !!errorDeFuentes;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(C.canvas);
  }, [C.canvas]);

  useEffect(() => {
    if (listo) SplashScreen.hideAsync().catch(() => {});
  }, [listo]);

  if (!listo) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ToastProvider>
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.canvas } }}
          >
            {/* El title llena el <title> de la pestaña en web. */}
            <Stack.Screen name="(ciudadano)" />
            <Stack.Screen name="(publico)/login" options={{ title: "ChatAP · Iniciar sesión" }} />
            <Stack.Screen
              name="(publico)/restablecer"
              options={{ title: "ChatAP · Restablecer contraseña" }}
            />
            <Stack.Screen name="admin" options={{ title: "ChatAP · Administración" }} />
          </Stack>
          <StatusBar style={oscuro ? "light" : "dark"} />
        </ToastProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
