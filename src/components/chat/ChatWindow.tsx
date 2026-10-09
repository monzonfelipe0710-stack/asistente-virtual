import { memo, useCallback, useEffect } from "react";
import { FlatList, Keyboard, StyleSheet, View, type ListRenderItemInfo } from "react-native";

import { ChatBotAvatar } from "@/components/avatar/ChatBotAvatar";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { QuickReplies } from "./QuickReplies";
import { TypingIndicator } from "./TypingIndicator";
import { Text } from "@/components/ui/Text";
import { Spacing, Type, Weight, useColors } from "@/constants/theme";
import type { ChatMessage } from "@/data/mockMessages";
import { useChat } from "@/hooks/useChat";

const keyExtractor = (mensaje: ChatMessage) => String(mensaje.id);

/**
 * La conversación. Vacía, muestra la bienvenida con las sugerencias; con
 * mensajes, la lista pegada a la barra de escritura.
 */
function ChatWindowBase({
  onConversationStart,
  greetingName,
  bottomInset,
}: {
  /** Avisa cuándo la conversación empieza o se vacía. */
  onConversationStart: (empezo: boolean) => void;
  /** Nombre de la persona con sesión, para el saludo. */
  greetingName?: string;
  /** Aire debajo de la barra: la barra del sistema, o 12 con el teclado arriba. */
  bottomInset: number;
}) {
  const C = useColors();
  const { messages, isTyping, listRef, send } = useChat();

  const empezo = messages.length > 0 || isTyping;
  const ultimoId = messages[messages.length - 1]?.id;
  const saludo = greetingName ? `Hola, ${greetingName.split(/[\s@]/)[0]}` : "Hola";

  useEffect(() => {
    onConversationStart(empezo);
  }, [empezo, onConversationStart]);

  // requestAnimationFrame: sin esperar al cuadro siguiente, el scroll usa el
  // layout viejo y se queda corto.
  const irAlFinal = useCallback(
    () => requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true })),
    [listRef]
  );

  // keyboardDidShow y no onLayout: llega con el teclado ya arriba y el layout estable.
  useEffect(() => {
    const suscripcion = Keyboard.addListener("keyboardDidShow", irAlFinal);
    return () => suscripcion.remove();
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
    <View style={[styles.chat, { backgroundColor: C.canvas }]}>
      {empezo ? (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={dibujarMensaje}
          style={styles.lista}
          contentContainerStyle={styles.contenidoDeLaLista}
          onContentSizeChange={irAlFinal}
          // Al subir el teclado la lista se achica: vuelve al final en vez de dejarlo tapado.
          onLayout={irAlFinal}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <View style={styles.bienvenida}>
          <ChatBotAvatar size={56} tight />
          <View style={styles.saludos}>
            <Text style={[Type.lead, { color: C.ink2 }]}>{saludo}</Text>
            <Text style={[styles.pregunta, { color: C.ink }]}>¿En qué te ayudo hoy?</Text>
          </View>
        </View>
      )}

      {!empezo && <QuickReplies onSelect={send} />}

      <View style={{ paddingBottom: bottomInset }}>
        <ChatInput onSend={send} />
      </View>
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
  contenidoDeLaLista: {
    flexGrow: 1,
    justifyContent: "flex-end",
    // El primer mensaje ya trae sus 24 de margen arriba.
    paddingBottom: Spacing[6],
  },
  bienvenida: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[5],
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[6],
  },
  saludos: {
    alignItems: "center",
    gap: Spacing[2],
  },
  pregunta: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: Weight.semibold,
    letterSpacing: -0.56,
    textAlign: "center",
  },
});
