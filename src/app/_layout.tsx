import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  useFonts,
} from '@expo-google-fonts/geist';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { ToastProvider } from '../components/common/Toast';
import { useColors, useColorScheme } from '../constants/theme';
import { AuthProvider } from '../context/AuthContext';

// la splash queda hasta que Geist esté cargada: sin esto el primer cuadro sale
// con la fuente del sistema y salta al cambiar
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const C = useColors();
  const dark = useColorScheme() === 'dark';
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    GeistMono_500Medium,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(C.canvas);
  }, [C]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    // La sesión se lee del almacenamiento, así que el provider va en la raíz:
    // el login y el panel tienen que ver el mismo usuario.
    <AuthProvider>
      {/* en la raíz: el chat, el login y el panel usan el mismo aviso */}
      <ToastProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.canvas },
        }}
      >
        {/* el title va acá: es lo que llena el <title> que maneja expo-router */}
        <Stack.Screen
          name="index"
          options={{ title: 'ChatAP · Asistente virtual de trámites' }}
        />
        <Stack.Screen name="admin" options={{ title: 'ChatAP · Administración' }} />
        <Stack.Screen name="login" options={{ title: 'ChatAP · Iniciar sesión' }} />
        <Stack.Screen
          name="restablecer"
          options={{ title: 'ChatAP · Restablecer contraseña' }}
        />
      </Stack>
      </ToastProvider>
      <StatusBar style={dark ? 'light' : 'dark'} />
    </AuthProvider>
  );
}
