import { getPool } from '../../config/db';
import { Contact } from '../../types';

export async function createContact(data: {
  full_name: string;
  email: string;
  subject?: string;
  message: string;
  ip_address?: string;
}): Promise<Contact> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO contacts (full_name, email, subject, message, ip_address)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.full_name, data.email, data.subject || null, data.message, data.ip_address || null]
  );
  return result.rows[0];
}

export async function getContacts(offset: number, limit: number, status?: string): Promise<{ contacts: Contact[]; total: number }> {
  const pool = getPool();
  const where = status ? `WHERE status = $3` : '';
  const params: unknown[] = [limit, offset];
  if (status) params.push(status);

  const [dataResult, countResult] = await Promise.all([
    pool.query(
      `SELECT * FROM contacts ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      params
    ),
    pool.query(
      `SELECT COUNT(*) AS total FROM contacts ${status ? 'WHERE status = $1' : ''}`,
      status ? [status] : []
    ),
  ]);

  return { contacts: dataResult.rows, total: parseInt(countResult.rows[0].total, 10) };
}

export async function getContactById(id: number): Promise<Contact | null> {
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM contacts WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

export async function updateContactStatus(id: number, status: string): Promise<void> {
  const pool = getPool();
  const repliedAt = status === 'replied' ? 'NOW()' : 'replied_at';
  await pool.query(
    `UPDATE contacts SET status = $1, replied_at = ${repliedAt} WHERE id = $2`,
    [status, id]
  );
}

export async function deleteContact(id: number): Promise<void> {
  const pool = getPool();
  await pool.query(`DELETE FROM contacts WHERE id = $1`, [id]);
}
