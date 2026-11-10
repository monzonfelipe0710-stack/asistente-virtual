import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * El panel web guardaba todo en `localStorage`, que es síncrono. En React
 * Native el equivalente es AsyncStorage y devuelve promesas, así que todo lo
 * que leía el estado inicial de forma directa ahora pasa por un effect.
 *
 * Nunca tiran: si el almacenamiento falla (modo privado, cuota llena, un JSON
 * escrito a mano) `readJSON` devuelve el fallback y `writeJSON` devuelve false.
 */
export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
