import { memo, useCallback, useEffect, useMemo } from "react";
import {
  FlatList,
  Keyboard,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { Text } from "../common/Text";
import { Palette, Spacing, Type, useColors } from "../../constants/theme";
import type { ChatMessage } from "../../data/mockMessages";
import { useChat } from "../../hooks/useChat";
import ChatBotAvatar from "../ChatBotAvatar";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import QuickReplies from "./QuickReplies";
import TypingIndicator from "./TypingIndicator";

const keyExtractor = (item: ChatMessage) => String(item.id);

interface Props {
  onConversationStart?: (started: boolean) => void;
  /** Nombre del usuario con sesión, para el saludo. */
  greetingName?: string;
  /** Aire debajo de la barra de mensaje: la barra del sistema o 12 con teclado. */
  bottomInset: number;
}

function ChatWindow({ onConversationStart, greetingName, bottomInset }: Props) {
  const { messages, isTyping, listRef, send } = useChat();

  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const started = messages.length > 0 || isTyping;
  const lastId = messages[messages.length - 1]?.id;

  const greeting = greetingName
    ? `Hola, ${greetingName.split(/[\s@]/)[0]}`
    : "Hola";

  useEffect(() => {
    onConversationStart?.(started);
  }, [started, onConversationStart]);

  // rAF: sin esperar al frame siguiente el scroll usa el layout viejo y queda corto
  const scrollToEnd = useCallback(
    () =>
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true })
      ),
    [listRef]
  );

  // keyboardDidShow, no onLayout: llega con el teclado ya arriba y el layout estable
  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", scrollToEnd);
    return () => sub.remove();
  }, [scrollToEnd]);

  // solo el último mensaje se escribe letra a letra: los anteriores ya se leyeron,
  // y FlatList puede volver a montarlos al desplazar
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatMessage>) => (
      <MessageBubble message={item} typewriter={item.id === lastId} />
    ),
    [lastId]
  );

  return (
    <View style={styles.container}>
      {started ? (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={keyExtractor}
          style={styles.list}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={scrollToEnd}
          // al subir el teclado la lista se achica: vuelve al final en vez de dejarlo tapado
          onLayout={scrollToEnd}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <View style={styles.welcome}>
          <ChatBotAvatar size={56} tight />
          <View style={styles.welcomeText}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.welcomeTitle}>¿En qué te ayudo hoy?</Text>
          </View>
        </View>
      )}

      {!started && <QuickReplies onSelect={send} />}

      <View style={{ paddingBottom: bottomInset }}>
        <ChatInput onSend={send} />
      </View>
    </View>
  );
}

// memo: el padre re-renderiza con cada evento de teclado; acá cuelga toda la lista
export default memo(ChatWindow);

const createStyles = (C: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.canvas,
    },
    list: {
      flex: 1,
    },
    listContent: {
      flexGrow: 1,
      justifyContent: "flex-end",
      // el primer mensaje ya trae sus 24 de margen arriba
      paddingTop: 0,
      paddingBottom: Spacing[6],
    },
    welcome: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing[5],
      paddingHorizontal: Spacing[5],
      paddingBottom: Spacing[6],
    },
    welcomeText: {
      alignItems: "center",
      gap: Spacing[2],
    },
    greeting: {
      ...Type.lead,
      color: C.ink2,
    },
    welcomeTitle: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "600",
      letterSpacing: -0.56,
      color: C.ink,
      textAlign: "center",
    },
  });
