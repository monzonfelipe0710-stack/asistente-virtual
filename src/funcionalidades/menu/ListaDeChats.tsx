import type { DrawerContentComponentProps } from "expo-router/drawer";
import { Pressable, StyleSheet, View } from "react-native";

import { ChatsConOpciones } from "./ChatsConOpciones";
import { cerrarMenu } from "./MenuLateral";
import { Text } from "@/compartido/ui/Text";
import { Radius, Spacing, Type, Weight, useColors } from "@/compartido/constantes/theme";
import { useConversacion, type Conversacion } from "@/funcionalidades/chat/ChatContext";

const RECIENTES_EN_EL_MENU = 5;

// Las conversaciones ya vienen con las fijadas primero y el resto de la más nueva a la más vieja.
function chatsDelMenu(conversaciones: Conversacion[]) {
  const fijadas = conversaciones.filter((c) => c.fijada);
  const recientes = conversaciones.filter((c) => !c.fijada).slice(0, RECIENTES_EN_EL_MENU);
  return [...fijadas, ...recientes];
}

export function ListaDeChats({ drawer }: { drawer: DrawerContentComponentProps }) {
  const C = useColors();
  const { conversaciones, activa, abrir } = useConversacion();
  const enElChat = drawer.state.routes[drawer.state.index].name === "index";
  const visibles = chatsDelMenu(conversaciones);
  const hayMas = conversaciones.length > visibles.length;

  function abrirChat(id: string) {
    cerrarMenu(drawer, () => {
      abrir(id);
      drawer.navigation.navigate("index");
    });
  }

  function verTodos() {
    cerrarMenu(drawer, () => drawer.navigation.navigate("chats"));
  }

  return (
    <View>
      <Text style={[Type.overline, styles.rotulo, { color: C.ink2 }]}>Chats</Text>

      <ChatsConOpciones
        conversaciones={visibles}
        idSeleccionado={enElChat ? activa : null}
        onAbrir={abrirChat}
      />

      {hayMas && (
        <Pressable
          onPress={verTodos}
          accessibilityRole="menuitem"
          accessibilityLabel={`Ver todos los chats, ${conversaciones.length} en total`}
          style={({ pressed }) => [styles.verTodo, pressed && { backgroundColor: C.surface2 }]}
        >
          <Text style={[styles.verTodoTexto, { color: C.ink2 }]}>Ver todo</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rotulo: {
    marginTop: 8,
    marginBottom: 4,
    marginHorizontal: Spacing[2],
  },
  verTodo: {
    justifyContent: "center",
    minHeight: 48,
    marginTop: 2,
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.button,
  },
  verTodoTexto: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: Weight.medium,
  },
});
