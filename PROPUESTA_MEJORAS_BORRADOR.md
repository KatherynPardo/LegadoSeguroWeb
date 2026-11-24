# Propuesta de mejoras de LegadoSeguro (borrador)

**Autoras:** Katheryn Pardo Acosta, Fiorella Stefany Cabanillas Rojas · **Curso:** JavaScript Avanzado (UTP) · **Ciclo:** VI, 2026-02 · **Fecha:** 24/11/2026

## 1. Resumen

**LegadoSeguro** es una plataforma web donde una persona registra sus activos digitales, designa herederos y define una regla para entregarlos solo cuando corresponde. Este borrador resume las **trece mejoras** que el grupo propone para el sistema, ordenadas de mayor a menor impacto. Cada una se muestra con una **captura real**, si ya funciona, o con un **boceto de diseño**, si todavía es una propuesta. El impacto es una valoración del grupo, no una medición.

![Mapa de las trece mejoras, ordenadas por impacto](docs/capturas/mejoras-0_mapa.png)

## 2. Mejoras implementadas

### 2.1 M5 · Accesibilidad e inclusión

**Qué es.** Un botón flotante, disponible en todas las pantallas, para que más personas puedan usar el sistema: **modo oscuro**, **letra del 100 % al 150 %**, **alto contraste**, enlace "Saltar al contenido" con el teclado y **lectura en voz alta** de la pantalla (Mozilla Developer Network, 2026c).

**Cómo está.** Funciona y se probó en el navegador. La accesibilidad medida con Lighthouse es **100** en el landing, el inicio de sesión y el registro. Falta probarlo con un lector de pantalla real, revisar las pantallas con sesión y ofrecer una alternativa a la selfie para personas ciegas. No garantiza cumplir WCAG (World Wide Web Consortium, 2018).

![Captura real: modo oscuro con el panel de accesibilidad abierto](docs/capturas/mejora-5_modo_oscuro.png)

![Captura real: pantalla de reglas con la letra al 150 %](docs/capturas/mejora-5_letra_grande.png)

### 2.2 M3 · Sugerencia inteligente de días de inactividad

**Qué es.** En la pantalla de reglas, el sistema sugiere cuántos días de inactividad conviene según los ingresos reales del propietario: toma el percentil 90 de los días entre ingresos, lo multiplica por 3 y lo sube al siguiente plazo habitual. Con poco historial, propone 90 días y lo avisa.

**Cómo está.** Funciona y las pruebas aprobaron. Es estadística explicable, **no aprendizaje automático**, porque hoy no hay datos suficientes para entrenar un modelo. La captura usa datos de demostración.

![Captura real: sugerencia de 30 días en la pantalla de reglas](docs/capturas/mejora-3_sugerencia.png)

### 2.3 M2 · Asistente virtual de orientación

**Qué es.** Un botón flotante con un chat que responde con la guía del propio sistema, sin enviar datos personales a terceros ni guardar las preguntas. Si no encuentra una respuesta, ofrece los temas disponibles en lugar de inventar. Siempre aclara que es orientación general y no reemplaza a un abogado. Se busca con la búsqueda de texto completo de PostgreSQL en español (PostgreSQL Global Development Group, 2026).

**Cómo está.** Funciona y se probó: la guía tiene **12 temas** (qué es el sistema, activos, herederos, inactividad, cancelación, datos, selfie, identidad, documentos, planes y testamento), en 12 preguntas de prueba, las 10 que tenían tema encontraron el esperado y las 2 sin relación no inventaron respuesta, y el límite de 10 preguntas por minuto responde 429 desde la pregunta 11. La accesibilidad del landing sigue en 100 con el asistente. Falta que un abogado revise los textos de la guía.

![Captura real: el asistente virtual responde en el landing](docs/capturas/mejora-2_asistente.png)

### 2.4 M12 · Términos y condiciones, privacidad y libro de reclamaciones

**Qué es.** Las páginas legales que exige vender en línea. **Términos y condiciones** en español e inglés, que se muestran dentro de la compra, en la pantalla Suscripción, con una casilla de aceptación que hay que marcar antes de pagar; el backend también lo exige y deja constancia de la versión aceptada y de la IP. **Política de privacidad** según la Ley N.° 29733 (Congreso de la República del Perú, 2011) y un **libro de reclamaciones virtual** (Congreso de la República del Perú, 2010): una hoja de reclamo o queja que recibe un código (por ejemplo LR-2026-000001), se guarda en la base y se copia por correo cuando el envío de correos está configurado. Los tres están enlazados en el pie del landing.

