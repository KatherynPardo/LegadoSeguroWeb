// server.ts
// Punto de entrada del backend: enciende el servidor en el puerto configurado.

import app from './app';
import { PORT } from './config/env';

app.listen(PORT, () => {
  console.log(`Servidor LegadoSeguroWeb en http://localhost:${PORT}`);
});
