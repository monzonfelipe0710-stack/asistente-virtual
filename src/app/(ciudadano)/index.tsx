import Head from "expo-router/head";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatWindow } from "@/funcionalidades/chat/componentes/ChatWindow";
import { Encabezado } from "@/funcionalidades/menu/Encabezado";
import { Desvanecido } from "@/compartido/ui/Desvanecido";
import { Size, Spacing, useColors } from "@/compartido/constantes/theme";
import { useConversacion } from "@/funcionalidades/chat/ChatContext";

export default function Asistente() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const altoDelDesvanecido = insets.top + Size.header + Spacing[4];

  const { activa } = useConversacion();

  return (
    <View style={[styles.pantalla, { backgroundColor: C.canvas }]}>
      <Head>
        <title>ChatAP · Asistente virtual de trámites</title>
        <meta
          name="description"
          content="Consultá trámites, descargá formularios y accedé a los servicios en línea desde el asistente virtual ChatAP."
        />
      </Head>

      <ChatWindow key={activa} />

      <Desvanecido alto={altoDelDesvanecido} solido={insets.top / altoDelDesvanecido} />

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
