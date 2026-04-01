import { getPool } from '../../config/db';
import { ProjectRequest } from '../../types';

export async function createRequest(data: {
  full_name: string;
  email: string;
  company_name?: string;
  phone?: string;
  project_type: string;
  project_title: string;
  description: string;
  budget_range?: string;
  timeline?: string;
  tech_preferences?: string;
}): Promise<ProjectRequest> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO project_requests
       (full_name, email, company_name, phone, project_type, project_title, description, budget_range, timeline, tech_preferences)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      data.full_name, data.email, data.company_name || null, data.phone || null,
      data.project_type, data.project_title, data.description,
      data.budget_range || null, data.timeline || null, data.tech_preferences || null,
    ]
  );
  return result.rows[0];
}

export async function getRequests(
  offset: number,
  limit: number,
  filters: { status?: string; project_type?: string; priority?: string }
): Promise<{ requests: ProjectRequest[]; total: number }> {
  const pool = getPool();
  const conditions: string[] = [];
  const values: unknown[] = [limit, offset];

  if (filters.status)       { values.push(filters.status);       conditions.push(`status = $${values.length}`); }
  if (filters.project_type) { values.push(filters.project_type); conditions.push(`project_type = $${values.length}`); }
  if (filters.priority)     { values.push(filters.priority);     conditions.push(`priority = $${values.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [data, count] = await Promise.all([
    pool.query(`SELECT * FROM project_requests ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, values),
    pool.query(`SELECT COUNT(*) AS total FROM project_requests ${where}`, values.slice(2)),
  ]);

  return { requests: data.rows, total: parseInt(count.rows[0].total, 10) };
}

export async function getRequestById(id: number): Promise<ProjectRequest | null> {
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM project_requests WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

export async function updateRequest(id: number, data: {
  status?: string;
  priority?: string;
  admin_notes?: string;
  assigned_to?: number | null;
}): Promise<ProjectRequest | null> {
  const sets: string[] = ['updated_at = NOW()'];
  const values: unknown[] = [id];

  if (data.status !== undefined)      { values.push(data.status);      sets.push(`status = $${values.length}`); }
  if (data.priority !== undefined)    { values.push(data.priority);    sets.push(`priority = $${values.length}`); }
  if (data.admin_notes !== undefined) { values.push(data.admin_notes); sets.push(`admin_notes = $${values.length}`); }
  if (data.assigned_to !== undefined) { values.push(data.assigned_to); sets.push(`assigned_to = $${values.length}`); }

  const result = await getPool().query(
    `UPDATE project_requests SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteRequest(id: number): Promise<void> {
  const pool = getPool();
  await pool.query(`DELETE FROM project_requests WHERE id = $1`, [id]);
}

export async function getRequestStats(): Promise<Record<string, number>> {
  const pool = getPool();
  const result = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) AS reviewing,
      SUM(CASE WHEN status = 'accepted'  THEN 1 ELSE 0 END) AS accepted,
      SUM(CASE WHEN status = 'rejected'  THEN 1 ELSE 0 END) AS rejected
    FROM project_requests`
  );
  const row = result.rows[0];
  return {
    total:     parseInt(row.total, 10),
    pending:   parseInt(row.pending, 10),
    reviewing: parseInt(row.reviewing, 10),
    accepted:  parseInt(row.accepted, 10),
    rejected:  parseInt(row.rejected, 10),
  };
}
