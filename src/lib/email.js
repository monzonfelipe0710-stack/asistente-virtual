import { EMAIL_CONFIG } from "./emailConfig";

const STORAGE_KEY = "chatap.email_config";

export function getEmailConfig() {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...EMAIL_CONFIG, ...parsed };
    }
  } catch {
    /* noop */
  }
  return EMAIL_CONFIG;
}

export function saveEmailConfig(cfg) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    }
  } catch {
    /* noop */
  }
}

export function isEmailConfigured(cfg = getEmailConfig()) {
  const { enabled, publicKey, serviceId, templateId } = cfg || {};
  return Boolean(
    enabled &&
    publicKey &&
    serviceId &&
    templateId &&
    !String(publicKey).startsWith("PEGÁ") &&
    !String(serviceId).startsWith("PEGÁ") &&
    !String(templateId).startsWith("PEGÁ")
  );
}

/**
 * Envía el mail de recuperación por EmailJS.
 * Utiliza @emailjs/browser con respaldo directo al REST API para máxima fiabilidad.
 * Devuelve { sent: true } o { sent: false, reason, detail }.
 */
export async function sendResetEmail({ to, name, link, token }) {
  const config = getEmailConfig();
  if (!isEmailConfigured(config)) {
    return { sent: false, reason: "not-configured" };
  }

  const recipientName = name || to.split("@")[0] || "Usuario";
  const templateParams = {
    to_email: to,
    email: to,
    to: to,
    recipient_email: to,
    user_name: recipientName,
    name: recipientName,
    to_name: recipientName,
    reset_link: link,
    link: link,
    url: link,
    token: token || "",
    app_name: "ChatAP - Formosa",
    subject: "Recuperá tu contraseña de ChatAP",
    message: `Hola ${recipientName},\n\nRecibimos una solicitud para restablecer tu contraseña en ChatAP (Gobierno de Formosa).\n\nHacé clic en el siguiente enlace para crear una nueva contraseña:\n${link}\n\nSi no fuiste vos quien lo solicitó, podés ignorar este correo de forma segura.\n\nAtentamente,\nEquipo de ChatAP · Formosa`,
  };

  // 1. Intento principal con @emailjs/browser
  try {
    const emailjs = (await import("@emailjs/browser")).default;
    const res = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      { publicKey: config.publicKey }
    );
    if (res?.status === 200 || res?.text === "OK") {
      return { sent: true };
    }
  } catch (sdkErr) {
    console.warn("[EmailJS SDK fallback] Intentando REST API directo:", sdkErr);
  }

  // 2. Respaldo directo a la API REST de EmailJS (por si un adblocker bloquea el SDK)
  try {
    const resp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: config.serviceId,
        template_id: config.templateId,
        user_id: config.publicKey,
        template_params: templateParams,
      }),
    });

    if (resp.ok) {
      return { sent: true };
    }
    const text = await resp.text().catch(() => "");
    return {
      sent: false,
      reason: "send-failed",
      detail: text || `HTTP ${resp.status}`,
    };
  } catch (fetchErr) {
    const detail =
      (fetchErr && (fetchErr.text || fetchErr.message)) ||
      String(fetchErr) ||
      "Error desconocido de conexión";
    console.error("[EmailJS REST] Falló el envío:", detail);
    return { sent: false, reason: "send-failed", detail };
  }
}

