import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { ScrollView, useWindowDimensions, View, type ScrollViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing, useColors } from "@/constants/theme";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";

/** Lo que queda de aire entre el borde de abajo del campo y el borde de arriba del teclado. */
const AIRE_SOBRE_EL_TECLADO = 12;

type AvisarFoco = (campo: View | null) => void;

const FocoContext = createContext<AvisarFoco>(() => {});

/** Lo usan los campos de texto para avisarle a la pantalla que ahora están enfocados. */
export function useAvisarFoco(): AvisarFoco {
  return useContext(FocoContext);
}

/**
 * ScrollView para pantallas con campos de texto. Con el teclado arriba agrega
 * al final un espacio del alto del teclado y desplaza lo justo para que el
 * campo enfocado quede apenas por encima de él; si ya se ve entero, no mueve nada.
 */
export function ScrollConTeclado({ children, ...rest }: ScrollViewProps) {
  const teclado = useKeyboardHeight();
  const { height: alturaDeVentana } = useWindowDimensions();
  const scroll = useRef<ScrollView>(null);
  const desplazamiento = useRef(0);
  const enfocado = useRef<View | null>(null);

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

  // El teclado llega después del foco: recién entonces el contenido es lo bastante largo para desplazarse.
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

  return (
    <FocoContext.Provider value={avisarFoco}>
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
        {teclado > 0 && <View style={{ height: teclado }} />}
      </ScrollView>
    </FocoContext.Provider>
  );
}

/** El fondo de cada pantalla del panel: una sola superficie con 20 de margen lateral. */
export function Screen({ children }: { children: React.ReactNode }) {
  const C = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollConTeclado
      style={{ flex: 1, backgroundColor: C.canvas }}
      contentContainerStyle={{
        paddingHorizontal: Spacing[5],
        paddingTop: Spacing[1],
        paddingBottom: insets.bottom + Spacing[12],
      }}
    >
      {children}
    </ScrollConTeclado>
  );
}
