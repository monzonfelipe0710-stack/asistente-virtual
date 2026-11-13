import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, type ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AvisoNoDisponibleProvider } from "@/compartido/ui/AvisoNoDisponible";
import { ToastProvider } from "@/compartido/ui/Toast";
import { ArchivosDeFuentes, useColors, useColorScheme } from "@/compartido/constantes/theme";
import { AuthProvider } from "@/compartido/sesion/AuthContext";
import { cargarAjustes } from "@/compartido/lib/accesibilidad";

SplashScreen.preventAutoHideAsync().catch(() => {});

function usePrepararApp() {
  const C = useColors();
  const [fuentesListas, errorDeFuentes] = useFonts(ArchivosDeFuentes);
  const listo = fuentesListas || !!errorDeFuentes;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(C.canvas);
  }, [C.canvas]);

  useEffect(() => {
    if (listo) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [listo]);

  useEffect(() => {
    cargarAjustes();
  }, []);

  return listo;
}

function Proveedores({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ToastProvider>
          <AvisoNoDisponibleProvider>{children}</AvisoNoDisponibleProvider>
        </ToastProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function Rutas() {
  const C = useColors();
  const oscuro = useColorScheme() === "dark";

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.canvas } }}>
        <Stack.Screen name="(ciudadano)" />
        <Stack.Screen name="(publico)/login" options={{ title: "ChatAP · Iniciar sesión" }} />
        <Stack.Screen name="(publico)/recuperar" options={{ title: "ChatAP · Recuperar contraseña" }} />
        <Stack.Screen name="(publico)/restablecer" options={{ title: "ChatAP · Restablecer contraseña" }} />
        <Stack.Screen
          name="(publico)/cambiar-password"
          options={{ title: "ChatAP · Cambiar contraseña", gestureEnabled: false }}
        />
        <Stack.Screen name="perfil" options={{ title: "ChatAP · Mi perfil" }} />
        <Stack.Screen name="admin" options={{ title: "ChatAP · Administración", gestureEnabled: false }} />
      </Stack>
      <StatusBar style={oscuro ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  const listo = usePrepararApp();

  if (!listo) {
    return null;
  }

  return (
    <Proveedores>
      <Rutas />
    </Proveedores>
  );
}
