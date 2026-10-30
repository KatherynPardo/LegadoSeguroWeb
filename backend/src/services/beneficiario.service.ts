// Servicio: aquí viven las consultas SQL. No sabe nada de HTTP (req/res).

import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { Beneficiario, NuevoBeneficiario } from '../models/beneficiario.model';

export async function listarBeneficiarios(idUsuario: number): Promise<Beneficiario[]> {
  const resultado = await pool.query<Beneficiario>(
    `SELECT id_beneficiario AS id, nombres, apellidos, parentesco, correo
     FROM beneficiario
     WHERE id_usuario_propietario = $1
     ORDER BY id_beneficiario`,
    [idUsuario]
  );
  return resultado.rows;
}

export async function crearBeneficiario(datos: NuevoBeneficiario, idUsuario: number): Promise<number> {
  // La clave de acceso del heredero se cifra antes de guardarla
  const claveHash = await bcrypt.hash(datos.claveAcceso, 10);

  const resultado = await pool.query(
    `INSERT INTO beneficiario
       (id_usuario_propietario, nombres, apellidos, dni, correo, parentesco, clave_acceso_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id_beneficiario AS id`,
    [idUsuario, datos.nombres, datos.apellidos, datos.dni, datos.correo, datos.parentesco ?? null, claveHash]
  );
  return resultado.rows[0].id;
}
