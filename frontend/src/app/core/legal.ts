// Textos legales de LegadoSeguro: términos y condiciones (en español e inglés, como pide Niubiz) y política de privacidad.
// Son una versión de trabajo del proyecto académico, pendiente de revisión por un abogado.

// Datos de contacto del comercio (Niubiz pide correo, teléfono y dirección con ciudad y país): se cambian solo aquí
export const CONTACTO = {
  correo: 'contacto@legadoseguro.pe',
  soporte: 'soporte@legadoseguro.pe',
  privacidad: 'privacidad@legadoseguro.pe',
  telefono: '[teléfono del comercio]',
  direccion: '[dirección], [ciudad], Perú'
};

// Versión de los términos que se aceptan antes de pagar (el backend guarda la misma en la auditoría)
export const VERSION_TERMINOS = '1.0';
export const FECHA_TERMINOS = '24 de noviembre de 2026';

export type Idioma = 'es' | 'en';
export interface Seccion { titulo: string; texto: string; }
export interface Documento { titulo: string; version: string; secciones: Seccion[]; }

export const TERMINOS: Record<Idioma, Documento> = {
  es: {
    titulo: 'Términos y condiciones',
    version: `Versión ${VERSION_TERMINOS} · ${FECHA_TERMINOS}`,
    secciones: [
      { titulo: '1. Descripción del servicio', texto: 'LegadoSeguro es una plataforma web que permite registrar activos digitales (cuentas, correos, tarjetas y otros datos), designar herederos y definir una regla de liberación por inactividad. No es un servicio notarial ni de asesoría legal y no reemplaza a un testamento.' },
      { titulo: '2. Quién puede usar el servicio', texto: 'Solo pueden usarlo personas mayores de 18 años. Al registrarte declaras que tus datos son verdaderos; tu DNI se valida con RENIEC.' },
      { titulo: '3. Planes y precios', texto: 'El plan Básico es gratuito e incluye hasta 2 herederos. El plan Premium permite herederos ilimitados; su precio, en soles, se muestra en la pantalla Suscripción antes de pagar. El pago se hace con tarjeta mediante el formulario seguro de Niubiz y corresponde a un periodo mensual. LegadoSeguro no guarda los datos de tu tarjeta.' },
      { titulo: '4. Entrega del servicio', texto: 'Es un servicio digital: el plan Premium se activa en cuanto el pago es aprobado. No hay entrega física, plazos de envío, horarios ni costos de entrega. Verás el resultado del pago en la pantalla Suscripción y quedará en tu historial de pagos.' },
      { titulo: '5. Cancelación, devoluciones y reembolsos', texto: 'Puedes volver al plan Básico en cualquier momento desde la pantalla Suscripción. Como el servicio se activa de inmediato, los pagos aprobados no se devuelven, salvo error de cobro o lo que disponga la ley. Para solicitar la revisión de un cobro, escribe a ' + CONTACTO.soporte + ' o presenta una hoja en el Libro de reclamaciones.' },
      { titulo: '6. Reclamos y quejas', texto: 'Puedes presentar un reclamo (disconformidad con el servicio) o una queja (disconformidad con la atención) en el Libro de reclamaciones virtual de este sitio. Recibirás un código y una copia por correo, y te responderemos dentro del plazo que establece la ley.' },
      { titulo: '7. Tu responsabilidad', texto: 'Eres responsable de la veracidad de la información que registras, de tener derecho a entregar los activos que designas y de mantener en reserva tus credenciales. No puedes usar el servicio para fines ilícitos.' },
      { titulo: '8. Limitación de responsabilidad', texto: 'LegadoSeguro gestiona la entrega según la regla que definiste. No garantiza que bancos, redes sociales u otros terceros acepten el acceso de tus herederos a una cuenta, ni se responsabiliza por el uso que tus herederos hagan de la información que reciban.' },
      { titulo: '9. Privacidad', texto: 'Tratamos tus datos personales según la Ley N.° 29733 y nuestra Política de privacidad, que puedes leer en este sitio.' },
      { titulo: '10. Restricciones', texto: 'No conocemos restricciones legales de exportación para este servicio. Su uso se rige por las leyes del Perú.' },
      { titulo: '11. Contacto', texto: `Correo: ${CONTACTO.correo} · Teléfono: ${CONTACTO.telefono} · Dirección: ${CONTACTO.direccion}.` }
    ]
  },
  en: {
    titulo: 'Terms and conditions',
    version: `Version ${VERSION_TERMINOS} · ${FECHA_TERMINOS}`,
    secciones: [
      { titulo: '1. Description of the service', texto: 'LegadoSeguro is a web platform that lets you register digital assets (accounts, emails, cards and other data), appoint heirs and set a release rule based on inactivity. It is not a notary or legal advice service and does not replace a will.' },
      { titulo: '2. Who can use the service', texto: 'Only people over 18 may use it. By registering you declare that your data is true; your national ID (DNI) is validated with RENIEC.' },
      { titulo: '3. Plans and prices', texto: 'The Basic plan is free and includes up to 2 heirs. The Premium plan allows unlimited heirs; its price, in Peruvian soles, is shown on the Subscription screen before you pay. Payment is made by card through the secure Niubiz form and covers one month. LegadoSeguro does not store your card details.' },
      { titulo: '4. Delivery of the service', texto: 'This is a digital service: the Premium plan is activated as soon as the payment is approved. There is no physical delivery, shipping time, schedule or delivery cost. You will see the payment result on the Subscription screen and it will be kept in your payment history.' },
      { titulo: '5. Cancellation, returns and refunds', texto: 'You can go back to the Basic plan at any time from the Subscription screen. Because the service is activated immediately, approved payments are not refunded, except for a charging error or as required by law. To ask for a charge to be reviewed, write to ' + CONTACTO.soporte + ' or submit a form in the Complaints book.' },
      { titulo: '6. Claims and complaints', texto: 'You can submit a claim (dissatisfaction with the service) or a complaint (dissatisfaction with the customer service) in the virtual Complaints book of this site. You will receive a code and a copy by email, and we will answer within the period set by law.' },
      { titulo: '7. Your responsibility', texto: 'You are responsible for the accuracy of the information you register, for having the right to hand over the assets you appoint, and for keeping your credentials private. You may not use the service for unlawful purposes.' },
      { titulo: '8. Limitation of liability', texto: 'LegadoSeguro manages the handover according to the rule you defined. It does not guarantee that banks, social networks or other third parties will allow your heirs to access an account, and it is not responsible for how your heirs use the information they receive.' },
      { titulo: '9. Privacy', texto: 'We process your personal data under Peruvian Law No. 29733 and our Privacy policy, which you can read on this site (in Spanish).' },
      { titulo: '10. Restrictions', texto: 'We are not aware of any legal export restrictions for this service. Its use is governed by the laws of Peru.' },
      { titulo: '11. Contact', texto: `Email: ${CONTACTO.correo} · Phone: ${CONTACTO.telefono} · Address: ${CONTACTO.direccion}.` }
    ]
  }
};

