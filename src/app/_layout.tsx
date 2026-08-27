import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { useColors } from '../constants/theme';

export default function RootLayout() {
  const C = useColors();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(C.white);
  }, [C]);

  return (
    <>
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
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
