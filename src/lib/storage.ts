import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * El panel web guardaba todo en `localStorage`, que es síncrono. En React
 * Native el equivalente es AsyncStorage y devuelve promesas, así que todo lo
 * que leía el estado inicial de forma directa ahora pasa por un effect.
 *
 * Nunca tira: si el almacenamiento falla (modo privado, cuota llena, un JSON
 * escrito a mano) se devuelve el fallback y la app sigue andando.
 */
export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* cuota / almacenamiento no disponible */
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    /* noop */
  }
}
