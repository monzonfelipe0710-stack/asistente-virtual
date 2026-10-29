import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './src/routes/auth.routes.js'
import { errorHandler } from './src/middlewares/error.middleware.js';
import usuarioRoutes from './src/routes/usuario.routes.js';
import sectorRoutes from './src/routes/sector.routes.js'
import tramiteRoutes from './src/routes/tramite.routes.js';
import chatRoutes from './src/routes/chat.routes.js';
import metricaRoutes from './src/routes/metrica.routes.js';
import consultaRoutes from './src/routes/consulta.routes.js';
import mesaRoutes from './src/routes/mesa.routes.js';
import { origenesPermitidos } from './src/config/origenes.js';

const app = express();

// Detrás de un reverse proxy (nginx, Railway, Render) Express ve la IP del proxy
// y el rate limiter termina limitando a todos los clientes en conjunto.
// TRUST_PROXY indica cuántos saltos confiar. Queda apagado por defecto a
// propósito: confiar de más permite falsear la IP con X-Forwarded-For y saltear
// el límite, así que solo se activa donde realmente hay un proxy adelante.
if (process.env.TRUST_PROXY) {
  const saltos = Number(process.env.TRUST_PROXY);
  app.set('trust proxy', Number.isNaN(saltos) ? process.env.TRUST_PROXY : saltos);
}

app.use(helmet());
app.use(cors({ origin: origenesPermitidos }));
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) =>{
  res.json({ status: 'ok', servicio: 'ChatAP API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/sectores', sectorRoutes);
app.use('/api/tramites', tramiteRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/metricas', metricaRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/mesas', mesaRoutes);

// Cualquier ruta no registrada responde JSON, no el HTML por defecto de Express.
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.use(errorHandler);

export default app;
