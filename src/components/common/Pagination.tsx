import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Radius, Spacing, Typography, useAdminColors } from "../../constants/theme";

/**
 * Paginador compacto: primera, última y las vecinas de la actual; el resto se
 * colapsa en puntos suspensivos.
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const C = useAdminColors();

  const pages = useMemo(() => {
    const out: (number | "...")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        out.push(i);
      } else if (out[out.length - 1] !== "...") {
        out.push("...");
      }
    }
    return out;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <View style={[styles.wrap, { borderTopColor: C.line }]}>
      <Pressable
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        accessibilityRole="button"
        accessibilityLabel="Página anterior"
        style={[styles.btn, currentPage === 1 && styles.disabled]}
      >
        <Text style={[styles.btnText, { color: C.muted }]}>Anterior</Text>
      </Pressable>

      {pages.map((p, i) =>
        p === "..." ? (
          <Text key={`dots-${i}`} style={[styles.dots, { color: C.muted }]}>
            …
          </Text>
        ) : (
          <Pressable
            key={p}
            onPress={() => onPageChange(p)}
            accessibilityRole="button"
            accessibilityState={{ selected: p === currentPage }}
            style={[
              styles.btn,
              p === currentPage && { backgroundColor: C.brand },
            ]}
          >
            <Text
              style={[
                styles.btnText,
                { color: p === currentPage ? "#ffffff" : C.muted },
              ]}
            >
              {p}
            </Text>
          </Pressable>
        )
      )}

      <Pressable
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        accessibilityRole="button"
        accessibilityLabel="Página siguiente"
        style={[styles.btn, currentPage === totalPages && styles.disabled]}
      >
        <Text style={[styles.btnText, { color: C.muted }]}>Siguiente</Text>
      </Pressable>
    </View>
  );
}

export function usePagination<T>(items: T[], pageSize = 5) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Al filtrar, la página actual puede quedar fuera de rango y la lista se ve
  // vacía sin motivo. Se vuelve a la última página que sí existe.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);

  return { page, totalPages, paginatedItems, setPage };
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[1],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  btn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  disabled: {
    opacity: 0.3,
  },
  btnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  dots: {
    paddingHorizontal: Spacing[1],
    fontSize: Typography.sm,
  },
});