**Cómo está.** Funciona y se probó: el cobro se bloquea sin aceptar los términos (400) y se desbloquea al aceptarlos; el libro registra la hoja, valida los datos y responde 429 desde la cuarta hoja en un minuto; la accesibilidad de Lighthouse es 100 en las tres páginas. Faltan la **revisión de un abogado** de los textos, la razón social, el RUC y los datos reales de contacto, y una pantalla para que el administrador vea y responda los reclamos, que hoy solo se consultan en la base. Niubiz también pide enviar el comprobante de compra por correo, y eso aún no está.

![Captura real: términos y condiciones dentro de la pantalla Suscripción, con la casilla de aceptación](docs/capturas/mejora-12_suscripcion_terminos.png)

![Captura real: página de términos y condiciones](docs/capturas/mejora-12_terminos.png)

![Captura real: hoja del libro de reclamaciones](docs/capturas/mejora-12_reclamaciones.png)

![Captura real: hoja registrada con su código](docs/capturas/mejora-12_reclamacion_registrada.png)

### 2.5 M1 · Landing page pública

**Qué es.** La página de inicio del sistema: qué es LegadoSeguro, cómo funciona, cómo protege los datos, los planes con su precio real y el contacto. Quien ya tiene sesión va directo a su dashboard.

**Cómo está.** Funciona, es responsive y su accesibilidad es 100. Faltan el logo oficial de Visa y los datos reales de contacto.

![Captura real: inicio del landing page](docs/capturas/mejora-1_landing_inicio.png)

## 3. Mejora en curso

### 3.1 M4 · Pago del plan Premium con Niubiz

**Qué es.** Cobro del plan Premium con tarjeta mediante el formulario Pago Web de Niubiz (VisaNet Perú, 2025). El monto sale siempre de la base, el plan solo se activa con una autorización aprobada y cada pedido se procesa una sola vez.

**Cómo está.** El código está hecho y compila, pero **no se probó ningún cobro**: faltan las credenciales de pruebas que entrega Niubiz. El boceto muestra cómo se verá el formulario sobre la pantalla de Suscripción.

![Boceto del formulario de pago sobre la pantalla de Suscripción](docs/capturas/mejora-4_boceto_pago.png)

## 4. Mejoras propuestas

### 4.1 M7 · Llave compartida entre herederos

**Qué es.** El contenido se cifra en el navegador del propietario con la Web Crypto API (Mozilla Developer Network, 2026b) y la llave se reparte en N partes con el esquema de Shamir (1979), una para cada heredero. Solo cuando k de ellos aportan su parte se puede descifrar. Lleva la regla "k de N confirmaciones", que ya existe, a la criptografía.

**Cómo sería.** Un prototipo con un activo de prueba, usando la Web Crypto API y una librería de Shamir revisada, sin inventar criptografía. Riesgo declarado: si se pierden las partes, no hay recuperación.

![Boceto del reparto de la llave entre cinco herederos](docs/capturas/mejora-7_boceto_llave.png)

### 4.2 M8 · Mensaje póstumo

**Qué es.** El propietario graba un audio, un video corto o escribe una carta con la MediaRecorder API (Mozilla Developer Network, 2026a). Queda guardado cifrado y se entrega a los herederos junto con los activos, al terminar el proceso. Se empieza por audio y texto, porque el video pesa más.

![Boceto de la pantalla para grabar el mensaje póstumo](docs/capturas/mejora-8_boceto_mensaje.png)

### 4.3 M9 · App instalable (PWA) con avisos

**Qué es.** Convertir el sistema en una aplicación instalable en el celular, con notificaciones push para la alerta de inactividad (Angular, 2026). Requiere HTTPS, así que depende del despliegue.

![Boceto de la notificación en el celular y del botón de instalar](docs/capturas/mejora-9_boceto_pwa.png)

### 4.4 M10 · Verificación "sigo aquí" con un clic

**Qué es.** La alerta de inactividad incluye un enlace de un solo uso, con vencimiento, que reinicia el contador sin iniciar sesión. Reduce los falsos positivos sin bajar la seguridad: se guarda solo la huella del enlace, como ya se hace con el código de verificación.

