import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Palette,
  Radius,
  Spacing,
  Typography,
  useColors,
} from "../../constants/theme";
import type { ChatMessage } from "../../data/mockMessages";
import { useChat } from "../../hooks/useChat";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import QuickReplies from "./QuickReplies";
import TypingIndicator from "./TypingIndicator";

const GREETINGS = [
  "¿En qué puedo ayudarte?",
  "¿Cuándo digas, empezamos?",
  "¿Qué trámite estás buscando?",
  "Contame tu consulta",
  "¿Por dónde arrancamos?",
];

const keyExtractor = (item: ChatMessage) => String(item.id);
const renderItem = ({ item }: ListRenderItemInfo<ChatMessage>) => (
  <MessageBubble message={item} />
);

interface Props {
  onConversationStart?: (started: boolean) => void;
}

function ChatWindow({ onConversationStart }: Props) {
  const { messages, isTyping, listRef, send } = useChat();

  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const started = messages.some((m) => m.type === "user");

  // una frase al azar por sesión (y por "Nuevo chat", que remonta el componente).
  // El sorteo va en effect, no en el estado inicial: el prerender estático y el
  // cliente elegirían frases distintas y eso rompe la hidratación (React #418).
  const [greeting, setGreeting] = useState(GREETINGS[0]);
  useEffect(() => {
    setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  }, []);
  // acá y no en QuickReplies: la lista reserva espacio para los chips
  const [showQuick, setShowQuick] = useState(true);
  const hideQuick = useCallback(() => setShowQuick(false), []);

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

  // la altura real del bloque flotante: crece con el input y encoge sin los chips
  const [dockHeight, setDockHeight] = useState(0);
  const measureDock = useCallback(
    (e: LayoutChangeEvent) => setDockHeight(e.nativeEvent.layout.height),
    []
  );

  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      { paddingTop: insets.top + 68, paddingBottom: dockHeight },
      messages.length === 0 && styles.listContentEmpty,
    ],
    [styles, insets.top, messages.length, dockHeight]
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={keyExtractor}
        style={styles.list}
        renderItem={renderItem}
        contentContainerStyle={listContentStyle}
        onContentSizeChange={scrollToEnd}
        // al subir el teclado la lista se achica: vuelve al final en vez de dejarlo tapado
        onLayout={scrollToEnd}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyAvatar}>
              <Text style={styles.emptyAvatarText}>AP</Text>
            </View>
            <Text style={styles.emptyTitle}>{greeting}</Text>
          </View>
        }
        ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {/* fuera del flujo: chips e input flotan y los mensajes pasan por debajo */}
      <View style={styles.dock} onLayout={measureDock} pointerEvents="box-none">
        {showQuick && <QuickReplies onSelect={send} onDismiss={hideQuick} />}
        <ChatInput onSend={send} />
      </View>
    </View>
  );
}

// memo: el padre re-renderiza con cada evento de teclado; acá cuelga toda la lista
export default memo(ChatWindow);

const createStyles = (C: Palette) =>
  StyleSheet.create({
    list: {
      flex: 1,
    },
    dock: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      // entra en la medición, así el chat respeta este aire haya chips o no
      paddingTop: Spacing[2],
    },
    container: {
      flex: 1,
      backgroundColor: C.white,
    },
    listContent: {
      flexGrow: 1,
      justifyContent: "flex-end",
    },
    listContentEmpty: {
      justifyContent: "center",
    },
    empty: {
      alignItems: "center",
      paddingHorizontal: Spacing[6],
      gap: Spacing[3],
      // lo despega del centro exacto hacia arriba
      marginBottom: Spacing[10],
    },
    emptyAvatar: {
      width: 56,
      height: 56,
      borderRadius: Radius.full,
      backgroundColor: C.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: Spacing[2],
    },
    emptyAvatarText: {
      color: "#ffffff",
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
    },
    emptyTitle: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: Typography.bold,
      color: C.slate800,
      textAlign: "center",
    },
  });
