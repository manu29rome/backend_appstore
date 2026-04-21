import { Request, Response, NextFunction } from 'express';
import { success } from '../utils/response';
import { getPool } from '../config/db';

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pool = getPool();
    const statsResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM project_requests)                                         AS total_requests,
        (SELECT COUNT(*) FROM project_requests WHERE status = 'pending')               AS pending_requests,
        (SELECT COUNT(*) FROM contacts WHERE status = 'unread')                        AS unread_contacts,
        (SELECT COUNT(*) FROM chat_messages WHERE sender_type = 'visitor' AND is_read = false) AS unread_messages,
        (SELECT COUNT(*) FROM chat_sessions WHERE status = 'active')                   AS active_chat_sessions,
        (SELECT COUNT(*) FROM portfolio_projects WHERE is_published = true)            AS published_projects,
        (SELECT COUNT(*) FROM testimonials WHERE is_published = true)                  AS published_testimonials,
        (SELECT COUNT(*) FROM pqrs)                                                    AS total_pqrs,
        (SELECT COUNT(*) FROM pqrs WHERE status = 'pending')                          AS pending_pqrs
    `);

    const activityResult = await pool.query(`
      (SELECT 'request' AS type, full_name AS name, email, created_at FROM project_requests ORDER BY created_at DESC LIMIT 10)
      UNION ALL
      (SELECT 'contact' AS type, full_name AS name, email, created_at FROM contacts ORDER BY created_at DESC LIMIT 10)
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const row = statsResult.rows[0];
    success(res, {
      stats: {
        total_requests:        parseInt(row.total_requests, 10),
        pending_requests:      parseInt(row.pending_requests, 10),
        unread_contacts:       parseInt(row.unread_contacts, 10),
        unread_messages:       parseInt(row.unread_messages, 10),
        active_chat_sessions:  parseInt(row.active_chat_sessions, 10),
        published_projects:    parseInt(row.published_projects, 10),
        published_testimonials:parseInt(row.published_testimonials, 10),
        total_pqrs:            parseInt(row.total_pqrs, 10),
        pending_pqrs:          parseInt(row.pending_pqrs, 10),
      },
      recentActivity: activityResult.rows,
    });
  } catch (error) {
    next(error);
  }
}
