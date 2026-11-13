import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBotAvatar } from "@/compartido/avatar/ChatBotAvatar";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { QuickReplies } from "./QuickReplies";
import { SugerenciaDeIngreso } from "./SugerenciaDeIngreso";
import { TypingIndicator } from "./TypingIndicator";
import { Btn } from "@/compartido/ui/Btn";
import { Icon } from "@/compartido/ui/Icon";
import { Plegable } from "@/compartido/ui/Plegable";
import { Text } from "@/compartido/ui/Text";
import { Motion, Radius, Size, Spacing, Type, useColors } from "@/compartido/constantes/theme";
import { useConversacion } from "@/funcionalidades/chat/ChatContext";
import type { ChatMessage } from "@/funcionalidades/chat/tipos";
import { useChat } from "@/funcionalidades/chat/useChat";
import { useKeyboardHeight } from "@/compartido/hooks/useKeyboardHeight";
import { useAjustes } from "@/compartido/lib/accesibilidad";

const keyExtractor = (mensaje: ChatMessage) => String(mensaje.id);

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

function AvisoDeInterrupcion({ onReintentar }: { onReintentar: () => void }) {
  const C = useColors();
  return (
    <View style={styles.interrumpidoFila} accessibilityRole="alert">
      <Text style={[Type.meta, { color: C.ink2 }]}>Respuesta interrumpida.</Text>
      <Btn label="Reintentar" icon="sync" variant="ghost" size="md" onPress={onReintentar} />
    </View>
  );
}

