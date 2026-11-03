// server.ts
// Punto de entrada del backend: enciende el servidor en el puerto configurado
// y programa el monitoreo de inactividad.

import app from './app';
import { PORT } from './config/env';
import { ejecutarMonitoreo } from './services/monitoreo.service';

const CADA_HORA = 60 * 60 * 1000;

async function monitorear() {
  try {
    const r = await ejecutarMonitoreo();
    if (r.alertas + r.iniciados + r.liberados > 0) {
      console.log(`Monitoreo: ${r.alertas} alerta(s), ${r.iniciados} proceso(s) iniciado(s), ${r.liberados} liberado(s)`);
    }
  } catch (error) {
    console.error('Error en el monitoreo de inactividad:', error);
  }
}

app.listen(PORT, () => {
  console.log(`Servidor LegadoSeguroWeb en http://localhost:${PORT}`);

  monitorear();                     // una revisión al encender
  setInterval(monitorear, CADA_HORA); // y luego cada hora
});
