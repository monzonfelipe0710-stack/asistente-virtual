import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify()
  .then(() => console.log('✓ Servicio de correo listo (SMTP conectado).'))
  .catch((err) => console.error('✗ Error de conexión con el servidor de correo:', err.message));