![Boceto del correo con el botón "Sigo aquí" y su confirmación](docs/capturas/mejora-10_boceto_sigo_aqui.png)

### 4.5 M6 · Idiomas

**Qué es.** Un selector de idioma que recuerda la elección. Se empieza por el **inglés** en el landing, el inicio de sesión y el portal del heredero; el portugués queda para después, y el quechua aportaría un valor distinto, pero su traducción debe revisarla un hablante. Los textos legales traducidos son solo informativos.

![Boceto del landing en inglés con el selector de idioma](docs/capturas/mejora-6_boceto_idiomas.png)

### 4.6 M13 · Identidad de marca: redes sociales y correos institucionales

**Qué es.** Un dominio propio, correos por función (soporte, contacto, privacidad, legal, facturación y otros) y perfiles en Facebook, Instagram, X, LinkedIn y TikTok con la identidad del sistema: azul y dorado, con turquesa, coral y crema como apoyos con una función. El coral es el único acento fuerte, solo para botones de acción, y se oscureció para que el texto blanco tenga buen contraste. Son bocetos de diseño: los nombres de usuario deben comprobarse en cada red.

![Paleta de color de las redes sociales](docs/capturas/redes-7_paleta.png)

![Boceto del perfil de LegadoSeguro en Facebook](docs/capturas/redes-1_facebook.png)

![Boceto del perfil de LegadoSeguro en Instagram](docs/capturas/redes-2_instagram.png)

![Boceto del perfil de LegadoSeguro en X](docs/capturas/redes-3_x.png)

![Boceto de la página de empresa de LegadoSeguro en LinkedIn](docs/capturas/redes-4_linkedin.png)

![Boceto del perfil de LegadoSeguro en TikTok](docs/capturas/redes-5_tiktok.png)

![Boceto de la publicación tipo de 1080 por 1080 píxeles](docs/capturas/redes-6_publicacion_tipo.png)

### 4.7 M11 · Tarjeta de emergencia con código QR

**Qué es.** Una hoja imprimible, generada en el navegador, con las instrucciones para el heredero y un código QR que lleva al portal. No contiene datos sensibles. El código del boceto es ilustrativo.

![Boceto de la tarjeta de emergencia](docs/capturas/mejora-11_boceto_qr.png)

## 5. Cronograma

Tabla: Cronograma previsto
| Fecha | Qué se hace |
|---|---|
| Lunes 23 y martes 24/11 | M3, M1, M5, M2 y M12 implementadas y probadas; presentar la propuesta |
| Miércoles 25/11 | Revisión de M5 y M2 en las pantallas con sesión; pantalla del administrador para los reclamos; comprobante de compra por correo |
| Jueves 26/11 | Reflejar lo implementado en el manual y tomar las capturas; si alcanza el tiempo, empezar el prototipo de M7 |
| Viernes 27/11 | Presentación en borrador |
| Hasta el martes 01/12 | Si alcanza el tiempo: prototipo de M7; exposiciones desde el 01/12 |
| Al recibir las credenciales | M4: pruebas del cobro con Niubiz |

## Referencias

ref: Angular. (2026). *Angular documentation*. https://angular.dev
ref: Congreso de la República del Perú. (2010). *Ley N.° 29571, Código de Protección y Defensa del Consumidor*.
ref: Congreso de la República del Perú. (2011). *Ley N.° 29733, Ley de Protección de Datos Personales*.
ref: Mozilla Developer Network. (2026a). *MediaRecorder API*. https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder_API
ref: Mozilla Developer Network. (2026b). *Web Crypto API*. https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
ref: Mozilla Developer Network. (2026c). *Web Speech API*. https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
ref: PostgreSQL Global Development Group. (2026). *PostgreSQL documentation: Full text search*. https://www.postgresql.org/docs/current/textsearch.html
ref: Shamir, A. (1979). How to share a secret. *Communications of the ACM, 22*(11), 612-613. https://doi.org/10.1145/359168.359176
ref: VisaNet Perú. (2025). *Documento de integración: Formulario "Pago Web" (versión 6.0)* [Documento PDF]. Niubiz.
ref: World Wide Web Consortium. (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/TR/WCAG21/
