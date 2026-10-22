/**
 * Intenta ofrecer las credenciales al gestor del navegador cuando la API está
 * disponible. Chrome decide si muestra el aviso; la web no puede forzarlo.
 * Los atributos autocomplete del formulario también permiten que el gestor
 * detecte el inicio de sesión aunque PasswordCredential no esté disponible.
 */
export async function promptSaveCredentials({ username, password, name }) {
  if (typeof window === "undefined" || !username || !password) return;

  try {
    if (typeof window.PasswordCredential !== "function" || !navigator.credentials?.store) {
      return;
    }

    const options = {
      id: String(username).trim(),
      password: String(password),
    };
    if (name) options.name = String(name).trim();

    const credential = new window.PasswordCredential(options);
    await navigator.credentials.store(credential);
  } catch {
    // La compatibilidad y las preferencias del navegador controlan este aviso.
    // No debe impedir el acceso a la cuenta si la API no está disponible.
  }
}
