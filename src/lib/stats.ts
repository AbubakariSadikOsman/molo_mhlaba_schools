import { CATEGORY_ORDER } from '../types';
import type { Incident } from '../types';

export interface StudentStats {
  total: number;
  avgSev: number;
  counts: Record<string, number>;
  latest: string | null;
  assigned: string;
}

export function studentStats(studentId: string, incidents: Incident[]): StudentStats {
  const rows = incidents.filter((r) => r.student_id === studentId);
  const total = rows.length;
  const avgSev = total ? rows.reduce((a, r) => a + r.severity, 0) / total : 0;
  const counts: Record<string, number> = {};
  CATEGORY_ORDER.forEach((c) => (counts[c] = 0));
  rows.forEach((r) => {
    counts[r.category] = (counts[r.category] || 0) + 1;
  });
  let top = CATEGORY_ORDER[0] as string;
  let topN = -1;
  for (const c of CATEGORY_ORDER) {
    if (counts[c] > topN) {
      topN = counts[c];
      top = c;
    }
  }
  const latest = rows.length ? rows.map((r) => r.date).sort().slice(-1)[0] : null;
  const assigned = total >= 3 ? top : 'Insufficient Data';
  return { total, avgSev, counts, latest, assigned };
}

export function sevColor(s: number): string {
  if (s <= 2) return 'var(--status-good)';
  if (s === 3) return 'var(--status-warning)';
  if (s === 4) return 'var(--status-serious)';
  return 'var(--status-critical)';
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function avatarColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 45%)`;
}

export function fmtDate(d: string | null): string {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}
