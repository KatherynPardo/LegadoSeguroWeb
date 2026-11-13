// app.ts
// Configura la aplicación Express: middlewares y rutas. No enciende el servidor (eso lo hace server.ts).

import express from 'express';
import cors from 'cors';
import routes from './routes';
import { TRUST_PROXY } from './config/env';

const app = express();

// Detrás de un proxy (despliegue en la nube) la IP real viene en X-Forwarded-For: así se guarda la IP correcta
// en la auditoría y el límite de pedidos por IP no cuenta la del proxy. Se activa con TRUST_PROXY en el .env.
if (TRUST_PROXY > 0) app.set('trust proxy', TRUST_PROXY);

app.use(cors());         // permite que Angular (puerto 4200) se conecte
app.use(express.json({ limit: '1mb' })); // recibe datos en JSON (el límite permite la selfie del heredero)

// Ruta raíz: solo confirma que el servidor está encendido
app.get('/', (_req, res) => {
  res.send('Servidor de LegadoSeguroWeb activo');
});

app.use('/api', routes);

export default app;
