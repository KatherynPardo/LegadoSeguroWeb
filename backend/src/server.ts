// server.ts
// Punto de entrada del backend: enciende el servidor en el puerto configurado
// y programa el monitoreo de inactividad.

import app from './app';
import { PORT } from './config/env';
import { detectarInactividad } from './services/monitoreo.service';

const CADA_HORA = 60 * 60 * 1000;

async function monitorear() {
  try {
    const iniciados = await detectarInactividad();
    if (iniciados > 0) console.log(`Monitoreo: se iniciaron ${iniciados} proceso(s) de liberación`);
  } catch (error) {
    console.error('Error en el monitoreo de inactividad:', error);
  }
}

app.listen(PORT, () => {
  console.log(`Servidor LegadoSeguroWeb en http://localhost:${PORT}`);

  monitorear();                     // una revisión al encender
  setInterval(monitorear, CADA_HORA); // y luego cada hora
});
