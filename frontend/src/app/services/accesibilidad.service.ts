import { Injectable, effect, inject, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';

export type Tema = 'claro' | 'oscuro';

const CLAVE = 'lg_accesibilidad';
// Tamaños de letra disponibles, en porcentaje del tamaño normal
export const ESCALAS = [100, 115, 130, 150];

// Preferencias de accesibilidad: tema claro u oscuro, tamaño de letra y alto contraste.
// Se guardan en el navegador y se aplican sobre la etiqueta <html>, así cambian todas las pantallas a la vez.
@Injectable({ providedIn: 'root' })
export class AccesibilidadService {
  tema = signal<Tema>('claro');
  escala = signal(100);
  contrasteAlto = signal(false);
  leyendo = signal(false);
  vozDisponible = 'speechSynthesis' in window;

  constructor() {
    this.cargar();
    effect(() => this.aplicar());

    // La lectura en voz alta se detiene al cambiar de pantalla
    inject(Router).events.subscribe(e => { if (e instanceof NavigationStart) this.detenerLectura(); });
  }

  alternarTema(): void {
    this.tema.update(t => (t === 'claro' ? 'oscuro' : 'claro'));
  }

  cambiarEscala(paso: 1 | -1): void {
    const i = ESCALAS.indexOf(this.escala()) + paso;
    this.escala.set(ESCALAS[Math.min(Math.max(i, 0), ESCALAS.length - 1)]);
  }

  restablecer(): void {
    this.tema.set('claro');
    this.escala.set(100);
    this.contrasteAlto.set(false);
  }

  // Lee en voz alta el contenido de la pantalla con las voces del navegador (de preferencia las locales)
  leerPagina(): void {
    if (!this.vozDisponible) return;
    if (this.leyendo()) { this.detenerLectura(); return; }

    const texto = document.getElementById('contenido')?.innerText.trim();
    if (!texto) return;

    const voces = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('es'));
    const voz = voces.find(v => v.localService) ?? voces[0];
    const trozos = this.dividir(texto.slice(0, 4000));

    this.leyendo.set(true);
    trozos.forEach((trozo, i) => {
      const dicho = new SpeechSynthesisUtterance(trozo);
      dicho.lang = voz?.lang ?? 'es-ES';
      if (voz) dicho.voice = voz;
      if (i === trozos.length - 1) dicho.onend = () => this.leyendo.set(false);
      dicho.onerror = () => this.leyendo.set(false);
      speechSynthesis.speak(dicho);
    });
  }

  detenerLectura(): void {
    if (this.vozDisponible) speechSynthesis.cancel();
    this.leyendo.set(false);
  }

  // Los navegadores cortan las lecturas largas: se leen por trozos de unos 200 caracteres
  private dividir(texto: string): string[] {
    const trozos: string[] = [];
    let actual = '';
    for (const frase of texto.match(/[^.!?\n]+[.!?\n]*/g) ?? []) {
      if ((actual + frase).length > 200 && actual) { trozos.push(actual); actual = ''; }
      actual += frase;
    }
    if (actual.trim()) trozos.push(actual);
    return trozos;
  }

  private cargar(): void {
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
      if (g) {
        this.tema.set(g.tema === 'oscuro' ? 'oscuro' : 'claro');
        this.escala.set(ESCALAS.includes(g.escala) ? g.escala : 100);
        this.contrasteAlto.set(g.contrasteAlto === true);
        return;
      }
    } catch { /* sin preferencias guardadas */ }

    // Primera vez: se respeta la preferencia del sistema operativo
    this.tema.set(matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro');
    this.contrasteAlto.set(matchMedia('(prefers-contrast: more)').matches);
  }

  private aplicar(): void {
    const raiz = document.documentElement;
    raiz.setAttribute('data-tema', this.tema());
    raiz.setAttribute('data-bs-theme', this.tema() === 'oscuro' ? 'dark' : 'light');
    raiz.setAttribute('data-contraste', this.contrasteAlto() ? 'alto' : 'normal');
    raiz.style.fontSize = `${this.escala()}%`;

    try {
      localStorage.setItem(CLAVE, JSON.stringify({ tema: this.tema(), escala: this.escala(), contrasteAlto: this.contrasteAlto() }));
    } catch { /* si el navegador no deja guardar, las preferencias duran solo esta visita */ }
  }
}
