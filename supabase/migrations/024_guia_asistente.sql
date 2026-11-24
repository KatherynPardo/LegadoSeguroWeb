-- 024: contenido de la guía que usa el asistente virtual (tabla guia_legal) y palabras clave para encontrarlo.
-- Son preguntas frecuentes sobre cómo funciona el sistema: orientación general, no asesoría legal.
ALTER TABLE guia_legal ADD COLUMN IF NOT EXISTS palabras_clave TEXT;

-- Solo carga los temas si la guía está vacía, para no duplicarlos si la migración se ejecuta dos veces
INSERT INTO guia_legal (tema, contenido, palabras_clave)
SELECT * FROM (VALUES
  ('¿Qué es LegadoSeguro?',
   $$LegadoSeguro es una plataforma para ordenar tu legado digital. Registras tus activos (cuentas, correos, tarjetas y otros datos importantes), designas a tus herederos y defines una regla: si dejas de entrar al sistema durante el tiempo que elijas, se abre un proceso para entregarles lo que dejaste.$$,
   'plataforma sistema herencia testamento digital para qué sirve funciona'),
  ('¿Qué activos puedo registrar?',
   $$Puedes registrar cuentas de redes sociales, correos, cuentas bancarias, tarjetas y otros activos digitales. De las tarjetas solo se guardan los últimos 4 dígitos. Las descripciones y las indicaciones para el heredero se guardan cifradas, y el monto es opcional.$$,
   'cuentas correos redes sociales banco tarjeta contraseña dinero activos digitales registrar agregar'),
  ('¿Cómo designo a un heredero?',
   $$En la sección Mis Herederos agregas a la persona con su DNI y su correo, y eliges qué activos recibirá. Verificar su correo con un código es opcional: si no lo verificas, queda pendiente de validar y su designación se mantiene reservada hasta que valide su DNI en un proceso. El plan Básico permite hasta 2 herederos.$$,
   'beneficiario heredero designar agregar familiar dni correo verificar pendiente límite'),
  ('¿Qué pasa si dejo de entrar al sistema?',
   $$Cuando pasan los días de inactividad que definiste en tu regla, te enviamos una alerta por correo y tienes un plazo de gracia para entrar. Si no lo haces, se abre el proceso de liberación y se avisa a tus herederos. Si entras al sistema antes, no pasa nada.$$,
   'inactividad dejo de entrar no entro alerta plazo de gracia proceso liberación regla desaparezco fallezco'),
  ('¿Cuántos días de inactividad debo elegir?',
   $$Puedes elegir entre 7 y 3650 días. Si eliges muy pocos, recibirás alertas sin necesidad; si eliges demasiados, la entrega se demora. En la pantalla de reglas, el sistema te sugiere un plazo según tus propios ingresos de los últimos 12 meses; si aún no hay historial suficiente, propone 90 días.$$,
   'días inactividad plazo elegir sugerencia recomendación cuántos tiempo regla'),
  ('¿Puedo cancelar un proceso de liberación?',
   $$Sí. Mientras el proceso no termine puedes cancelarlo, por ejemplo si reapareces o si fue una falsa alarma. Además, la regla incluye un período de espera final (de 7, 15, 30 o 60 días) antes de liberar los activos, que es justamente tu margen para detenerlo.$$,
   'cancelar detener proceso liberación espera final arrepentí falsa alarma objeción'),
  ('¿Cómo se protegen mis datos?',
   $$Las contraseñas se guardan con un resumen irreversible, las descripciones y los montos de tus activos se cifran con AES-256 antes de guardarse, y las sesiones vencen solas. De las tarjetas solo se guardan los últimos 4 dígitos. El tratamiento de tus datos personales sigue la Ley N.° 29733 y cada acción importante queda en un registro de auditoría.$$,
   'seguridad privacidad cifrado datos protección seguros contraseña ley 29733 auditoría'),
  ('¿Qué es la selfie del heredero y por qué se pide?',
   $$Es el tercer paso de la verificación del heredero, junto con el código del correo y el DNI. Antes de tomarla debe aceptar un texto de consentimiento; se guarda cifrada con la fecha y la IP de esa aceptación. El navegador revisa que haya un solo rostro, centrado y de buen tamaño, y el heredero puede eliminar su foto hasta que confirme su participación.$$,
   'selfie foto rostro cara cámara consentimiento verificación biométrica heredero'),
  ('¿Cómo valida su identidad el heredero?',
   $$El heredero entra al portal con un código de 6 dígitos que llega a su correo. Para solicitar la liberación pasa tres verificaciones: el código, su DNI (validado con RENIEC) y una selfie. Luego confirma su participación u objeta, y el proceso continúa hasta la espera final y la entrega.$$,
   'heredero portal ingresar validar identidad dni reniec código verificación solicitud liberación confirmar objetar'),
  ('¿Qué documentos necesita el heredero?',
   $$Depende del tipo de activo que recibe. El administrador define la lista de documentos por tipo de activo; el propietario elige cuáles aplican a cada heredero, y el heredero ve en su portal lo que le falta y marca lo que ya tiene listo.$$,
   'documentos requisitos checklist lista papeles heredero necesita certificado'),
  ('¿Qué incluye el plan Premium y cómo se paga?',
   $$El plan Básico es gratis e incluye hasta 2 herederos; el plan Premium permite herederos ilimitados. En la pantalla Suscripción ves el precio vigente. El pago se hace con tarjeta Visa en un formulario seguro de Niubiz y LegadoSeguro no guarda los datos de tu tarjeta.$$,
   'plan premium básico gratis precio costo pagar pago tarjeta visa niubiz suscripción mejorar'),
  ('¿LegadoSeguro reemplaza a un testamento?',
   $$No. LegadoSeguro ayuda a gestionar la entrega de tus accesos y datos digitales, pero no reemplaza a un testamento notarial ni es asesoría legal. Para decisiones sobre tus bienes, consulta con un abogado o un notario.$$,
   'testamento notario abogado legal validez bienes herencia ley reemplaza asesoría')
) AS v(tema, contenido, palabras_clave)
WHERE NOT EXISTS (SELECT 1 FROM guia_legal);
