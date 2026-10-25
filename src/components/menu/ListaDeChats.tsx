import type { DrawerContentComponentProps } from "expo-router/drawer";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, View, type ViewInstance } from "react-native";

import { cerrarMenu } from "./MenuLateral";
import { Btn } from "@/components/ui/Btn";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { MenuEmergente, type Ancla } from "@/components/ui/MenuEmergente";
import { Dialogo } from "@/components/ui/Dialogo";
import { Text } from "@/components/ui/Text";
import { useToast } from "@/components/ui/Toast";
import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";
import { useConversacion, type Conversacion } from "@/context/ChatContext";

function FilaDeChat({
  conversacion,
  seleccionada,
  onAbrir,
  onOpciones,
}: {
  conversacion: Conversacion;
  seleccionada: boolean;
  onAbrir: () => void;
  onOpciones: (ancla: Ancla) => void;
}) {
  const C = useColors();
  const fila = useRef<ViewInstance>(null);
  const color = seleccionada ? C.activeInk : C.ink;

  function opciones() {
    fila.current?.measureInWindow((x, y, width, height) => onOpciones({ x, y, width, height }));
  }

  return (
    <Pressable
      ref={fila}
      onPress={onAbrir}
      onLongPress={opciones}
      accessibilityRole="menuitem"
      accessibilityLabel={conversacion.fijada ? `${conversacion.titulo}, fijado` : conversacion.titulo}
      accessibilityHint="Mantené apretado para fijar, cambiar el nombre o eliminar"
      accessibilityState={{ selected: seleccionada }}
      accessibilityActions={[{ name: "activate", label: "Opciones del chat" }]}
      onAccessibilityAction={opciones}
      style={({ pressed }) => [
        styles.fila,
        {
          backgroundColor: seleccionada ? C.activeBg : pressed ? C.surface2 : "transparent",
          borderColor: seleccionada ? C.accent : "transparent",
        },
      ]}
    >
      <Text
        style={[
          styles.texto,
          { color, fontWeight: seleccionada ? Weight.bold : Weight.medium },
        ]}
        numberOfLines={1}
      >
        {conversacion.titulo}
      </Text>
      {conversacion.fijada && <Icon name="pin" size={18} color={color} />}
    </Pressable>
  );
}

/**
 * Historial del menú, solo para quien inició sesión: una fila por conversación, con las
 * fijadas primero. Tocar una la abre; mantenerla apretada abre Fijar, Cambiar nombre y Eliminar.
 */
export function ListaDeChats({ drawer }: { drawer: DrawerContentComponentProps }) {
  const C = useColors();
  const toast = useToast();
  const { conversaciones, activa, abrir, eliminar, renombrar, alternarFijada } = useConversacion();
  const [elegida, setElegida] = useState<{ id: string; ancla: Ancla } | null>(null);
  const [confirmando, setConfirmando] = useState<{ id: string; titulo: string } | null>(null);
  const [renombrando, setRenombrando] = useState<{ id: string; titulo: string } | null>(null);
  const enElChat = drawer.state.routes[drawer.state.index].name === "index";
  const conversacionElegida = conversaciones.find((c) => c.id === elegida?.id);

  function abrirChat(id: string) {
    cerrarMenu(drawer, () => {
      abrir(id);
      drawer.navigation.navigate("index");
    });
  }

  function fijar() {
    if (elegida) alternarFijada(elegida.id);
    setElegida(null);
  }

  function pedirNombre() {
    if (conversacionElegida) {
      setRenombrando({ id: conversacionElegida.id, titulo: conversacionElegida.titulo });
    }
    setElegida(null);
  }

  function pedirConfirmacion() {
    if (conversacionElegida) {
      setConfirmando({ id: conversacionElegida.id, titulo: conversacionElegida.titulo });
    }
    setElegida(null);
  }

  function eliminarConfirmada() {
    if (confirmando) {
      eliminar(confirmando.id);
      toast("Chat eliminado");
    }
    setConfirmando(null);
  }

  function guardarNombre() {
    if (renombrando) renombrar(renombrando.id, renombrando.titulo);
    setRenombrando(null);
  }

  return (
    <View>
      <Text style={[Type.overline, styles.rotulo, { color: C.ink2 }]}>Chats</Text>

      {conversaciones.length === 0 ? (
        <Text style={[Type.meta, styles.vacio, { color: C.ink2 }]}>Todavía no hay chats.</Text>
      ) : (
        <View style={styles.lista}>
          {conversaciones.map((conversacion) => (
            <FilaDeChat
              key={conversacion.id}
              conversacion={conversacion}
              seleccionada={enElChat && conversacion.id === activa}
              onAbrir={() => abrirChat(conversacion.id)}
              onOpciones={(ancla) => setElegida({ id: conversacion.id, ancla })}
            />
          ))}
        </View>
      )}

      <MenuEmergente
        compacto
        ancla={elegida?.ancla ?? null}
        opciones={[
          {
            texto: conversacionElegida?.fijada ? "Quitar fijado" : "Fijar",
            icono: "pin",
            onPress: fijar,
          },
          { texto: "Cambiar nombre", icono: "edit", onPress: pedirNombre },
          { texto: "Eliminar", icono: "trash", onPress: pedirConfirmacion, peligro: true },
        ]}
        onClose={() => setElegida(null)}
      />

      <Dialogo
        open={confirmando !== null}
        title="¿Querés eliminar este chat?"
        onClose={() => setConfirmando(null)}
        footer={[
          <Btn key="no" label="Cancelar" variant="secondary" onPress={() => setConfirmando(null)} />,
          <Btn key="si" label="Eliminar" variant="dangerFill" onPress={eliminarConfirmada} />,
        ]}
      >
        <Text style={[Type.body, { color: C.ink }]}>
          {`"${confirmando?.titulo ?? ""}" se va a borrar de tu historial y no se puede recuperar.`}
        </Text>
      </Dialogo>

      <Dialogo
        open={renombrando !== null}
        title="Cambiar nombre"
        onClose={() => setRenombrando(null)}
        footer={[
          <Btn key="no" label="Cancelar" variant="secondary" onPress={() => setRenombrando(null)} />,
          <Btn
            key="si"
            label="Guardar"
            onPress={guardarNombre}
            disabled={!renombrando?.titulo.trim()}
          />,
        ]}
      >
        <Field label="Nombre del chat">
          <Input
            value={renombrando?.titulo ?? ""}
            onChangeText={(titulo) => setRenombrando((actual) => (actual ? { ...actual, titulo } : actual))}
            maxLength={60}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={guardarNombre}
          />
        </Field>
      </Dialogo>
    </View>
  );
}

const styles = StyleSheet.create({
  rotulo: {
    marginTop: 8,
    marginBottom: 4,
    marginHorizontal: Spacing[2],
  },
  vacio: {
    marginHorizontal: Spacing[2],
    paddingVertical: Spacing[2],
  },
  lista: {
    gap: 2,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
    minHeight: 52,
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.button,
    borderWidth: 1,
  },
  texto: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    lineHeight: 21,
  },
});
