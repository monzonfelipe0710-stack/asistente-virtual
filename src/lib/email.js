import { EMAIL_CONFIG } from "./emailConfig";

function isConfigured() {
  const { enabled, publicKey, serviceId, templateId } = EMAIL_CONFIG;
  return (
    enabled &&
    publicKey &&
    serviceId &&
    templateId &&
    !publicKey.startsWith("PEGÁ") &&
    !serviceId.startsWith("PEGÁ") &&
    !templateId.startsWith("PEGÁ")
  );
}

// Envía el mail de recuperación por EmailJS. Devuelve { sent: true/false }.
// Si no está configurado (o falla), el llamador muestra el enlace en pantalla.
export async function sendResetEmail({ to, name, link }) {
  if (!isConfigured()) return { sent: false, reason: "not-configured" };
  try {
    const emailjs = (await import("@emailjs/browser")).default;
    await emailjs.send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.templateId,
      {
        to_email: to,
        email: to,
        to: to,
        user_name: name,
        reset_link: link,
      },
      { publicKey: EMAIL_CONFIG.publicKey }
    );
    return { sent: true };
  } catch (err) {
    const detail =
      (err && (err.text || err.message)) || String(err) || "error desconocido";
    try {
      console.error("[EmailJS] No se pudo enviar el mail:", detail);
    } catch {
      /* noop */
    }
    return { sent: false, reason: "send-failed", detail };
  }
}
