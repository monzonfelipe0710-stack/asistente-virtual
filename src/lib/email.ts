import { EMAIL_CONFIG } from "./emailConfig";

/**
 * Envío del mail de recuperación por EmailJS.
 *
 * El panel web usaba el SDK `@emailjs/browser`, que depende del DOM. Acá se
 * llama la misma API REST con `fetch`: es la única llamada que hacía el SDK, y
 * así no entra una dependencia que en nativo no correría.
 */

const ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

export interface SendResult {
  sent: boolean;
  reason?: "not-configured" | "send-failed";
  detail?: string;
}

function isConfigured(): boolean {
  const { enabled, publicKey, serviceId, templateId } = EMAIL_CONFIG;
  return Boolean(
    enabled &&
      publicKey &&
      serviceId &&
      templateId &&
      !publicKey.startsWith("PEGÁ") &&
      !serviceId.startsWith("PEGÁ") &&
      !templateId.startsWith("PEGÁ")
  );
}

export async function sendResetEmail({
  to,
  name,
  link,
}: {
  to: string;
  name: string;
  link: string;
}): Promise<SendResult> {
  if (!isConfigured()) return { sent: false, reason: "not-configured" };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAIL_CONFIG.serviceId,
        template_id: EMAIL_CONFIG.templateId,
        user_id: EMAIL_CONFIG.publicKey,
        template_params: {
          to_email: to,
          email: to,
          to,
          user_name: name,
          reset_link: link,
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { sent: false, reason: "send-failed", detail: detail || `HTTP ${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { sent: false, reason: "send-failed", detail };
  }
}
