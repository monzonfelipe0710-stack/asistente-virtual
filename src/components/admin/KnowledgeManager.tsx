import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { knowledgeCategories, type KnowledgeCategory } from "../../data/mockKnowledge";
import { useKnowledgeBase } from "../../context/AppDataContext";
import Card from "../common/Card";
import FilterPill from "../common/FilterPill";
import { Colors, Typography, Spacing, Radius } from "../../constants/theme";

export default function KnowledgeManager() {
  const [activeCategory, setActiveCategory] = useState<KnowledgeCategory>("Todas");
  const { items: entries, toggleActive } = useKnowledgeBase();

  const filtered =
    activeCategory === "Todas"
      ? entries
      : entries.filter((e) => e.category === activeCategory);

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
      <FilterPill
        options={knowledgeCategories}
        active={activeCategory}
        onChange={(cat) => setActiveCategory(cat as KnowledgeCategory)}
        containerStyle={styles.filterScroll}
      />

      {/* Entries */}
      <View style={styles.list}>
        {filtered.map((entry) => (
          <Card key={entry.id} style={!entry.active && styles.cardInactive}>
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
          </Card>
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
  },
  list: {
    gap: Spacing[3],
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
