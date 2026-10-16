export function iniciales(nombre: string) {
  return nombre
    .trim()
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
}
