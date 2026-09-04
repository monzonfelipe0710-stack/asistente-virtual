import { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { sigedStatuses, type SigedStatus } from "../../data/mockSiged";
import { useSigedRecords } from "../../context/AppDataContext";
import { statusConfig } from "../../constants/badges";
import Card from "../common/Card";
import Badge from "../common/Badge";
import FilterPill from "../common/FilterPill";
import { Colors, Typography, Spacing } from "../../constants/theme";

export default function SigedIntegration() {
  const [activeStatus, setActiveStatus] = useState<"Todos" | SigedStatus>("Todos");
  const { items: sigedRecords } = useSigedRecords();

  const filtered =
    activeStatus === "Todos"
      ? sigedRecords
      : sigedRecords.filter((r) => r.status === activeStatus);

  const allFilters: ("Todos" | SigedStatus)[] = ["Todos", ...sigedStatuses];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>SIGED — Expedientes</Text>
      <Text style={styles.subheading}>{sigedRecords.length} registros en el sistema</Text>

      <FilterPill
        options={allFilters}
        active={activeStatus}
        onChange={(status) => setActiveStatus(status as "Todos" | SigedStatus)}
        containerStyle={styles.filterScroll}
      />

      <View style={styles.list}>
        {filtered.map((rec) => {
          const sc = statusConfig[rec.status];
          return (
            <Card key={rec.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.expId}>{rec.id}</Text>
                <Badge label={rec.status} bg={sc.bg} text={sc.text} weight="semibold" />
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
            </Card>
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
    paddingBottom: Spacing[4],
  },
  list: { gap: Spacing[3] },
  card: {
    gap: Spacing[2],
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
