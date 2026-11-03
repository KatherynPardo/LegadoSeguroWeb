// Controlador de autenticación.

import { Request, Response } from 'express';
import {
  iniciarSesion, registrarUsuario, confirmarCorreo, reenviarCodigoRegistro, solicitarRecuperacion, restablecerPassword
} from '../services/auth.service';
import { obtenerIp } from '../utils/ip';
import { consultarDni, ErrorConsultaDni } from '../services/reniec.service';

export async function login(req: Request, res: Response) {
  const { correo, password } = req.body;

  if (!correo || !password) {
    res.status(400).json({ mensaje: 'Ingresa tu correo y tu contraseña' });
    return;
  }

  try {
    const sesion = await iniciarSesion(correo, password, obtenerIp(req));

    if (!sesion) {
      // Mismo mensaje para correo o contraseña incorrectos: no se revela cuál falló
      res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
      return;
    }

    res.json(sesion);
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ mensaje: 'Error al iniciar sesión' });
  }
}

export async function registro(req: Request, res: Response) {
  const { nombres, apellidos, dni, correo, telefono, password } = req.body;

  if (!nombres?.trim() || !apellidos?.trim()) {
    res.status(400).json({ mensaje: 'Ingresa tus nombres y apellidos' });
    return;
  }
  if (!/^\d{8}$/.test(dni ?? '')) {
    res.status(400).json({ mensaje: 'El DNI debe tener 8 dígitos' });
    return;
  }
  if (!correo || !correo.includes('@')) {
    res.status(400).json({ mensaje: 'Ingresa un correo válido' });
    return;
  }
  if (!/^\d{9}$/.test(telefono ?? '')) {
    res.status(400).json({ mensaje: 'El teléfono debe tener 9 dígitos' });
    return;
  }
  if (!password || password.length < 6) {
    res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    return;
  }

  try {
    // Los nombres salen de RENIEC, no de lo que escriba la persona. Si la consulta no está
    // configurada (503) se aceptan los datos escritos; si el DNI no existe, se rechaza.
    let nombresFinal = nombres.trim();
    let apellidosFinal = apellidos.trim();
    try {
      const persona = await consultarDni(dni);
      nombresFinal = persona.nombres;
      apellidosFinal = persona.apellidos;
    } catch (e) {
      if (e instanceof ErrorConsultaDni && e.estado === 404) {
        res.status(400).json({ mensaje: 'No se encontró ese DNI en RENIEC' });
        return;
      }
      if (!(e instanceof ErrorConsultaDni) || e.estado !== 503) throw e;
    }

    const creada = await registrarUsuario({
      nombres: nombresFinal,
      apellidos: apellidosFinal,
      dni,
      correo: correo.trim().toLowerCase(),
      telefono: telefono?.trim() || null,
      password
    }, obtenerIp(req));

    if (!creada) {
      res.status(409).json({ mensaje: 'Ya existe una cuenta con ese correo o DNI' });
      return;
    }

    // Todavía no hay sesión: primero hay que confirmar el correo con el código
    res.status(201).json({ mensaje: 'Te enviamos un código a tu correo', correo: correo.trim().toLowerCase() });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ mensaje: 'Error al crear la cuenta' });
  }
}

export async function verificarCorreo(req: Request, res: Response) {
  const { correo, codigo } = req.body;

  if (!correo || !/^\d{6}$/.test(codigo ?? '')) {
    res.status(400).json({ mensaje: 'Ingresa el código de 6 dígitos' });
    return;
  }

  try {
    const sesion = await confirmarCorreo(correo.trim().toLowerCase(), codigo, obtenerIp(req));
    if (!sesion) {
      res.status(400).json({ mensaje: 'El código es incorrecto o ya venció' });
      return;
    }
    res.json(sesion);
  } catch (error) {
    console.error('Error al verificar el correo:', error);
    res.status(500).json({ mensaje: 'Error al verificar el correo' });
  }
}

export async function reenviarCodigo(req: Request, res: Response) {
  const { correo } = req.body;
  if (!correo) {
    res.status(400).json({ mensaje: 'Falta el correo' });
    return;
  }

  try {
    const enviado = await reenviarCodigoRegistro(correo.trim().toLowerCase());
    if (!enviado) {
      res.status(404).json({ mensaje: 'No hay un registro pendiente con ese correo' });
      return;
    }
    res.json({ mensaje: 'Te enviamos un código nuevo' });
  } catch (error) {
    console.error('Error al reenviar el código:', error);
    res.status(500).json({ mensaje: 'Error al reenviar el código' });
  }
}

export async function olvidePassword(req: Request, res: Response) {
  const correo = typeof req.body.correo === 'string' ? req.body.correo.trim().toLowerCase() : '';
  if (!correo.includes('@')) {
    res.status(400).json({ mensaje: 'Ingresa un correo válido' });
    return;
  }

  try {
    await solicitarRecuperacion(correo);
    // La respuesta es la misma exista o no el correo
    res.json({ mensaje: 'Si el correo está registrado, te enviamos un código' });
  } catch (error) {
    console.error('Error al solicitar la recuperación:', error);
    res.status(500).json({ mensaje: 'Error al enviar el código' });
  }
}

export async function cambiarPasswordConCodigo(req: Request, res: Response) {
  const { correo, codigo, password } = req.body;

  if (typeof correo !== 'string' || typeof codigo !== 'string' || codigo.length !== 6 || isNaN(Number(codigo))) {
    res.status(400).json({ mensaje: 'Ingresa el código de 6 dígitos' });
    return;
  }
  if (typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    return;
  }

  try {
    const cambiada = await restablecerPassword(correo.trim().toLowerCase(), codigo, password, obtenerIp(req));
    if (!cambiada) {
      res.status(400).json({ mensaje: 'El código es incorrecto o ya venció' });
      return;
    }
    res.json({ mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión' });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).json({ mensaje: 'Error al cambiar la contraseña' });
  }
}
