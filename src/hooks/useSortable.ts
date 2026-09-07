import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

/**
 * Ordena una lista por una de sus claves y alterna asc/desc al repetir la
 * misma. Los textos se comparan con `localeCompare` en español: sin eso,
 * "Álvarez" queda después de "Zapata" porque se ordena por código de carácter.
 */
export function useSortable<T extends object>(
  items: T[],
  defaultKey: keyof T | null = null,
  defaultDir: SortDir = "asc"
) {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

  const sorted = useMemo(() => {
    if (!sortKey) return items;
    return [...items].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      let cmp = 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        cmp = aVal.localeCompare(bVal, "es", { sensitivity: "base" });
      } else {
        cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);

  function toggleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function getSortIndicator(key: keyof T): string | null {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? "▲" : "▼";
  }

  return { sorted, sortKey, sortDir, toggleSort, getSortIndicator };
}

export default useSortable;
