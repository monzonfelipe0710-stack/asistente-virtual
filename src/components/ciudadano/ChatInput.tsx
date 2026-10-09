import { memo, useCallback, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { TextInput } from "../common/Text";
import Icon from "../common/Icon";
import { Palette, Radius, Spacing, Size, useColors } from "../../constants/theme";

interface Props {
  onSend: (text: string) => void;
}

/**
 * Barra de mensaje: superficie gris sobre el fondo, radio 28, mínimo 56 de
 * alto. Al enfocarla, borde azul y anillo de 4 px. Enviar es un círculo de 40
 * que pasa a azul profundo cuando hay texto.
 */
// el texto vive acá y no en useChat: así tipear no re-renderiza la lista de mensajes
function ChatInput({ onSend }: Props) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const writing = text.trim().length > 0;

  const send = useCallback(() => {
    const value = text.trim();
    if (!value) return;
    setText("");
    onSend(value);
  }, [text, onSend]);

  return (
    // el anillo de foco: React Native no tiene box-shadow con spread, así que es
    // un borde de 4 px por fuera de la barra
    <View style={[styles.ring, { borderColor: focused ? C.ring : "transparent" }]}>
      <View style={[styles.bar, { borderColor: focused ? C.accentBlue : C.cborder }]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Escribí tu consulta"
          placeholderTextColor={C.ink3}
          multiline
          // una línea al empezar: en web el textarea arranca con dos. En nativo
          // no: en Android numberOfLines fija el alto y la barra no crecería
          {...(Platform.OS === "web" ? { numberOfLines: 1 } : null)}
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={send}
          submitBehavior="blurAndSubmit"
          accessibilityLabel="Escribí tu consulta"
        />
        <Pressable
          onPress={send}
          disabled={!writing}
          style={[
            styles.sendBtn,
            { backgroundColor: writing ? C.primary : C.surface2 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Enviar"
          accessibilityState={{ disabled: !writing }}
        >
          <Icon name="send" size={20} color={writing ? "#FFFFFF" : C.ink3} />
        </Pressable>
      </View>
    </View>
  );
}

export default memo(ChatInput);

const createStyles = (C: Palette) =>
  StyleSheet.create({
    ring: {
      marginHorizontal: Spacing[5] - 4,
      borderWidth: 4,
      borderRadius: Radius["3xl"] + 4,
    },
    bar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: Spacing[2],
      minHeight: Size.composer,
      paddingLeft: 15,
      paddingRight: Spacing[2],
      paddingVertical: Spacing[2] - 1,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderRadius: Radius["3xl"],
    },
    input: {
      flex: 1,
      minWidth: 0,
      paddingVertical: Spacing[2],
      fontSize: 16,
      lineHeight: 24,
      color: C.ink,
      maxHeight: 120,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: Radius.full,
      justifyContent: "center",
      alignItems: "center",
    },
  });
