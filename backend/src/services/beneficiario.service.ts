// Servicio: aquí vive la consulta SQL. No sabe nada de HTTP (req/res).

import { pool } from '../config/database';
import { Beneficiario } from '../models/beneficiario.model';

export async function listarBeneficiarios(): Promise<Beneficiario[]> {
  const resultado = await pool.query<Beneficiario>(
    'SELECT id_beneficiario AS id, nombres, apellidos, parentesco, correo FROM beneficiario ORDER BY id_beneficiario'
  );
  return resultado.rows;
}
