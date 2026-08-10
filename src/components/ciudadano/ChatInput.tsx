import { memo, useCallback, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import {
  Palette,
  Radius,
  Shadows,
  Spacing,
  Typography,
  useColors,
} from "../../constants/theme";

interface Props {
  onSend: (text: string) => void;
}

// el texto vive acá y no en useChat: así tipear no re-renderiza la lista de mensajes
function ChatInput({ onSend }: Props) {
  const [text, setText] = useState("");
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
    <View style={styles.inputBar}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Escribí tu consulta..."
        placeholderTextColor={C.slate400}
        multiline
        maxLength={500}
        returnKeyType="send"
        onSubmitEditing={send}
        blurOnSubmit
      />
      <TouchableOpacity
        onPress={send}
        disabled={!writing}
        style={[styles.sendBtn, !writing && styles.sendBtnDisabled]}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Enviar consulta"
      >
        <Ionicons name="arrow-up" size={22} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

export default memo(ChatInput);

const createStyles = (C: Palette) =>
  StyleSheet.create({
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: Spacing[2],
      marginHorizontal: Spacing[3],
      marginBottom: Spacing[2],
      paddingLeft: Spacing[4],
      paddingRight: Spacing[2],
      paddingVertical: Spacing[3],
      backgroundColor: C.slate100,
      borderRadius: Radius["2xl"],
      ...Shadows.md,
    },
    input: {
      flex: 1,
      paddingVertical: Spacing[2],
      fontSize: Typography.md,
      color: C.slate800,
      maxHeight: 140,
      minHeight: 64,
    },
    sendBtn: {
      width: 48,
      height: 48,
      borderRadius: Radius.full,
      backgroundColor: C.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    sendBtnDisabled: {
      opacity: 0.4,
    },
  });
