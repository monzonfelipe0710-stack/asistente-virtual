import Head from "expo-router/head";
import { StyleSheet, View } from "react-native";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { Encabezado } from "@/components/menu/Encabezado";
import { useColors } from "@/constants/theme";
import { useConversacion } from "@/context/ChatContext";

/**
 * Ruta "/": la conversación con el asistente. El chat ocupa toda la pantalla y
 * el encabezado flota encima, así los mensajes pasan por detrás al desplazarse.
 */
export default function Asistente() {
  const C = useColors();

  // Abrir otro chat o crear uno nuevo cambia la key y la conversación se vuelve a montar.
  const { activa } = useConversacion();

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

      <ChatWindow key={activa} />

      <View style={styles.encabezado}>
        <Encabezado />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  encabezado: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: "box-none",
  },
});
