import { getPool } from '../../config/db';
import { Admin } from '../../types';

export async function findAdminByUsername(username: string): Promise<(Admin & { password_hash: string }) | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, username, email, password_hash, full_name, role, is_active, last_login, created_at
     FROM admins WHERE username = $1 AND is_active = true`,
    [username]
  );
  return result.rows[0] || null;
}

export async function findAdminById(id: number): Promise<Admin | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, username, email, full_name, role, is_active, last_login, created_at
     FROM admins WHERE id = $1 AND is_active = true`,
    [id]
  );
  return result.rows[0] || null;
}

export async function updateLastLogin(adminId: number): Promise<void> {
  const pool = getPool();
  await pool.query(`UPDATE admins SET last_login = NOW() WHERE id = $1`, [adminId]);
}

export async function updatePassword(adminId: number, passwordHash: string): Promise<void> {
  const pool = getPool();
  await pool.query(`UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [passwordHash, adminId]);
}

export async function saveRefreshToken(adminId: number, tokenHash: string, expiresAt: Date): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO refresh_tokens (admin_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [adminId, tokenHash, expiresAt]
  );
}

export async function findRefreshToken(tokenHash: string): Promise<{ admin_id: number; expires_at: Date; is_revoked: boolean } | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT admin_id, expires_at, is_revoked FROM refresh_tokens WHERE token_hash = $1`,
    [tokenHash]
  );
  return result.rows[0] || null;
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  const pool = getPool();
  await pool.query(`UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1`, [tokenHash]);
}

export async function revokeAllAdminTokens(adminId: number): Promise<void> {
  const pool = getPool();
  await pool.query(`UPDATE refresh_tokens SET is_revoked = true WHERE admin_id = $1`, [adminId]);
}
