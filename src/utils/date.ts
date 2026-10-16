/** Fechas en dd/mm/aaaa, que es como se leen los expedientes acá. */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (!value) return "";

  // Las fechas del mock vienen como "2026-08-24": partirlas a mano evita que
  // `new Date` las lea como UTC y reste un día según la zona horaria.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return [date.getDate(), date.getMonth() + 1, date.getFullYear()]
    .map((part) => String(part).padStart(2, "0"))
    .join("/");
}

/** Fecha y hora como en el resto del panel: 09/10/2026, 11:57. */
export function formatDateTime(d: Date): string {
  return `${formatDate(d)}, ${d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
}

export function todayISO(): string {
  const d = new Date();
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()]
    .map((part) => String(part).padStart(2, "0"))
    .join("-");
}
