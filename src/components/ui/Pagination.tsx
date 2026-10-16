import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "./Text";

import { Fonts, Radius, Size, Spacing, useColors } from "@/constants/theme";
import { Icon } from "./Icon";

/**
 * Paginador compacto: anterior y siguiente como botones de 44 y las páginas en
 * Geist Mono; la actual en el tinte del ítem activo. Primera, última y las
 * vecinas de la actual; el resto se colapsa en puntos suspensivos.
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const C = useColors();

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
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        accessibilityRole="button"
        accessibilityLabel="Página anterior"
        style={[styles.btn, currentPage === 1 && styles.disabled]}
      >
        <Icon name="chevronLeft" size={20} color={C.ink} />
      </Pressable>

      {pages.map((p, i) =>
        p === "..." ? (
          <Text key={`dots-${i}`} style={[styles.num, { color: C.ink3 }]}>
            …
          </Text>
        ) : (
          <Pressable
            key={p}
            onPress={() => onPageChange(p)}
            accessibilityRole="button"
            accessibilityLabel={`Página ${p}`}
            accessibilityState={{ selected: p === currentPage }}
            style={[styles.btn, p === currentPage && { backgroundColor: C.activeBg }]}
          >
            <Text
              style={[styles.num, { color: p === currentPage ? C.activeInk : C.ink2 }]}
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
        <Icon name="chevronRight" size={20} color={C.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[1],
    paddingTop: Spacing[4],
  },
  btn: {
    minWidth: Size.touch,
    height: Size.touch,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.3,
  },
  num: {
    fontSize: 13,
    fontFamily: Fonts.mono,
  },
});
