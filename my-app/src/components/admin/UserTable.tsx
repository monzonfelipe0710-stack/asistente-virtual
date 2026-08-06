import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUsers } from "../../context/AppDataContext";
import { roleColors } from "../../constants/badges";
import Card from "../common/Card";
import Badge from "../common/Badge";
import { Colors, Typography, Spacing, Radius } from "../../constants/theme";

export default function UserTable() {
  const { items: users } = useUsers();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Usuarios</Text>
          <Text style={styles.subheading}>{users.length} usuarios registrados</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => Alert.alert("Nuevo Usuario", "Funcionalidad en desarrollo.")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color={Colors.white} />
          <Text style={styles.addBtnText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      <Card padded={false}>
        {users.map((user, idx) => (
          <View
            key={user.id}
            style={[styles.row, idx === users.length - 1 && styles.rowLast]}
          >
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>

            {/* Info */}
            <View style={styles.info}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.email} numberOfLines={1}>
                {user.email}
              </Text>
              <Text style={styles.dept}>{user.department}</Text>
            </View>

            {/* Right column */}
            <View style={styles.right}>
              <Badge
                label={user.role}
                bg={roleColors[user.role].bg}
                text={roleColors[user.role].text}
                paddingHorizontal={6}
                paddingVertical={2}
              />
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: user.status === "Activo" ? Colors.statusActive : Colors.statusInactive },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: user.status === "Activo" ? Colors.statusActive : Colors.statusInactive },
                  ]}
                >
                  {user.status}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing[4],
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing[5],
  },
  heading: {
    fontSize: Typography.xl,
    fontWeight: Typography.semibold,
    color: Colors.slate800,
  },
  subheading: {
    fontSize: Typography.sm,
    color: Colors.slate500,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
  },
  addBtnText: {
    fontSize: Typography.sm,
    color: Colors.white,
    fontWeight: Typography.medium,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.slate800,
  },
  email: {
    fontSize: 11,
    color: Colors.slate500,
  },
  dept: {
    fontSize: 11,
    color: Colors.slate400,
  },
  right: {
    alignItems: "flex-end",
    gap: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: Typography.medium,
  },
});
