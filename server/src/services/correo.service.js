import { transporter } from '../config/correo.js';

const REMITENTE = `ChatAP <${process.env.SMTP_USER}>`;

export const enviarCorreo = async ({ to, subject, html, text }) => {
  return transporter.sendMail({ from: REMITENTE, to, subject, html, text });
};

export const enviarRecuperacion = async (email, nombre, link) => {
  const subject = 'Restablecer tu contraseña — ChatAP';
  const text =
    `Hola ${nombre},\n\n` +
    `Recibimos un pedido para restablecer tu contraseña. ` +
    `Entrá al siguiente enlace para elegir una nueva (vence en 1 hora):\n\n${link}\n\n` +
    `Si no fuiste vos, ignorá este correo.`;
  const html = `
    <p>Hola ${nombre},</p>
    <p>Recibimos un pedido para restablecer tu contraseña. Hacé clic en el botón para elegir una nueva. El enlace vence en 1 hora.</p>
    <p><a href="${link}" style="background:#1d4ed8;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">Restablecer contraseña</a></p>
    <p>Si el botón no funciona, copiá este enlace:<br><span>${link}</span></p>
    <p style="color:#666;font-size:13px">Si no pediste esto, ignorá este correo.</p>
  `;
  return enviarCorreo({ to: email, subject, html, text });
};