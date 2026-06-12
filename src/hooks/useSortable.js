import { useState, useMemo } from "react";

export default function useSortable(items, defaultKey = null, defaultDir = "asc") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);

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

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function getSortIndicator(key) {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? "▲" : "▼";
  }

  return { sorted, sortKey, sortDir, toggleSort, getSortIndicator };
}
