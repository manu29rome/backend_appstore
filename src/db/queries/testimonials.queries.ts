import { getPool } from '../../config/db';
import { Testimonial } from '../../types';

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM testimonials WHERE is_published = true ORDER BY display_order ASC, created_at DESC`
  );
  return result.rows;
}

export async function getAllTestimonials(): Promise<Testimonial[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM testimonials ORDER BY display_order ASC, created_at DESC`
  );
  return result.rows;
}

export async function createTestimonial(data: {
  client_name: string;
  client_title?: string;
  client_company?: string;
  avatar_url?: string;
  content: string;
  rating?: number;
  project_type?: string;
  is_featured?: boolean;
  is_published?: boolean;
}): Promise<Testimonial> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO testimonials (client_name, client_title, client_company, avatar_url, content, rating, project_type, is_featured, is_published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      data.client_name, data.client_title || null, data.client_company || null,
      data.avatar_url || null, data.content, data.rating ?? 5,
      data.project_type || null, data.is_featured ?? false, data.is_published !== false,
    ]
  );
  return result.rows[0];
}

export async function updateTestimonial(id: number, data: Partial<Omit<Testimonial, 'id' | 'created_at'>>): Promise<Testimonial | null> {
  const sets: string[] = [];
  const values: unknown[] = [id];

  if (data.client_name !== undefined)    { values.push(data.client_name);    sets.push(`client_name = $${values.length}`); }
  if (data.client_title !== undefined)   { values.push(data.client_title);   sets.push(`client_title = $${values.length}`); }
  if (data.client_company !== undefined) { values.push(data.client_company); sets.push(`client_company = $${values.length}`); }
  if (data.avatar_url !== undefined)     { values.push(data.avatar_url);     sets.push(`avatar_url = $${values.length}`); }
  if (data.content !== undefined)        { values.push(data.content);        sets.push(`content = $${values.length}`); }
  if (data.rating !== undefined)         { values.push(data.rating);         sets.push(`rating = $${values.length}`); }
  if (data.is_featured !== undefined)    { values.push(data.is_featured);    sets.push(`is_featured = $${values.length}`); }
  if (data.is_published !== undefined)   { values.push(data.is_published);   sets.push(`is_published = $${values.length}`); }

  if (!sets.length) return null;
  const result = await getPool().query(
    `UPDATE testimonials SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteTestimonial(id: number): Promise<void> {
  const pool = getPool();
  await pool.query(`DELETE FROM testimonials WHERE id = $1`, [id]);
}
