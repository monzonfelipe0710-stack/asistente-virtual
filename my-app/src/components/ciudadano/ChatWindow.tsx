import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Radius, Spacing, Typography } from "../../constants/theme";
import { useChat } from "../../hooks/useChat";
import MessageBubble from "./MessageBubble";
import QuickReplies from "./QuickReplies";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow() {
  const {
    messages,
    input,
    setInput,
    isTyping,
    listRef,
    handleSend,
    handleQuickReply,
  } = useChat();

  return (
    // KeyboardAvoidingView eliminado: el teclado se maneja desde index.tsx
    // porque la tab bar estaba fuera del KAV y rompía los cálculos de offset.
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        showsVerticalScrollIndicator={false}
        // Permite tocar mensajes sin cerrar el teclado (comportamiento WhatsApp)
        keyboardShouldPersistTaps="handled"
      />
      <QuickReplies onSelect={handleQuickReply} />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribí tu consulta..."
          placeholderTextColor={Colors.slate400}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim()}
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.slate50,
  },
  listContent: {
    // flexGrow + justifyContent: los mensajes se anclan al fondo (como WhatsApp).
    // Cuando hay pocos mensajes, el espacio vacío queda ARRIBA, no abajo.
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.slate200,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    fontSize: Typography.base,
    color: Colors.slate800,
    borderWidth: 1,
    borderColor: Colors.slate200,
    borderRadius: Radius.lg,
    maxHeight: 100,
    minHeight: 40,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});