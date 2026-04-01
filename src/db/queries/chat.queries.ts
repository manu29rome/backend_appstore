import { getPool } from '../../config/db';
import { ChatSession, ChatMessage } from '../../types';

export async function createOrGetSession(data: {
  session_id: string;
  visitor_name?: string;
  visitor_email?: string;
  ip_address?: string;
  user_agent?: string;
}): Promise<ChatSession> {
  const pool = getPool();
  const existing = await pool.query(
    `SELECT * FROM chat_sessions WHERE session_id = $1`,
    [data.session_id]
  );
  if (existing.rows[0]) return existing.rows[0];

  const result = await pool.query(
    `INSERT INTO chat_sessions (session_id, visitor_name, visitor_email, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      data.session_id, data.visitor_name || null, data.visitor_email || null,
      data.ip_address || null, data.user_agent?.substring(0, 500) || null,
    ]
  );
  return result.rows[0];
}

export async function getSessions(offset: number, limit: number): Promise<{ sessions: ChatSession[]; total: number }> {
  const pool = getPool();
  const [data, count] = await Promise.all([
    pool.query(
      `SELECT * FROM chat_sessions ORDER BY COALESCE(last_message_at, started_at) DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    pool.query(`SELECT COUNT(*) AS total FROM chat_sessions`),
  ]);
  return { sessions: data.rows, total: parseInt(count.rows[0].total, 10) };
}

export async function getSessionById(sessionId: string): Promise<ChatSession | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM chat_sessions WHERE session_id = $1`,
    [sessionId]
  );
  return result.rows[0] || null;
}

export async function updateSessionStatus(sessionId: string, status: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE chat_sessions SET status = $1, ended_at = CASE WHEN $1 = 'closed' THEN NOW() ELSE ended_at END WHERE session_id = $2`,
    [status, sessionId]
  );
}

export async function updateSessionAdminJoined(sessionId: string, joined: boolean): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE chat_sessions SET is_admin_joined = $1 WHERE session_id = $2`,
    [joined, sessionId]
  );
}

export async function saveMessage(data: {
  session_id: string;
  sender_type: 'visitor' | 'admin' | 'bot';
  sender_name?: string;
  content: string;
  message_type?: string;
}): Promise<ChatMessage> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO chat_messages (session_id, sender_type, sender_name, content, message_type)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.session_id, data.sender_type, data.sender_name || null, data.content, data.message_type || 'text']
  );
  await pool.query(
    `UPDATE chat_sessions SET last_message_at = NOW() WHERE session_id = $1`,
    [data.session_id]
  );
  return result.rows[0];
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY sent_at ASC`,
    [sessionId]
  );
  return result.rows;
}

export async function markSessionMessagesRead(sessionId: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE chat_messages SET is_read = true WHERE session_id = $1 AND sender_type = 'visitor' AND is_read = false`,
    [sessionId]
  );
}

export async function getUnreadCount(): Promise<number> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT COUNT(*) AS total FROM chat_messages WHERE sender_type = 'visitor' AND is_read = false`
  );
  return parseInt(result.rows[0].total, 10);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const pool = getPool();
  await pool.query(`DELETE FROM chat_sessions WHERE session_id = $1`, [sessionId]);
}
