import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";

import { Spacing, Type, useColors } from "@/compartido/constantes/theme";
import { Screen } from "@/compartido/ui/Screen";
import { SearchInput } from "@/compartido/ui/SearchInput";
import { Text } from "@/compartido/ui/Text";
import { useConversacion, type Conversacion } from "@/funcionalidades/chat/ChatContext";
import { ChatsConOpciones } from "@/funcionalidades/menu/ChatsConOpciones";
import { PantallaConEncabezadoFlotante } from "@/funcionalidades/menu/Encabezado";

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function filtrarPorNombre(conversaciones: Conversacion[], busqueda: string) {
  const q = normalizar(busqueda);
  if (!q) return conversaciones;
  return conversaciones.filter((c) => normalizar(c.titulo).includes(q));
}

export default function Chats() {
  const C = useColors();
  const router = useRouter();
  const { conversaciones, abrir } = useConversacion();
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => filtrarPorNombre(conversaciones, busqueda), [conversaciones, busqueda]);
  const textoVacio = busqueda.trim() ? "No hay chats con ese nombre." : "Todavía no hay chats.";

  function abrirChat(id: string) {
    abrir(id);
    router.navigate("/");
  }

  return (
    <PantallaConEncabezadoFlotante titulo="Chats">
      <Screen>
        <Text style={[Type.lead, { color: C.ink2, marginBottom: Spacing[4] }]}>
          {conversaciones.length === 1 ? "1 chat guardado." : `${conversaciones.length} chats guardados.`}
        </Text>

        <SearchInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar chats por nombre"
          autoCapitalize="none"
          accessibilityLabel="Buscar chats por nombre"
        />

        <View style={{ marginTop: Spacing[3] }}>
          <ChatsConOpciones conversaciones={filtradas} onAbrir={abrirChat} textoVacio={textoVacio} />
        </View>
      </Screen>
    </PantallaConEncabezadoFlotante>
  );
}
