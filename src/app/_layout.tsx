import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { useColors } from '../constants/theme';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  const C = useColors();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(C.white);
  }, [C]);

  return (
    // La sesión se lee del almacenamiento, así que el provider va en la raíz:
    // el login y el panel tienen que ver el mismo usuario.
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.white },
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
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
