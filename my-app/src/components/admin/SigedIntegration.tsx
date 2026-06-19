import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { sigedRecords, sigedStatuses, SigedStatus } from "../../data/mockSiged";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";

const statusConfig: Record<SigedStatus, { bg: string; text: string }> = {
  Ingresado: { bg: "#ede9fe", text: "#7c3aed" },
  "En proceso": { bg: "#dbeafe", text: "#2563eb" },
  Observado: { bg: "#fef3c7", text: "#d97706" },
  Finalizado: { bg: "#dcfce7", text: "#16a34a" },
};

export default function SigedIntegration() {
  const [activeStatus, setActiveStatus] = useState<"Todos" | SigedStatus>("Todos");

  const filtered =
    activeStatus === "Todos"
      ? sigedRecords
      : sigedRecords.filter((r) => r.status === activeStatus);

  const allFilters: Array<"Todos" | SigedStatus> = ["Todos", ...sigedStatuses];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>SIGED — Expedientes</Text>
      <Text style={styles.subheading}>{sigedRecords.length} registros en el sistema</Text>

      {/* Status filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {allFilters.map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setActiveStatus(status)}
            style={[
              styles.filterBtn,
              activeStatus === status && styles.filterBtnActive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                activeStatus === status && styles.filterTextActive,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Records */}
      <View style={styles.list}>
        {filtered.map((rec) => {
          const sc = statusConfig[rec.status];
          return (
            <View key={rec.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.expId}>{rec.id}</Text>
                <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.badgeText, { color: sc.text }]}>{rec.status}</Text>
                </View>
              </View>

              <Text style={styles.expType}>{rec.type}</Text>

              <View style={styles.metaRow}>
                <MetaItem icon="👤" label={rec.applicant} />
                <MetaItem icon="🏢" label={rec.department} />
              </View>

              <View style={styles.metaRow}>
                <MetaItem icon="📅" label={rec.date} />
              </View>

              <View style={styles.lastMovement}>
                <Text style={styles.lastMovementLabel}>Último movimiento:</Text>
                <Text style={styles.lastMovementValue}>{rec.lastMovement}</Text>
              </View>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <Text style={styles.empty}>No hay expedientes con este estado.</Text>
        )}
      </View>
    </ScrollView>
  );
}

function MetaItem({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={metaStyles.row}>
      <Text style={metaStyles.icon}>{icon}</Text>
      <Text style={metaStyles.label}>{label}</Text>
    </View>
  );
}

const metaStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  icon: { fontSize: 11 },
  label: {
    fontSize: Typography.xs,
    color: Colors.slate500,
  },
});

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
    marginTop: 2,
    marginBottom: Spacing[4],
  },
  filterScroll: {
    gap: Spacing[2],
    flexDirection: "row",
    paddingBottom: Spacing[4],
  },
  filterBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: Typography.xs,
    color: Colors.slate600,
    fontWeight: Typography.medium,
  },
  filterTextActive: { color: Colors.white },
  list: { gap: Spacing[3] },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.slate200,
    padding: Spacing[4],
    gap: Spacing[2],
    ...Shadows.sm,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expId: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.semibold,
  },
  expType: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.slate800,
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing[4],
  },
  lastMovement: {
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
    paddingTop: Spacing[2],
    marginTop: Spacing[1],
  },
  lastMovementLabel: {
    fontSize: Typography.xs,
    color: Colors.slate400,
  },
  lastMovementValue: {
    fontSize: Typography.xs,
    color: Colors.slate600,
    fontWeight: Typography.medium,
  },
  empty: {
    textAlign: "center",
    color: Colors.slate400,
    fontSize: Typography.sm,
    paddingVertical: Spacing[6],
  },
});