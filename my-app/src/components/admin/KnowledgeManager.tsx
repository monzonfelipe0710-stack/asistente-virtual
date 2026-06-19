import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  knowledgeBase, knowledgeCategories, KnowledgeEntry, KnowledgeCategory,
} from "../../data/mockKnowledge";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";

export default function KnowledgeManager() {
  const [activeCategory, setActiveCategory] = useState<KnowledgeCategory>("Todas");
  const [entries, setEntries] = useState<KnowledgeEntry[]>(knowledgeBase);

  const filtered =
    activeCategory === "Todas"
      ? entries
      : entries.filter((e) => e.category === activeCategory);

  function toggleActive(id: number) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, active: !e.active } : e))
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Base de Conocimiento</Text>
          <Text style={styles.subheading}>{entries.filter((e) => e.active).length} entradas activas</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => Alert.alert("Nueva Entrada", "Funcionalidad en desarrollo.")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color={Colors.white} />
          <Text style={styles.addBtnText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {knowledgeCategories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[styles.filterBtn, activeCategory === cat && styles.filterBtnActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Entries */}
      <View style={styles.list}>
        {filtered.map((entry) => (
          <View key={entry.id} style={[styles.card, !entry.active && styles.cardInactive]}>
            <View style={styles.cardHeader}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{entry.category}</Text>
              </View>
              <Switch
                value={entry.active}
                onValueChange={() => toggleActive(entry.id)}
                trackColor={{ false: Colors.slate200, true: Colors.primary }}
                thumbColor={Colors.white}
                ios_backgroundColor={Colors.slate200}
              />
            </View>
            <Text style={[styles.question, !entry.active && styles.textMuted]}>
              {entry.question}
            </Text>
            <Text style={[styles.answer, !entry.active && styles.textMuted]} numberOfLines={3}>
              {entry.answer}
            </Text>
          </View>
        ))}
      </View>
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
    marginBottom: Spacing[4],
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
  filterScroll: {
    paddingBottom: Spacing[4],
    gap: Spacing[2],
    flexDirection: "row",
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
  filterTextActive: {
    color: Colors.white,
  },
  list: {
    gap: Spacing[3],
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.slate200,
    padding: Spacing[4],
    ...Shadows.sm,
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing[2],
  },
  categoryBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
  },
  categoryText: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
  question: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.slate800,
    marginBottom: Spacing[1],
  },
  answer: {
    fontSize: Typography.xs,
    color: Colors.slate600,
    lineHeight: 17,
  },
  textMuted: {
    color: Colors.slate400,
  },
});