import Head from "expo-router/head";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { BotonDeEncabezado, Encabezado } from "@/components/menu/Encabezado";
import { Spacing, useColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";

/** Ruta "/": la conversación con el asistente. */
export default function Asistente() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const alturaDelTeclado = useKeyboardHeight();

  // "Nuevo chat" cambia la key y la conversación se vuelve a montar vacía.
  const [conversacion, setConversacion] = useState(0);
  const [conversando, setConversando] = useState(false);

  function nuevoChat() {
    setConversando(false);
    setConversacion((n) => n + 1);
  }

  // Con el teclado arriba, el borde inferior lo pone el teclado y no la barra del sistema.
  const aireInferior = alturaDelTeclado > 0 ? Spacing[3] : Math.max(insets.bottom, Spacing[3]);

  return (
    <View style={[styles.pantalla, { backgroundColor: C.canvas }]}>
      {/* expo-router maneja el <title> del build web con react-helmet; sin este
          Head queda el <title data-rh> vacío y Lighthouse lo marca. */}
      <Head>
        <title>ChatAP · Asistente virtual de trámites</title>
        <meta
          name="description"
          content="Consultá trámites, descargá formularios y accedé a los servicios en línea desde el asistente virtual ChatAP."
        />
      </Head>

      <Encabezado
        titulo="ChatAP"
        derecha={
          conversando ? (
            <BotonDeEncabezado icono="newChat" etiqueta="Nuevo chat" onPress={nuevoChat} />
          ) : undefined
        }
      />

      <View style={[styles.chat, { paddingBottom: alturaDelTeclado }]}>
        <ChatWindow
          key={conversacion}
          onConversationStart={setConversando}
          greetingName={user?.name}
          bottomInset={aireInferior}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  chat: {
    flex: 1,
  },
});
