const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

// The API returns timestamps without a zone (for example "2026-10-14T10:00:00"). They are UTC.
// new Date() would read such a string as local time and shift it by your UTC offset,
// so mark it as UTC first.
export function parseDate(value) {
  if (!value) return null;

  let text = String(value).replace(/\[.*\]$/, '');
  if (/^\d{4}-\d{2}-\d{2}T/.test(text) && !HAS_ZONE.test(text)) text += 'Z';

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = parseDate(value);
  return date ? date.toLocaleString() : String(value ?? '');
}