function ChatWindowBase() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const alturaDelTeclado = useKeyboardHeight();
  const { reducirAnimaciones } = useAjustes();
  const { activa, obtener, guardar } = useConversacion();
  const [inicial] = useState(() => obtener(activa)?.mensajes);
  const alCambiar = useCallback(
    (mensajes: ChatMessage[]) => guardar(activa, mensajes),
    [activa, guardar]
  );
  const { messages, isTyping, send, fallo, interrumpido, reintentar, detener } = useChat(inicial, alCambiar);
  const [escribiendo, setEscribiendo] = useState(false);
  const [altoDeLaBarra, setAltoDeLaBarra] = useState(Size.composer + 8);
  const [altoDeLaLista, setAltoDeLaLista] = useState(0);
  const [altoDelPie, setAltoDelPie] = useState(0);
  const [alturas, setAlturas] = useState<Record<number, number>>({});
  const [idFijado, setIdFijado] = useState<number | null>(null);
  const listRef = useRef<FlatList>(null);
  const ultimosMensajes = useRef(messages);
  const idMaximoInicial = useRef(Math.max(0, ...(inicial ?? []).map((m) => m.id)));
  const restaurando = useRef(!!inicial?.length);

  const empezo = messages.length > 0 || isTyping || !!fallo;
  const ultimoId = messages[messages.length - 1]?.id;
  const ultimoTipo = messages[messages.length - 1]?.type;
  const arriba = insets.top + Size.header;
  const paddingInferior = Math.max(insets.bottom, Spacing[3]) + altoDeLaBarra + Spacing[5];

  const indiceFijado = idFijado === null ? -1 : messages.findIndex((m) => m.id === idFijado);
  const restante =
    messages.slice(Math.max(indiceFijado, 0)).reduce((suma, m) => suma + (alturas[m.id] ?? 0), 0) +
    altoDelPie;
  const relleno =
    indiceFijado < 0 ? 0 : Math.max(0, altoDeLaLista - arriba - restante - paddingInferior);

  const tecladoQueTapa = Platform.OS === "ios" ? alturaDelTeclado : 0;
  const espacioInferior =
    alturaDelTeclado > 0 ? tecladoQueTapa + Spacing[3] : Math.max(insets.bottom, Spacing[3]);

  const [espacioAnimado] = useState(() => new Animated.Value(espacioInferior));
  useEffect(() => {
    Animated.timing(espacioAnimado, {
      toValue: espacioInferior,
      duration: reducirAnimaciones ? 0 : Motion.sheet,
      easing: Easing.bezier(...Motion.bezier),
      useNativeDriver: false,
    }).start();
  }, [espacioInferior, reducirAnimaciones, espacioAnimado]);

  useEffect(() => {
    const alSubir = Keyboard.addListener("keyboardDidShow", () => setEscribiendo(true));
    const alBajar = Keyboard.addListener("keyboardDidHide", () => setEscribiendo(false));
    return () => {
      alSubir.remove();
      alBajar.remove();
    };
  }, []);

  useEffect(() => {
    ultimosMensajes.current = messages;
  }, [messages]);

  useEffect(() => {
    if (ultimoTipo !== "user" || ultimoId === undefined) return;
    if (ultimoId <= idMaximoInicial.current) return;
    setIdFijado(ultimoId);
  }, [ultimoId, ultimoTipo]);

  useEffect(() => {
    if (idFijado === null) return;
    const id = setTimeout(() => {
      const indice = ultimosMensajes.current.findIndex((m) => m.id === idFijado);
      if (indice >= 0) {
        listRef.current?.scrollToIndex({ index: indice, viewOffset: arriba, animated: true });
      }
    }, 60);
    return () => clearTimeout(id);
  }, [idFijado, arriba]);

  useEffect(() => {
    if (!restaurando.current) return;
    const id = setTimeout(() => {
      restaurando.current = false;
    }, 800);
    return () => clearTimeout(id);
  }, []);

  const alMedir = useCallback((id: number, alto: number) => {
    setAlturas((anteriores) => (anteriores[id] === alto ? anteriores : { ...anteriores, [id]: alto }));
  }, []);

  const alFallarElScroll = useCallback(
    ({ index, averageItemLength }: { index: number; averageItemLength: number }) => {
      listRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: false });
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index, viewOffset: arriba, animated: true });
      }, 80);
    },
    [arriba]
  );

  const dibujarMensaje = useCallback(
    ({ item }: ListRenderItemInfo<ChatMessage>) => (
      <View onLayout={(e) => alMedir(item.id, e.nativeEvent.layout.height)}>
        <MessageBubble
          message={item}
          escribiendo={item.id === ultimoId && item.id > idMaximoInicial.current}
        />
      </View>
    ),
    [ultimoId, alMedir]
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
            { paddingTop: arriba, paddingBottom: paddingInferior },
          ]}
          onLayout={(e) => setAltoDeLaLista(e.nativeEvent.layout.height)}
          onScrollToIndexFailed={alFallarElScroll}
          onScrollBeginDrag={() => {
            restaurando.current = false;
          }}
          onContentSizeChange={() => {
            if (restaurando.current) listRef.current?.scrollToEnd({ animated: false });
          }}
          ListFooterComponent={
            <View>
              <View onLayout={(e) => setAltoDelPie(e.nativeEvent.layout.height)}>
                {isTyping ? (
                  <TypingIndicator />
                ) : fallo ? (
                  <ErrorDeEnvio mensaje={fallo} onReintentar={reintentar} />
                ) : interrumpido ? (
                  <AvisoDeInterrupcion onReintentar={reintentar} />
                ) : null}
              </View>
              <View style={{ height: relleno }} />
            </View>
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <Animated.View
          style={[
            styles.lista,
            { paddingTop: arriba, paddingBottom: Animated.add(espacioAnimado, altoDeLaBarra) },
          ]}
        >
          <Pressable style={styles.lista} onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.bienvenida}>
              <ChatBotAvatar size={56} />
              <Text style={[Type.pageTitle, styles.pregunta, { color: C.ink }]}>¿En qué te ayudo hoy?</Text>
              <Plegable abierto={!escribiendo}>
                <Text style={[Type.lead, styles.bajada, { color: C.ink2 }]}>
                  Consultá por trámites de Recursos Humanos.
                </Text>
              </Plegable>
            </View>
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

          <View style={styles.bajarAviso}>
            <Plegable abierto={!escribiendo && !empezo}>
              <Text style={[styles.aviso, { color: C.ink2 }]}>
                ChatAP puede equivocarse. Confirmá en Mesa de Entradas.
              </Text>
            </Plegable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

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
  bajarAviso: {
    transform: [{ translateY: 6 }],
  },
  interrumpidoFila: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing[2],
    marginTop: Spacing[4],
    paddingHorizontal: Spacing[5],
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
