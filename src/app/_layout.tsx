import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Appearance } from 'react-native';
import 'react-native-reanimated';
import { useColors } from '../constants/theme';

// La app arranca siempre en claro: el tema lo cambia el botón del menú, no el teléfono.
Appearance.setColorScheme('light');

export default function RootLayout() {
  const C = useColors();

  // la franja bajo la pantalla es la vista raíz nativa, no la pantalla: se pinta aparte
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
        <Stack.Screen name="index" />
        <Stack.Screen name="admin" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
