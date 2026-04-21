import { getPool } from '../../config/db';
import { PQRS } from '../../types';

export async function createPQRS(data: {
  type: string;
  full_name: string;
  email: string;
  phone?: string;
  subject: string;
  description: string;
  ip_address?: string;
}): Promise<PQRS> {
  const pool = getPool();
  const insert = await pool.query(
    `INSERT INTO pqrs (type, full_name, email, phone, subject, description, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at`,
    [data.type, data.full_name, data.email, data.phone || null, data.subject, data.description, data.ip_address || null]
  );
  const { id, created_at } = insert.rows[0];
  const year = new Date(created_at).getFullYear();
  const radicado = `PQRS-${year}-${id.toString().padStart(6, '0')}`;
  const result = await pool.query(
    `UPDATE pqrs SET radicado = $1 WHERE id = $2 RETURNING *`,
    [radicado, id]
  );
  return result.rows[0];
}

export async function getPQRSList(offset: number, limit: number, status?: string): Promise<{ items: PQRS[]; total: number }> {
  const pool = getPool();
  const where = status ? `WHERE status = $3` : '';
  const params: unknown[] = [limit, offset];
  if (status) params.push(status);

  const [dataResult, countResult] = await Promise.all([
    pool.query(`SELECT * FROM pqrs ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, params),
    pool.query(`SELECT COUNT(*) AS total FROM pqrs ${status ? 'WHERE status = $1' : ''}`, status ? [status] : []),
  ]);

  return { items: dataResult.rows, total: parseInt(countResult.rows[0].total, 10) };
}

export async function getPQRSById(id: number): Promise<PQRS | null> {
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM pqrs WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

export async function updatePQRS(id: number, data: { status?: string; admin_comments?: string }): Promise<PQRS | null> {
  const pool = getPool();
  const fields: string[] = ['updated_at = NOW()'];
  const params: unknown[] = [];
  let idx = 1;

  if (data.status !== undefined)          { fields.push(`status = $${idx++}`);          params.push(data.status); }
  if (data.admin_comments !== undefined)  { fields.push(`admin_comments = $${idx++}`);  params.push(data.admin_comments); }

  params.push(id);
  const result = await pool.query(
    `UPDATE pqrs SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

export async function deletePQRS(id: number): Promise<void> {
  const pool = getPool();
  await pool.query(`DELETE FROM pqrs WHERE id = $1`, [id]);
}
