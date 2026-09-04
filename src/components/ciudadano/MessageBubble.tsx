import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Palette, Radius, Spacing, Typography, useColors } from "../../constants/theme";
import { ChatMessage } from "../../data/mockMessages";

interface Props {
  message: ChatMessage;
}

// memo: cada tecla del input re-renderiza ChatWindow; los mensajes ya escritos no cambian
function MessageBubble({ message }: Props) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const isBot = message.type === "bot";

  return (
    <View style={[styles.row, isBot ? styles.rowBot : styles.rowUser]}>
      <View style={isBot ? styles.bubbleBot : styles.bubbleUser}>
        <Text style={styles.text}>{message.text}</Text>
      </View>
    </View>
  );
}

export default memo(MessageBubble);

const createStyles = (C: Palette) =>
  StyleSheet.create({
    // marginTop y no marginBottom: así el último mensaje no deja hueco sobre el input
    row: {
      marginTop: Spacing[4],
      paddingHorizontal: Spacing[4],
    },
    rowBot: {
      alignItems: "flex-start",
    },
    rowUser: {
      alignItems: "flex-end",
    },
    // sin color: al bot lo distingue la alineación, al usuario un gris neutro
    bubbleBot: {
      width: "100%",
    },
    bubbleUser: {
      maxWidth: "80%",
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[3],
      backgroundColor: C.slate100,
      borderRadius: Radius["2xl"],
      borderBottomRightRadius: Radius.sm,
    },
    text: {
      fontSize: Typography.md,
      lineHeight: 22,
      color: C.slate800,
    },
  });
