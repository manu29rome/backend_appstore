import { getPool } from '../../config/db';

export interface CompanySettings {
  id: number;
  company_name: string;
  slogan: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  country: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  updated_at: string;
}

export async function getSettings(): Promise<CompanySettings | null> {
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM company_settings WHERE id = 1`);
  return result.rows[0] || null;
}

const ALLOWED_COLS = [
  'company_name', 'slogan', 'logo_url', 'email', 'phone', 'whatsapp',
  'address', 'country', 'facebook_url', 'instagram_url', 'twitter_url',
  'linkedin_url', 'github_url',
] as const;

export async function updateSettings(data: Partial<Omit<CompanySettings, 'id' | 'updated_at'>>): Promise<CompanySettings | null> {
  const sets: string[] = [];
  const values: unknown[] = [];

  for (const col of ALLOWED_COLS) {
    if (col in data) {
      values.push((data as Record<string, unknown>)[col] ?? null);
      sets.push(`${col} = $${values.length}`);
    }
  }

  if (sets.length === 0) return getSettings();

  sets.push('updated_at = NOW()');
  await getPool().query(
    `UPDATE company_settings SET ${sets.join(', ')} WHERE id = 1`,
    values
  );
  return getSettings();
}
