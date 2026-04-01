import { getPool } from '../../config/db';
import { PortfolioProject } from '../../types';

export async function getPublishedProjects(category?: string): Promise<PortfolioProject[]> {
  const pool = getPool();
  if (category) {
    const result = await pool.query(
      `SELECT * FROM portfolio_projects WHERE is_published = true AND category = $1 ORDER BY display_order ASC, created_at DESC`,
      [category]
    );
    return result.rows;
  }
  const result = await pool.query(
    `SELECT * FROM portfolio_projects WHERE is_published = true ORDER BY display_order ASC, created_at DESC`
  );
  return result.rows;
}

export async function getFeaturedProjects(): Promise<PortfolioProject[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM portfolio_projects WHERE is_published = true AND is_featured = true ORDER BY display_order ASC`
  );
  return result.rows;
}

export async function getProjectBySlug(slug: string): Promise<PortfolioProject | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM portfolio_projects WHERE slug = $1 AND is_published = true`,
    [slug]
  );
  return result.rows[0] || null;
}

export async function getAllProjects(): Promise<PortfolioProject[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM portfolio_projects ORDER BY display_order ASC, created_at DESC`
  );
  return result.rows;
}

export async function createProject(data: {
  title: string;
  slug: string;
  short_description: string;
  full_description?: string;
  category: string;
  tech_stack: string;
  thumbnail_url?: string;
  images?: string;
  live_url?: string;
  github_url?: string;
  client_name?: string;
  completion_date?: string;
  is_featured?: boolean;
  is_published?: boolean;
}): Promise<PortfolioProject> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO portfolio_projects
       (title, slug, short_description, full_description, category, tech_stack, thumbnail_url, images, live_url, github_url, client_name, completion_date, is_featured, is_published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [
      data.title, data.slug, data.short_description, data.full_description || null,
      data.category, data.tech_stack, data.thumbnail_url || null, data.images || null,
      data.live_url || null, data.github_url || null, data.client_name || null,
      data.completion_date || null, data.is_featured ?? false, data.is_published !== false,
    ]
  );
  return result.rows[0];
}

export async function updateProject(id: number, data: Partial<Omit<PortfolioProject, 'id' | 'created_at'>>): Promise<PortfolioProject | null> {
  const sets: string[] = ['updated_at = NOW()'];
  const values: unknown[] = [id];

  const strCols = ['title','slug','short_description','full_description','category','tech_stack','thumbnail_url','images','live_url','github_url','client_name','completion_date'] as const;
  for (const col of strCols) {
    if (col in data) {
      values.push((data as Record<string, unknown>)[col] ?? null);
      sets.push(`${col} = $${values.length}`);
    }
  }
  if (data.is_featured !== undefined) { values.push(data.is_featured); sets.push(`is_featured = $${values.length}`); }
  if (data.is_published !== undefined) { values.push(data.is_published); sets.push(`is_published = $${values.length}`); }

  const result = await getPool().query(
    `UPDATE portfolio_projects SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteProject(id: number): Promise<void> {
  const pool = getPool();
  await pool.query(`DELETE FROM portfolio_projects WHERE id = $1`, [id]);
}
