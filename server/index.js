import 'dotenv/config';
import app from './app.js'

// Falla temprano y con un mensaje claro en vez de romper en el primer login.
const requeridas = ['DATABASE_URL', 'JWT_SECRET'];
const faltantes = requeridas.filter((v) => !process.env[v]);

if (faltantes.length > 0) {
  console.error(`Faltan variables de entorno obligatorias: ${faltantes.join(', ')}`);
  console.error('Revisá tu archivo .env (podés guiarte con .env.example).');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=> {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
