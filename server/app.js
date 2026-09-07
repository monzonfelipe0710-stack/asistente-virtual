import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './src/routes/auth.routes.js'
import { errorHandler } from './src/middlewares/error.middleware.js';
import usuarioRoutes from './src/routes/usuario.routes.js';
import sectorRoutes from './src/routes/sector.routes.js'

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) =>{
  res.json({ status: 'ok', servicio: 'ChatAP API' });
});

app.use('/api/auth', authRoutes);

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sectores', sectorRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.use(errorHandler);

export default app;