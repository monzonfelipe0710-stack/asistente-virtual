import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal as RNModal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type GestureResponderHandlers,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Motion, Radius, Shadows, Spacing, useColors } from "@/compartido/constantes/theme";
import { useKeyboardHeight } from "@/compartido/hooks/useKeyboardHeight";

// Distancia o velocidad hacia abajo a partir de la cual soltar la hoja la cierra.
const DISTANCIA_PARA_CERRAR = 100;
const VELOCIDAD_PARA_CERRAR = 0.8;

// La hoja se arrastra desde la manija y el título siempre, y desde el contenido cuando su lista
// está arriba de todo (como las hojas de iOS): así no le gana al scroll del contenido.
// Cada lista dentro de una hoja avisa su desplazamiento con useAlDesplazarEnLaHoja.
interface Arrastre {
  manejadores: GestureResponderHandlers;
  alDesplazar: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const ArrastreDeLaHoja = createContext<Arrastre | undefined>(undefined);

export function useArrastreDeLaHoja() {
  return useContext(ArrastreDeLaHoja)?.manejadores;
}

export function useAlDesplazarEnLaHoja() {
  return useContext(ArrastreDeLaHoja)?.alDesplazar;
}

// Lista para usar directo dentro de una hoja: avisa su desplazamiento para el arrastre.
export function ListaDeLaHoja(props: ScrollViewProps) {
  const alDesplazar = useAlDesplazarEnLaHoja();
  return <ScrollView scrollEventThrottle={16} onScroll={alDesplazar} {...props} />;
}

function useArrastrarParaCerrar(onClose: () => void, alturaDePantalla: number) {
  const [desplazamiento] = useState(() => new Animated.Value(0));
  const contenidoArriba = useRef(true);

  const alDesplazar = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    contenidoArriba.current = e.nativeEvent.contentOffset.y <= 0;
  }, []);

  const respuestas = useMemo(() => {
    function volver() {
      Animated.spring(desplazamiento, { toValue: 0, bounciness: 4, useNativeDriver: true }).start();
    }

    const comun = {
      onPanResponderMove: (_: unknown, g: { dy: number }) => desplazamiento.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_: unknown, g: { dy: number; vy: number }) => {
        if (g.dy > DISTANCIA_PARA_CERRAR || g.vy > VELOCIDAD_PARA_CERRAR) {
          Animated.timing(desplazamiento, {
            toValue: alturaDePantalla,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start(onClose);
          return;
        }
        volver();
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: volver,
    };

    return {
      // Manija y título: cualquier arrastre hacia abajo.
      manija: PanResponder.create({
        ...comun,
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      }),
      // Toda la hoja, en la fase de captura: solo si el contenido está arriba de todo, así le
      // quita el gesto a la lista antes de que esta se desplace.
      hoja: PanResponder.create({
        ...comun,
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_, g) =>
          contenidoArriba.current && g.dy > 8 && g.dy > Math.abs(g.dx) * 1.5,
      }),
    };
  }, [desplazamiento, onClose, alturaDePantalla]);

  return {
    desplazamiento,
    manejadores: respuestas.manija.panHandlers,
    manejadoresDeLaHoja: respuestas.hoja.panHandlers,
    alDesplazar,
  };
}

export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { height: alturaDePantalla } = useWindowDimensions();
  const teclado = useKeyboardHeight();
  const alzar = Platform.OS === "android" ? teclado : 0;
  const [entrada] = useState(() => new Animated.Value(0));
  const { desplazamiento, manejadores, manejadoresDeLaHoja, alDesplazar } = useArrastrarParaCerrar(
    onClose,
    alturaDePantalla
  );
  const arrastre = useMemo(() => ({ manejadores, alDesplazar }), [manejadores, alDesplazar]);

  useEffect(() => {
    if (!open) return;
    desplazamiento.setValue(0);
    entrada.setValue(0);
    Animated.timing(entrada, {
      toValue: 1,
      duration: Motion.sheet,
      easing: Easing.bezier(...Motion.bezier),
      useNativeDriver: true,
    }).start();
  }, [open, entrada, desplazamiento]);

  return (
    <RNModal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: C.scrim, opacity: entrada }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
      </Animated.View>

      <Animated.View
        {...manejadoresDeLaHoja}
        style={[
          styles.sheet,
          Shadows.sheet,
          {
            backgroundColor: C.canvas,
            bottom: alzar,
            maxHeight: alzar > 0 ? alturaDePantalla - alzar - insets.top - Spacing[4] : "93%",
            paddingBottom: alzar > 0 ? Spacing[3] : Math.max(insets.bottom, Spacing[5]) + Spacing[2],
            transform: [
              { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [700, 0] }) },
              { translateY: desplazamiento },
            ],
          },
        ]}
      >
        <View style={styles.zonaDeArrastre} {...manejadores}>
          <View style={[styles.handle, { backgroundColor: C.borderStrong }]} />
        </View>
        <ArrastreDeLaHoja.Provider value={arrastre}>{children}</ArrastreDeLaHoja.Provider>
      </Animated.View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopLeftRadius: Platform.OS === "ios" ? Radius["3xl"] : 32,
    borderTopRightRadius: Platform.OS === "ios" ? Radius["3xl"] : 32,
    paddingHorizontal: Spacing[5],
    gap: Spacing[4],
  },
  // Llega hasta el título (absorbe el gap) para que no quede un hueco sin arrastre.
  zonaDeArrastre: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingTop: Spacing[2],
    paddingBottom: Spacing[4],
    marginBottom: -Spacing[4],
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
  },
});
