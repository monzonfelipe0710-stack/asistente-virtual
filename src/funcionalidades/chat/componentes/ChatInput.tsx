import { memo, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/compartido/ui/Icon";
import { TextInput } from "@/compartido/ui/TextInput";
import { Radius, Size, Spacing, useColors } from "@/compartido/constantes/theme";
import { vibrarSuave } from "@/compartido/lib/haptica";

function ChatInputBase({
  onSend,
  onStop,
  onFocusChange,
  disabled = false,
}: {
  onSend: (texto: string) => void;
  onFocusChange?: (enfocado: boolean) => void;
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
    vibrarSuave();
    Keyboard.dismiss();
  }

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
          {...(Platform.OS === "web" ? { numberOfLines: 1, blurOnSubmit: true } : null)}
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={enviar}
          submitBehavior="blurAndSubmit"
          accessibilityLabel="Escribí tu consulta"
        />
        {disabled && onStop ? (
          <Pressable
            onPress={() => {
              onStop();
              vibrarSuave();
            }}
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
