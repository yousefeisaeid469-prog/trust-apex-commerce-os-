const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function cleanText(value: unknown, maxLength = 2000): string {
  if (typeof value !== 'string') throw new Error('Expected text');
  const normalized = value.normalize('NFKC').replace(CONTROL_CHARS, '').trim();
  if (normalized.length > maxLength) throw new Error('Text exceeds maximum length');
  return normalized;
}

export function cleanSlug(value: unknown): string {
  const slug = cleanText(value, 80).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid slug');
  return slug;
}
