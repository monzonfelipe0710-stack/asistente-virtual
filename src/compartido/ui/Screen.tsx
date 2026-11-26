import { HeaderHeightContext } from "expo-router/react-navigation";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { Platform, ScrollView, useWindowDimensions, View, type ScrollViewInstance, type ScrollViewProps, type ViewInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing, useColors } from "@/compartido/constantes/theme";
import { useKeyboardHeight } from "@/compartido/hooks/useKeyboardHeight";
import { useAjustes } from "@/compartido/lib/accesibilidad";

const AIRE_SOBRE_EL_TECLADO = 12;

type AvisarFoco = (campo: ViewInstance | null) => void;

const FocoContext = createContext<AvisarFoco>(() => {});

export function useAvisarFoco(): AvisarFoco {
  return useContext(FocoContext);
}

// Lleva la pantalla al principio, o al principio de una vista (por ejemplo, una lista) dejándola
// debajo del encabezado flotante. La usan los cambios de página para no quedar abajo de todo.
type VolverArriba = (hasta?: ViewInstance | null) => void;

const VolverArribaContext = createContext<VolverArriba>(() => {});

export function useVolverArriba(): VolverArriba {
  return useContext(VolverArribaContext);
}

export function ScrollConTeclado({
  children,
  conEspacio = true,
  ...rest
}: ScrollViewProps & { conEspacio?: boolean }) {
  const teclado = useKeyboardHeight();
  const { height: alturaDeVentana } = useWindowDimensions();
  const scroll = useRef<ScrollViewInstance>(null);
  const desplazamiento = useRef(0);
  const enfocado = useRef<ViewInstance | null>(null);
  const altoDelEncabezado = useContext(HeaderHeightContext) ?? 0;
  const { reducirAnimaciones } = useAjustes();

  const subirCampo = useCallback(() => {
    const campo = enfocado.current;
    if (!campo || teclado === 0) return;
    campo.measureInWindow((_x, y, _ancho, alto) => {
      const tapado = y + alto - (alturaDeVentana - teclado - AIRE_SOBRE_EL_TECLADO);
      if (tapado > 0) {
        scroll.current?.scrollTo({ y: desplazamiento.current + tapado, animated: true });
      }
    });
  }, [teclado, alturaDeVentana]);

  useEffect(() => {
    subirCampo();
  }, [subirCampo]);

  const avisarFoco = useCallback<AvisarFoco>(
    (campo) => {
      enfocado.current = campo;
      subirCampo();
    },
    [subirCampo]
  );

  const volverArriba = useCallback<VolverArriba>(
    (hasta) => {
      const lista = scroll.current;
      const animated = !reducirAnimaciones;
      if (!lista) return;
      if (!hasta) {
        lista.scrollTo({ y: 0, animated });
        return;
      }
      hasta.measureInWindow((_x, yDeLaVista) => {
        lista.measureInWindow((_xl, yDeLaLista) => {
          const destino = desplazamiento.current + yDeLaVista - yDeLaLista - altoDelEncabezado - Spacing[2];
          lista.scrollTo({ y: Math.max(0, destino), animated });
        });
      });
    },
    [altoDelEncabezado, reducirAnimaciones]
  );

  return (
    <FocoContext.Provider value={avisarFoco}>
      <VolverArribaContext.Provider value={volverArriba}>
        <ScrollView
          ref={scroll}
          onScroll={(e) => {
            desplazamiento.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...rest}
        >
          {children}
          {conEspacio && Platform.OS === "ios" && teclado > 0 && <View style={{ height: teclado }} />}
        </ScrollView>
      </VolverArribaContext.Provider>
    </FocoContext.Provider>
  );
}

export function Screen({ children }: { children: React.ReactNode }) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const altoDelEncabezado = useContext(HeaderHeightContext) ?? 0;

  return (
    <ScrollConTeclado
      style={{ flex: 1, backgroundColor: C.canvas }}
      contentContainerStyle={{
        paddingHorizontal: Spacing[5],
        paddingTop: altoDelEncabezado + Spacing[1],
        paddingBottom: insets.bottom + Spacing[12],
      }}
    >
      {children}
    </ScrollConTeclado>
  );
}
