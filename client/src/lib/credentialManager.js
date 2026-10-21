/**
 * Utilidad para invocar la API nativa de credenciales del navegador (Credential Management API / PasswordCredential).
 * Esto le indica activamente a Google Chrome / Gestor de Contraseñas de Google que pregunte al usuario
 * si desea guardar su correo/usuario y contraseña para el sitio.
 */
export async function promptSaveCredentials({ username, password, name }) {
  if (typeof window === "undefined") return;

  // 1. Si el navegador soporta PasswordCredential (Google Chrome / Chromium / Edge)
  if (window.PasswordCredential && navigator.credentials?.store) {
    try {
      const cred = new window.PasswordCredential({
        id: String(username || "").trim(),
        password: String(password || ""),
        name: name ? String(name).trim() : undefined,
      });
      await navigator.credentials.store(cred);
    } catch {
      // Si la política de permisos o el usuario lo desactiva, continuamos sin interrumpir
    }
  }
}
