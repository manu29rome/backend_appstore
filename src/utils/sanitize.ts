export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[<>]/g, '');
}

export function sanitizeEmail(email: unknown): string {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

export function sanitizeInt(value: unknown, fallback = 0): number {
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? fallback : parsed;
}

export function getPagination(page: unknown, limit: unknown): { page: number; limit: number; offset: number } {
  const p = Math.max(1, sanitizeInt(page, 1));
  const l = Math.min(100, Math.max(1, sanitizeInt(limit, 10)));
  return { page: p, limit: l, offset: (p - 1) * l };
}
