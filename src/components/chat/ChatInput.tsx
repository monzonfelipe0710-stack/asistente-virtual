import { memo, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import { TextInput } from "@/components/ui/TextInput";
import { Radius, Size, Spacing, useColors } from "@/constants/theme";

/**
 * Barra de mensaje: fondo de superficie, radio 22, 56 de alto como mínimo y
 * borde fuerte. Al enfocarla, borde azul de 2 y anillo de 4 px. Enviar es un
 * botón de 48 con radio 16 que pasa a azul cuando hay texto y no hay una
 * respuesta pendiente.
 *
 * El texto vive acá y no en `useChat`: así escribir no vuelve a dibujar la lista.
 */
function ChatInputBase({
  onSend,
  onStop,
  onFocusChange,
  disabled = false,
}: {
  onSend: (texto: string) => void;
  /** Avisa cuando el campo gana o pierde el foco, para que la pantalla se acomode. */
  onFocusChange?: (enfocado: boolean) => void;
  /** Mientras `disabled` es verdadero, el botón de enviar pasa a ser el de detener. */
  onStop?: () => void;
  disabled?: boolean;
}) {
  const C = useColors();
  const [texto, setTexto] = useState("");
  const [enfocado, setEnfocado] = useState(false);
  const hayTexto = texto.trim().length > 0;
  const puedeEnviar = hayTexto && !disabled;

  function enviar() {
    if (!puedeEnviar) return;
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
          {
            backgroundColor: C.surface,
            borderColor: enfocado ? C.accent : C.borderStrong,
            borderWidth: enfocado ? 2 : 1.5,
          },
        ]}
      >
        <TextInput
          style={[styles.campo, { color: C.ink }]}
          value={texto}
          onChangeText={setTexto}
          onFocus={() => {
            setEnfocado(true);
            onFocusChange?.(true);
          }}
          onBlur={() => {
            setEnfocado(false);
            onFocusChange?.(false);
          }}
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
        {disabled && onStop ? (
          <Pressable
            onPress={onStop}
            accessibilityRole="button"
            accessibilityLabel="Detener respuesta"
            style={[styles.enviar, { backgroundColor: C.accent }]}
          >
            <Icon name="stop" size={20} color={C.onAccent} />
          </Pressable>
        ) : (
          <Pressable
            onPress={enviar}
            disabled={!puedeEnviar}
            accessibilityRole="button"
            accessibilityLabel="Enviar consulta"
            accessibilityState={{ disabled: !puedeEnviar }}
            style={[styles.enviar, { backgroundColor: puedeEnviar ? C.accent : C.surface2 }]}
          >
            <Icon name="send" size={22} color={puedeEnviar ? C.onAccent : C.ink3} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export const ChatInput = memo(ChatInputBase);

const styles = StyleSheet.create({
  anillo: {
    marginHorizontal: Spacing[4] - 4,
    borderWidth: 4,
    borderRadius: 22 + 4,
  },
  barra: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing[2],
    minHeight: Size.composer,
    paddingLeft: Spacing[4],
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 22,
  },
  campo: {
    flex: 1,
    minWidth: 0,
    maxHeight: 120,
    alignSelf: "center",
    paddingVertical: Spacing[2],
    fontSize: 17,
    lineHeight: 23,
  },
  enviar: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
});
