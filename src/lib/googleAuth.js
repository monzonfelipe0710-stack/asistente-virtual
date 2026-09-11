// Helper de Integración con Google Identity Services (OAuth 2.0)

export const GOOGLE_CLIENT_ID_KEY = "chatap.google_client_id";

export function getGoogleClientId() {
  if (typeof window === "undefined") return "";
  const fromEnv = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  try {
    return window.localStorage.getItem(GOOGLE_CLIENT_ID_KEY) || "";
  } catch {
    return "";
  }
}

export function saveGoogleClientId(clientId) {
  if (typeof window === "undefined") return;
  try {
    if (clientId && clientId.trim()) {
      window.localStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId.trim());
    } else {
      window.localStorage.removeItem(GOOGLE_CLIENT_ID_KEY);
    }
  } catch {
    /* noop */
  }
}

/**
 * Inicia el flujo real de autenticación de Google con ventana emergente oficial (accounts.google.com).
 * Requiere un Google Client ID válido creado en Google Cloud Console.
 */
export function startGoogleOAuth({ clientId, onSuccess, onError }) {
  if (typeof window === "undefined" || !window.google?.accounts?.oauth2) {
    onError?.(
      new Error(
        "El servicio de Google Identity aún se está cargando. Verificá tu conexión a internet o reintentá en unos segundos."
      )
    );
    return;
  }

  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          onError?.(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }
        if (!tokenResponse.access_token) {
          onError?.(new Error("No se recibió token de acceso de Google."));
          return;
        }

        try {
          // Obtiene los datos del perfil real del usuario desde la API oficial de Google
          const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          });

          if (!userInfoRes.ok) {
            throw new Error("No se pudo obtener la información de tu cuenta de Google.");
          }

          const userInfo = await userInfoRes.json();
          onSuccess?.({
            name: userInfo.name || userInfo.given_name || "Usuario de Google",
            email: userInfo.email,
            avatar: userInfo.picture || "",
            googleId: userInfo.sub,
          });
        } catch (fetchErr) {
          onError?.(fetchErr);
        }
      },
    });

    // Abre la ventana emergente oficial de Google
    tokenClient.requestAccessToken({ prompt: "select_account" });
  } catch (err) {
    onError?.(err);
  }
}
