import 'dotenv/config';

// Falla temprano y con un mensaje claro en vez de romper en el primer login.
const requeridas = [
  'DATABASE_URL',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'R2_ACCOUNT_ENDPOINT',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'FRONTEND_URL',
  'SMTP_USER',
  'SMTP_PASS',
];
const faltantes = requeridas.filter((v) => !process.env[v]);

if (faltantes.length > 0) {
  console.error(`Faltan variables de entorno obligatorias: ${faltantes.join(', ')}`);
  console.error('Revisá tu archivo .env (podés guiarte con .env.example).');
  process.exit(1);
}

// Import dinámico a propósito: los import estáticos se evalúan antes que este
// archivo, y el cliente de OpenAI lanza al construirse si falta su API key, lo que
// taparía el mensaje de arriba.
const { default: app } = await import('./app.js');

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=> {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