export const PRIVACIDAD: Documento = {
  titulo: 'Política de privacidad',
  version: `Versión ${VERSION_TERMINOS} · ${FECHA_TERMINOS}`,
  secciones: [
    { titulo: '1. Quiénes somos', texto: `LegadoSeguro es el titular del banco de datos personales de sus usuarios. [Razón social y RUC por definir.] Para consultas sobre tus datos escribe a ${CONTACTO.privacidad}.` },
    { titulo: '2. Qué datos tratamos', texto: 'Del propietario: nombres, DNI, correo, teléfono, contraseña (guardada como un resumen irreversible), los activos que registra (las descripciones, indicaciones y montos se guardan cifrados; de las tarjetas solo los últimos 4 dígitos), los datos de sus herederos y su actividad en el sistema (ingresos y dirección IP). Del heredero: DNI, correo y, con su consentimiento, una selfie guardada cifrada. De los pagos: número de pedido, resultado y tarjeta enmascarada; los datos completos de la tarjeta los recibe Niubiz y no se guardan en LegadoSeguro.' },
    { titulo: '3. Para qué los usamos', texto: 'Para prestar el servicio, verificar la identidad de propietarios y herederos, enviar las alertas y avisos del proceso de liberación, cobrar el plan Premium, mantener la seguridad y la auditoría del sistema y atender reclamos y consultas.' },
    { titulo: '4. Con quién los compartimos', texto: 'Solo con los proveedores necesarios para el servicio: alojamiento y base de datos, consulta de DNI en RENIEC mediante un proveedor, envío de correos y procesamiento de pagos con Niubiz. Los herederos reciben únicamente lo que el propietario dispuso, cuando se cumple su regla. No vendemos tus datos.' },
    { titulo: '5. Consentimiento para la selfie', texto: 'Antes de tomar la selfie, el heredero debe aceptar un texto de consentimiento. Guardamos la fecha y la IP de esa aceptación junto con la foto, y el heredero puede eliminarla hasta que confirme su participación.' },
    { titulo: '6. Cuánto tiempo los conservamos', texto: 'Mientras mantengas tu cuenta y por el tiempo que exija la ley. Puedes pedir la eliminación de tus datos, salvo lo que debamos conservar por obligación legal.' },
    { titulo: '7. Cómo los protegemos', texto: 'Ciframos los datos sensibles con AES-256, guardamos las contraseñas como un resumen irreversible, las sesiones vencen solas y registramos las acciones importantes en una auditoría.' },
    { titulo: '8. Tus derechos', texto: `Puedes pedir acceso, rectificación, cancelación y oposición sobre tus datos personales, conforme a la Ley N.° 29733, escribiendo a ${CONTACTO.privacidad}. También puedes presentar un reclamo ante la autoridad de protección de datos personales.` },
    { titulo: '9. Menores de edad', texto: 'El servicio es solo para mayores de 18 años.' },
    { titulo: '10. Registro del banco de datos y cambios', texto: 'Estado de la inscripción del banco de datos: pendiente [número de inscripción por definir]. Si cambiamos esta política, publicaremos la nueva versión en esta página.' }
  ]
};
