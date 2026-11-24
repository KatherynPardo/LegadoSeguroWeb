import { Injectable } from '@angular/core';
import type { FaceDetector } from '@mediapipe/tasks-vision';

// Los archivos del modelo se piden al navegador solo cuando se elige una foto; la imagen NUNCA sale del equipo.
const VERSION = '1.2.3'; // la misma de @mediapipe/tasks-vision en package.json
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`;
const MODELO = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

// Revisa en el navegador (con un modelo de visión por computador) que la selfie sea de una persona y esté bien encuadrada.
// Es una ayuda para quien sube la foto: no reemplaza una verificación facial real.
@Injectable({ providedIn: 'root' })
export class RostroService {
  private detector: Promise<FaceDetector> | null = null;

  private cargar(): Promise<FaceDetector> {
    // La librería se descarga aparte (import dinámico) para no hacer más pesada la página principal
    this.detector ??= import('@mediapipe/tasks-vision').then(async ({ FaceDetector, FilesetResolver }) => {
      const archivos = await FilesetResolver.forVisionTasks(WASM);
      return FaceDetector.createFromOptions(archivos, {
        baseOptions: { modelAssetPath: MODELO },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.6
      });
    });
    return this.detector;
  }

  // Devuelve null si la foto sirve, o un mensaje que explica qué corregir.
  // Si el modelo no se puede cargar (sin internet), devuelve null: la foto sigue su camino y no se bloquea al usuario.
  async revisar(foto: HTMLCanvasElement): Promise<string | null> {
    let detector: FaceDetector;
    try {
      detector = await this.cargar();
    } catch {
      this.detector = null; // se vuelve a intentar la próxima vez
      return null;
    }

    const rostros = detector.detect(foto).detections;
    if (rostros.length === 0) return 'No se detecta ningún rostro. Toma una selfie donde se vea tu cara de frente.';
    if (rostros.length > 1) return 'Se detecta más de un rostro. En la foto debes salir solo tú.';

    const caja = rostros[0].boundingBox;
    if (!caja) return 'No se pudo medir tu rostro. Intenta con otra foto.';

    const ancho = caja.width / foto.width;
    if (ancho < 0.25) return 'Tu rostro se ve muy pequeño. Acércate a la cámara.';
    if (ancho > 0.85) return 'Tu rostro ocupa demasiado espacio. Aléjate un poco para que se vea completo.';

    const centroX = (caja.originX + caja.width / 2) / foto.width;
    const centroY = (caja.originY + caja.height / 2) / foto.height;
    if (centroX < 0.25 || centroX > 0.75 || centroY < 0.15 || centroY > 0.85) return 'Centra tu rostro en la foto.';

    return null;
  }
}
