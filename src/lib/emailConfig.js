// Configuración del envío REAL de mails (EmailJS → Gmail).
//
// Para activarlo completá estos pasos UNA sola vez:
//   1. Creá una cuenta en https://www.emailjs.com (plan gratis alcanza).
//   2. En "Email Services" agregá Gmail y conectá tu cuenta de correo.
//   3. En "Email Templates" creá una plantilla con estos campos tal cual:
//        Para:      {{to_email}}
//        Asunto:    Recuperá tu contraseña de ChatAP
//        Mensaje:   Hola {{user_name}}, pediste restablecer tu contraseña.
//                   Entrá acá (válido por 1 hora): {{reset_link}}
//   4. Copiá tu Public Key (Account → General), el Service ID y el Template ID,
//      pegalos acá abajo y poné enabled: true.
//
// Mientras enabled sea false, la app sigue mostrando el enlace en pantalla
// (modo demostración) en vez de enviar el mail.

export const EMAIL_CONFIG = {
  enabled: true,
  publicKey: "BnJki79sEjPiDcu3-",
  serviceId: "service_3yy1dgc",
  templateId: "template_2z8x10h",
};
