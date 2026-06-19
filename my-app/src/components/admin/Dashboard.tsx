import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { users } from "../../data/mockSiged";
import { sigedRecords } from "../../data/mockSiged";
import { knowledgeBase } from "../../data/mockKnowledge";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";

interface StatCard {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

export default function Dashboard() {
  const activeUsers = users.filter((u) => u.status === "Activo").length;
  const activeKb = knowledgeBase.filter((k) => k.active).length;
  const pendingExp = sigedRecords.filter(
    (r) => r.status === "En proceso" || r.status === "Ingresado"
  ).length;

  const stats: StatCard[] = [
    {
      label: "Usuarios Activos",
      value: String(activeUsers),
      icon: "people-outline",
      color: Colors.primary,
      bg: Colors.primaryLight,
    },
    {
      label: "Base de Conocimiento",
      value: `${activeKb} entradas`,
      icon: "library-outline",
      color: "#7c3aed",
      bg: "#ede9fe",
    },
    {
      label: "Expedientes Activos",
      value: String(pendingExp),
      icon: "document-outline",
      color: Colors.statusProcess,
      bg: "#dbeafe",
    },
    {
      label: "Total Expedientes",
      value: String(sigedRecords.length),
      icon: "folder-outline",
      color: Colors.statusFinished,
      bg: "#dcfce7",
    },
  ];

  const recentRecords = sigedRecords.slice(0, 4);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Dashboard</Text>
      <Text style={styles.subheading}>Resumen del sistema</Text>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon} size={20} color={s.color} />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent activity */}
      <Text style={styles.sectionTitle}>Actividad Reciente</Text>
      <View style={styles.table}>
        {recentRecords.map((rec) => (
          <View key={rec.id} style={styles.tableRow}>
            <View style={styles.tableMain}>
              <Text style={styles.expId}>{rec.id}</Text>
              <Text style={styles.expType} numberOfLines={1}>
                {rec.type}
              </Text>
              <Text style={styles.expApplicant} numberOfLines={1}>
                {rec.applicant}
              </Text>
            </View>
            <StatusBadge status={rec.status} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    Ingresado: { bg: "#ede9fe", text: "#7c3aed" },
    "En proceso": { bg: "#dbeafe", text: "#2563eb" },
    Observado: { bg: "#fef3c7", text: "#d97706" },
    Finalizado: { bg: "#dcfce7", text: "#16a34a" },
  };
  const c = config[status] ?? { bg: Colors.slate100, text: Colors.slate600 };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing[4],
  },
  heading: {
    fontSize: Typography.xl,
    fontWeight: Typography.semibold,
    color: Colors.slate800,
  },
  subheading: {
    fontSize: Typography.sm,
    color: Colors.slate500,
    marginBottom: Spacing[5],
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.slate200,
    ...Shadows.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing[3],
  },
  statValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.slate800,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.slate500,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.slate800,
    marginBottom: Spacing[3],
  },
  table: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.slate200,
    overflow: "hidden",
    ...Shadows.sm,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  tableMain: {
    flex: 1,
    gap: 2,
  },
  expId: {
    fontSize: Typography.xs,
    color: Colors.slate400,
    fontWeight: Typography.medium,
  },
  expType: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.slate800,
  },
  expApplicant: {
    fontSize: Typography.xs,
    color: Colors.slate500,
  },
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginLeft: Spacing[2],
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.medium,
  },
});