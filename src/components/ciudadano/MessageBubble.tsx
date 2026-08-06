import { StyleSheet, Text, View } from "react-native";
import { Colors, Radius, Spacing, Typography } from "../../constants/theme";
import { ChatMessage } from "../../data/mockMessages";

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isBot = message.type === "bot";

  const time = new Date(message.timestamp).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={[styles.row, isBot ? styles.rowBot : styles.rowUser]}>
      <View
        style={[styles.bubble, isBot ? styles.bubbleBot : styles.bubbleUser]}
      >
        <Text style={[styles.text, isBot ? styles.textBot : styles.textUser]}>
          {message.text}
        </Text>
        <Text style={[styles.time, isBot ? styles.timeBot : styles.timeUser]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  rowBot: {
    alignItems: "flex-start",
  },
  rowUser: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: Spacing[4],
    paddingVertical: 10,
    borderRadius: Radius["2xl"],
  },
  bubbleBot: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.slate200,
    borderBottomLeftRadius: Radius.sm,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.sm,
  },
  text: {
    fontSize: Typography.base,
    lineHeight: 20,
  },
  textBot: {
    color: Colors.slate700,
  },
  textUser: {
    color: Colors.white,
  },
  time: {
    fontSize: Typography.xs,
    marginTop: 4,
  },
  timeBot: {
    color: Colors.slate400,
  },
  timeUser: {
    color: "rgba(255,255,255,0.6)",
  },
});
