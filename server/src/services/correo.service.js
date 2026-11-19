import { transporter } from '../config/correo.js';

const REMITENTE = `ChatAP <${process.env.SMTP_USER}>`;

const escaparHtml = (texto = '') =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const enviarCorreo = async ({ to, subject, html, text }) => {
  return transporter.sendMail({ from: REMITENTE, to, subject, html, text });
};

export const enviarRecuperacion = async (email, nombre, link) => {
  const subject = 'Restablecimiento de contraseña — ChatAP';
  const nombreSeguro = escaparHtml(nombre);

  const text =
    `Hola ${nombre},\n\n` +
    `Recibimos un pedido para restablecer tu contraseña. ` +
    `Entrá al siguiente enlace para elegir una nueva (vence en 1 hora):\n\n${link}\n\n` +
    `Si no fuiste vos, ignorá este correo.`;

  const html = `
  <table cellpadding="0" cellspacing="0" border="0" style="max-width:600px; margin:0 auto; font-family:Arial,sans-serif;">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background:#f9f9f9; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="padding:40px 30px 30px;">
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%">
                <tr>
                  <td style="color:#333333; font-size:18px; line-height:1.5; font-family:Arial,sans-serif;">
                    <p style="margin:0 0 15px;">Hola <strong>${nombreSeguro}</strong>,</p>
                    <p style="margin:0 0 15px;">Recibimos un pedido para restablecer tu contraseña. Hacé clic en el botón para elegir una nueva. El enlace vence en 1 hora.</p>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%; margin:30px 0;">
                <tr>
                  <td align="center" style="padding:10px 0;">
                    <a href="${link}" target="_blank" style="display:inline-block; background:#005a9c; color:#ffffff; text-decoration:none; font-size:16px; font-weight:bold; padding:12px 24px; border-radius:4px;">Restablecer contraseña</a>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%; font-size:12px; color:#666666; line-height:1.4; font-family:Arial,sans-serif;">
                <tr>
                  <td style="padding-top:10px;">
                    <p style="margin:0;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br/>
                      <a href="${link}" style="color:#666666; text-decoration:underline;">${link}</a></p>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%; margin-top:30px; border-top:1px solid #dddddd;">
                <tr>
                  <td style="color:#999999; font-size:12px; line-height:1.4; font-family:Arial,sans-serif; padding-top:20px;">
                    <p style="margin:0;">Si no solicitaste este cambio, ignorá este email. Tu contraseña no será afectada.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

  return enviarCorreo({ to: email, subject, html, text });
};