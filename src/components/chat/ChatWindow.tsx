import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBotAvatar } from "@/components/avatar/ChatBotAvatar";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { QuickReplies } from "./QuickReplies";
import { SugerenciaDeIngreso } from "./SugerenciaDeIngreso";
import { TypingIndicator } from "./TypingIndicator";
import { Btn } from "@/components/ui/Btn";
import { Icon } from "@/components/ui/Icon";
import { Plegable } from "@/components/ui/Plegable";
import { Text } from "@/components/ui/Text";
import { Motion, Radius, Size, Spacing, Type, Weight, useColors } from "@/constants/theme";
import type { ChatMessage } from "@/data/mockMessages";
import { useChat } from "@/hooks/useChat";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { useAjustes } from "@/lib/accesibilidad";

const keyExtractor = (mensaje: ChatMessage) => String(mensaje.id);

/** Aviso de que la consulta no llegó, con el botón para reintentarla. */
function ErrorDeEnvio({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  const C = useColors();
  return (
    <View style={styles.errorFila}>
      <View
        style={[styles.error, { backgroundColor: C.badBg, borderColor: C.bad }]}
        accessibilityRole="alert"
      >
        <View style={styles.errorCabecera}>
          <Icon name="wifiOff" size={28} color={C.bad} />
          <View style={styles.errorTexto}>
            <Text style={[Type.bodyStrong, { color: C.ink }]}>No se pudo enviar</Text>
            <Text style={[Type.meta, { color: C.ink }]}>{mensaje}</Text>
          </View>
        </View>
        <Btn label="Reintentar" icon="sync" size="md" onPress={onReintentar} />
      </View>
    </View>
  );
}

/**
 * La conversación. Vacía, muestra la bienvenida con las sugerencias; con
 * mensajes, la lista arranca arriba, ocupa toda la pantalla y pasa por detrás del encabezado,
 * de la barra de escritura y del teclado.
 */
function ChatWindowBase() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const alturaDelTeclado = useKeyboardHeight();
  const { reducirAnimaciones } = useAjustes();
  const { messages, isTyping, send, fallo, reintentar, detener } = useChat();
  const [escribiendo, setEscribiendo] = useState(false);
  const [altoDeLaBarra, setAltoDeLaBarra] = useState(Size.composer + 8);
  const listRef = useRef<FlatList>(null);

  const empezo = messages.length > 0 || isTyping || !!fallo;
  const ultimoId = messages[messages.length - 1]?.id;
  const arriba = insets.top + Size.header;

  // Con el teclado arriba, el borde inferior lo pone el teclado y no la barra del sistema.
  const espacioInferior =
    alturaDelTeclado > 0 ? alturaDelTeclado + Spacing[3] : Math.max(insets.bottom, Spacing[3]);

  // La barra sube y baja con la misma curva que el teclado en vez de saltar.
  const [espacioAnimado] = useState(() => new Animated.Value(espacioInferior));
  useEffect(() => {
    Animated.timing(espacioAnimado, {
      toValue: espacioInferior,
      duration: reducirAnimaciones ? 0 : Motion.sheet,
      easing: Easing.bezier(...Motion.bezier),
      useNativeDriver: false, // bottom es de layout
    }).start();
  }, [espacioInferior, reducirAnimaciones, espacioAnimado]);

  // requestAnimationFrame: sin esperar al cuadro siguiente, el scroll usa el
  // layout viejo y se queda corto. El segundo intento llega cuando el teclado
  // terminó de subir.
  const irAlFinal = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), Motion.sheet + 60);
  }, []);

  // keyboardDidShow: llega con el teclado ya arriba y el layout estable.
  useEffect(() => {
    const alSubir = Keyboard.addListener("keyboardDidShow", () => {
      setEscribiendo(true);
      irAlFinal();
    });
    // Android puede esconder el teclado con el botón atrás sin soltar el foco.
    const alBajar = Keyboard.addListener("keyboardDidHide", () => setEscribiendo(false));
    return () => {
      alSubir.remove();
      alBajar.remove();
    };
  }, [irAlFinal]);

  // Solo el último mensaje se escribe letra a letra: los anteriores ya se leyeron
  // y la lista puede volver a montarlos al desplazarse.
  const dibujarMensaje = useCallback(
    ({ item }: ListRenderItemInfo<ChatMessage>) => (
      <MessageBubble message={item} escribiendo={item.id === ultimoId} />
    ),
    [ultimoId]
  );

  return (
    <View style={styles.chat}>
      {empezo ? (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={dibujarMensaje}
          style={styles.lista}
          contentContainerStyle={[
            // El último mensaje queda un poco por encima de la barra, no detrás.
            { paddingTop: arriba, paddingBottom: espacioInferior + altoDeLaBarra + Spacing[5] },
          ]}
          onContentSizeChange={irAlFinal}
          ListFooterComponent={
            isTyping ? (
              <TypingIndicator />
            ) : fallo ? (
              <ErrorDeEnvio mensaje={fallo} onReintentar={reintentar} />
            ) : null
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        // Tocar fuera de la barra y de las sugerencias baja el teclado. En la
        // lista lo hace `keyboardShouldPersistTaps="handled"`.
        <Animated.View
          style={[
            styles.lista,
            { paddingTop: arriba, paddingBottom: Animated.add(espacioAnimado, altoDeLaBarra) },
          ]}
        >
          <Pressable style={styles.lista} onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.bienvenida}>
              <ChatBotAvatar size={56} />
              <Text style={[styles.pregunta, { color: C.ink }]}>¿En qué te ayudo hoy?</Text>
              <Plegable abierto={!escribiendo}>
                <Text style={[Type.lead, styles.bajada, { color: C.ink2 }]}>
                  Consultá por trámites de Recursos Humanos.
                </Text>
              </Plegable>
            </View>
            {/* Al escribir no hay lugar: las filas se pliegan y quedan solo la cara y la frase. */}
            <Plegable abierto={!escribiendo}>
              <SugerenciaDeIngreso />
              <QuickReplies onSelect={send} />
            </Plegable>
          </Pressable>
        </Animated.View>
      )}

      <Animated.View style={[styles.abajo, { bottom: espacioAnimado }]}>
        <View onLayout={(e) => setAltoDeLaBarra(e.nativeEvent.layout.height)}>
          <ChatInput
            onSend={send}
            onStop={detener}
            onFocusChange={setEscribiendo}
            disabled={isTyping}
          />

          <Plegable abierto={!escribiendo}>
            <Text style={[styles.aviso, { color: C.ink2 }]}>
              ChatAP puede equivocarse. Confirmá en Mesa de Entradas.
            </Text>
          </Plegable>
        </View>
      </Animated.View>
    </View>
  );
}

// memo: la pantalla se vuelve a dibujar con cada evento del teclado y acá cuelga toda la lista.
export const ChatWindow = memo(ChatWindowBase);

const styles = StyleSheet.create({
  chat: {
    flex: 1,
  },
  lista: {
    flex: 1,
  },
  abajo: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  bienvenida: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[4],
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[6],
  },
  pregunta: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: Weight.bold,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  bajada: {
    textAlign: "center",
    maxWidth: 300,
  },
  aviso: {
    marginTop: Spacing[2],
    paddingHorizontal: Spacing[5],
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center",
  },
  errorFila: {
    marginTop: Spacing[6],
    paddingHorizontal: Spacing[5],
  },
  error: {
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius["2xl"],
    borderWidth: 1,
  },
  errorCabecera: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing[3],
  },
  errorTexto: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
