// app.ts
// Configura la aplicación Express: middlewares y rutas. No enciende el servidor (eso lo hace server.ts).

import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

app.use(cors());         // permite que Angular (puerto 4200) se conecte
app.use(express.json({ limit: '1mb' })); // recibe datos en JSON (el límite permite la selfie del heredero)

// Ruta raíz: solo confirma que el servidor está encendido
app.get('/', (_req, res) => {
  res.send('Servidor de LegadoSeguroWeb activo');
});

app.use('/api', routes);

export default app;
