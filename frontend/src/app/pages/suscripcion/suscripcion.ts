import { Component, ElementRef, OnInit, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { Modal } from '../../components/modal/modal';
import { DocumentoLegal } from '../../components/documento-legal/documento-legal';
import { Idioma, TERMINOS } from '../../core/legal';
import { SuscripcionService } from '../../services/suscripcion.service';
import { EmpresaSunat, PagoIniciado, Plan, ResultadoPago, Suscripcion as DatosSuscripcion } from '../../models/suscripcion.model';

@Component({
  selector: 'app-suscripcion',
  imports: [DatePipe, DecimalPipe, DocumentoLegal, Modal],
  templateUrl: './suscripcion.html',
  styleUrl: './suscripcion.css'
})
export class Suscripcion implements OnInit {
  datos = signal<DatosSuscripcion | null>(null);
  mensaje = signal('');
  error = signal('');
  pagando = signal(false);
  planAPagar = signal<Plan | null>(null);

  // Términos y condiciones que se muestran y se aceptan dentro del proceso de compra
  terminos = TERMINOS;
  idiomaTerminos = signal<Idioma>('es');
  aceptoTerminos = signal(false);

  // Comprobante: boleta con el DNI del usuario, o factura con RUC y razón social
  tipoComprobante = signal<'BOLETA' | 'FACTURA'>('BOLETA');
  ruc = signal('');
  razonSocial = signal('');
  buscandoRuc = signal(false);
  empresa = signal<EmpresaSunat | null>(null);
  errorRuc = signal('');

  // Resultado de un pago (aprobado con su comprobante, o rechazado/observado con la respuesta de Niubiz)
  resultado = signal<ResultadoPago | null>(null);
  descargando = signal(false);

  // Lugar donde se inserta el formulario de pago de Niubiz
  private contenedorPago = viewChild<ElementRef<HTMLElement>>('contenedorPago');

  constructor(private suscripcionService: SuscripcionService, private route: ActivatedRoute, private location: Location) {}

  ngOnInit(): void {
    this.cargar();
    this.mostrarResultadoDelPago();
  }

  cargar(): void {
    this.suscripcionService.getSuscripcion().subscribe(data => this.datos.set(data));
  }

  esActual(plan: Plan): boolean {
    return plan.id === this.datos()?.idPlanActual;
  }

  planActual(): Plan | undefined {
    return this.datos()?.planes.find(p => p.id === this.datos()?.idPlanActual);
  }

  elegir(plan: Plan): void {
    this.mensaje.set('');
    this.error.set('');

    this.suscripcionService.elegirPlan(plan.id).subscribe({
      next: r => {
        this.mensaje.set(r.mensaje);
        this.cargar();
      },
      error: err => this.error.set(err.error?.mensaje ?? 'No se pudo cambiar el plan')
    });
  }

  // Paso de la compra: primero se aceptan los términos, luego se abre el formulario de Niubiz
  paso = signal<'resumen' | 'pago'>('resumen');

  abrirCompra(plan: Plan): void {
    this.mensaje.set('');
    this.error.set('');
    this.aceptoTerminos.set(false);
    this.tipoComprobante.set('BOLETA');
    this.ruc.set('');
    this.razonSocial.set('');
    this.empresa.set(null);
    this.errorRuc.set('');
    this.paso.set('resumen');
    this.planAPagar.set(plan);
  }

  // Pide al backend preparar el pago, monta el formulario de Niubiz y abre su ventana
  confirmarPago(): void {
    const plan = this.planAPagar();
    if (!plan || this.pagando() || !this.aceptoTerminos()) return;
    this.error.set('');

    // Para la factura se piden el RUC y la razón social (el servidor vuelve a validarlos)
    const factura = this.tipoComprobante() === 'FACTURA';
    if (factura && !/^(10|15|17|20)\d{9}$/.test(this.ruc().trim())) {
      this.error.set('El RUC debe tener 11 dígitos y empezar con 10 o 20');
      return;
    }
    if (factura && this.razonSocial().trim().length < 3) {
      this.error.set('Escribe la razón social para la factura');
      return;
    }
    this.pagando.set(true);

    const comprobante = factura
      ? { tipo: 'FACTURA' as const, ruc: this.ruc().trim(), razonSocial: this.razonSocial().trim() }
      : { tipo: 'BOLETA' as const };
    this.suscripcionService.iniciarPago(plan.id, true, comprobante).subscribe({
      next: pago => {
        this.montarFormulario(pago);
        this.paso.set('pago');
        this.pagando.set(false);
        this.abrirVentanaNiubiz(50);
      },
      error: err => {
        this.error.set(err.error?.mensaje ?? 'No se pudo iniciar el pago');
        this.pagando.set(false);
      }
    });
  }

  // Cambiar el RUC invalida los datos de la empresa que se habían traído
  cambiarRuc(valor: string): void {
    this.ruc.set(valor.replace(/\D/g, ''));
    this.empresa.set(null);
    this.errorRuc.set('');
  }

  // Trae la razón social y el estado de la empresa desde la SUNAT
  buscarRuc(): void {
    const ruc = this.ruc().trim();
    this.errorRuc.set('');
    if (!/^(10|15|17|20)\d{9}$/.test(ruc)) {
      this.errorRuc.set('El RUC debe tener 11 dígitos y empezar con 10 o 20');
      return;
    }
    this.buscandoRuc.set(true);
    this.suscripcionService.buscarRuc(ruc).subscribe({
      next: e => {
        this.empresa.set(e);
        this.razonSocial.set(e.razonSocial);
        this.buscandoRuc.set(false);
      },
      error: err => {
        this.errorRuc.set(err.error?.mensaje ?? 'No se pudo consultar el RUC');
        this.buscandoRuc.set(false);
      }
    });
  }

  reabrirPago(): void {
    this.abrirVentanaNiubiz(50);
  }

  // El script de Niubiz agrega su botón al cargar: se espera a que exista y se pulsa para abrir su ventana
  private abrirVentanaNiubiz(intentos: number): void {
    const boton = this.contenedorPago()?.nativeElement.querySelector<HTMLButtonElement>('.start-js-btn');
    if (boton) { boton.click(); return; }
    if (intentos <= 0) { this.error.set('No se pudo abrir el formulario de pago. Inténtalo de nuevo.'); return; }
    setTimeout(() => this.abrirVentanaNiubiz(intentos - 1), 100);
  }

  cerrarCompra(): void {
    this.planAPagar.set(null);
    this.paso.set('resumen');
    this.error.set('');
    this.contenedorPago()?.nativeElement.replaceChildren();
  }

  // El script de Niubiz lee sus datos de los atributos data-* de su propia etiqueta y pone el botón "Pagar" dentro
  // del formulario; al pagar, el navegador envía el resultado a la dirección del backend (urlRespuesta).
  private montarFormulario(pago: PagoIniciado): void {
    const contenedor = this.contenedorPago()?.nativeElement;
    if (!contenedor) return;

    const formulario = document.createElement('form');
    formulario.method = 'post';
    formulario.action = pago.urlRespuesta;

    const script = document.createElement('script');
    script.src = pago.urlScript;
    const atributos: Record<string, string> = {
      sessiontoken: pago.sessionKey,
      channel: 'web',
      merchantid: pago.merchantId,
      merchantname: 'LegadoSeguro',
      purchasenumber: String(pago.numeroPedido),
      amount: pago.monto.toFixed(2),
      expirationminutes: '10',
      timeouturl: pago.urlVencido
    };
    // Con el correo del usuario el formulario no lo pide; en pruebas se omite para poder escribir accept@, review@ o reject@
    if (pago.correo) atributos['cardholderemail'] = pago.correo;
    for (const [nombre, valor] of Object.entries(atributos)) script.setAttribute(`data-${nombre}`, valor);

    formulario.appendChild(script);
    contenedor.replaceChildren(formulario);
  }

  // Al volver de Niubiz la dirección trae ?pedido=N: se consulta su resultado y se muestra en una ventana
  private mostrarResultadoDelPago(): void {
    const pedido = Number(this.route.snapshot.queryParamMap.get('pedido'));
    if (!Number.isInteger(pedido) || pedido <= 0) return;

    this.suscripcionService.getResultadoPago(pedido).subscribe({
      next: r => {
        this.resultado.set(r);
        this.location.replaceState('/suscripcion'); // al recargar la página no se vuelve a abrir
        this.cargar();
      },
      error: err => this.error.set(err.error?.mensaje ?? 'No se pudo consultar el pago')
    });
  }

  // Detalle de un pago del historial
  verDetalle(numeroPedido: number | null): void {
    if (!numeroPedido) return;
    this.suscripcionService.getResultadoPago(numeroPedido).subscribe({
      next: r => this.resultado.set(r),
      error: err => this.error.set(err.error?.mensaje ?? 'No se pudo consultar el pago')
    });
  }

  cerrarResultado(): void {
    this.resultado.set(null);
  }

  tituloResultado(estado: string): string {
    switch (estado) {
      case 'COMPLETADO': return 'Pago exitoso';
      case 'DENEGADO': return 'Pago rechazado';
      case 'OBSERVADO': return 'Pago observado';
      case 'PROCESANDO': return 'Pago en proceso';
      case 'REVISAR': return 'Pago por confirmar';
      default: return 'Pago no completado';
    }
  }

  // Si el pago no se hizo, se ofrece volver a intentarlo con el mismo plan
  reintentar(r: ResultadoPago): void {
    const plan = this.datos()?.planes.find(p => p.nombre === r.plan);
    this.resultado.set(null);
    if (plan) this.abrirCompra(plan);
  }

  // Baja la boleta o factura en PDF. La ruta pide sesión, por eso se descarga con la petición y no con un enlace directo.
  descargar(numeroPedido: number | null, comprobante: string | null, tipo?: string): void {
    if (!numeroPedido || this.descargando()) return;
    this.descargando.set(true);
    this.suscripcionService.descargarComprobante(numeroPedido).subscribe({
      next: blob => {
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(blob);
        const prefijo = tipo === 'FACTURA' || comprobante?.startsWith('F') ? 'Factura' : 'Boleta';
        enlace.download = `${prefijo}_${comprobante ?? numeroPedido}.pdf`;
        enlace.click();
        URL.revokeObjectURL(enlace.href);
        this.descargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo descargar el comprobante');
        this.descargando.set(false);
      }
    });
  }
}
