import { memo, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import { TextInput } from "@/components/ui/Text";
import { Radius, Size, Spacing, useColors } from "@/constants/theme";

/**
 * Barra de mensaje: superficie gris sobre el fondo, radio 28, 56 de alto como
 * mínimo. Al enfocarla, borde azul y anillo de 4 px. Enviar es un círculo de 40
 * que pasa a azul profundo cuando hay texto.
 *
 * El texto vive acá y no en `useChat`: así escribir no vuelve a dibujar la lista.
 */
function ChatInputBase({ onSend }: { onSend: (texto: string) => void }) {
  const C = useColors();
  const [texto, setTexto] = useState("");
  const [enfocado, setEnfocado] = useState(false);
  const hayTexto = texto.trim().length > 0;

  function enviar() {
    if (!hayTexto) return;
    onSend(texto.trim());
    setTexto("");
  }

  // React Native no tiene box-shadow con spread: el anillo de foco es un borde
  // de 4 px por fuera de la barra.
  return (
    <View style={[styles.anillo, { borderColor: enfocado ? C.ring : "transparent" }]}>
      <View
        style={[
          styles.barra,
          { backgroundColor: C.surface, borderColor: enfocado ? C.accent : C.composerBorder },
        ]}
      >
        <TextInput
          style={[styles.campo, { color: C.ink }]}
          value={texto}
          onChangeText={setTexto}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          placeholder="Escribí tu consulta"
          placeholderTextColor={C.ink3}
          multiline
          // Una línea al empezar: en web el textarea arranca con dos. En nativo
          // no se pasa porque en Android fijaría el alto y la barra no crecería.
          {...(Platform.OS === "web" ? { numberOfLines: 1 } : null)}
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={enviar}
          submitBehavior="blurAndSubmit"
          accessibilityLabel="Escribí tu consulta"
        />
        <Pressable
          onPress={enviar}
          disabled={!hayTexto}
          accessibilityRole="button"
          accessibilityLabel="Enviar"
          accessibilityState={{ disabled: !hayTexto }}
          style={[styles.enviar, { backgroundColor: hayTexto ? C.primary : C.surface2 }]}
        >
          <Icon name="send" size={20} color={hayTexto ? "#FFFFFF" : C.ink3} />
        </Pressable>
      </View>
    </View>
  );
}

export const ChatInput = memo(ChatInputBase);

const styles = StyleSheet.create({
  anillo: {
    marginHorizontal: Spacing[5] - 4,
    borderWidth: 4,
    borderRadius: Radius["3xl"] + 4,
  },
  barra: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing[2],
    minHeight: Size.composer,
    paddingLeft: 15,
    paddingRight: Spacing[2],
    paddingVertical: Spacing[2] - 1,
    borderWidth: 1,
    borderRadius: Radius["3xl"],
  },
  campo: {
    flex: 1,
    minWidth: 0,
    maxHeight: 120,
    paddingVertical: Spacing[2],
    fontSize: 16,
    lineHeight: 24,
  },
  enviar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
