import { useMemo, useState } from 'react';
import { useAppData } from '../lib/AppDataContext';
import { CATEGORY_ORDER } from '../types';
import { LogRow } from '../components/LogRow';

export function Log({ onOpenStudent }: { onOpenStudent: (id: string) => void }) {
  const { incidents, students, campuses, campusScope } = useAppData();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All categories');

  const rows = useMemo(() => {
    let list = incidents;
    if (cat !== 'All categories') list = list.filter((r) => r.category === cat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => {
        const student = students.find((s) => s.id === r.student_id);
        return student?.full_name.toLowerCase().includes(q) || r.notes?.toLowerCase().includes(q);
      });
    }
    return list;
  }, [incidents, cat, search, students]);

  return (
    <div>
      <div className="section-title">
        Behavior Log {campusScope ? `— ${campuses.find((c) => c.id === campusScope)?.name}` : '— all campuses'}
      </div>
      <div className="log-filter-row">
        <input placeholder="Search student or notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option>All categories</option>
          {CATEGORY_ORDER.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="card" style={{ padding: '4px 12px' }}>
        {rows.length ? (
          rows.map((r) => <LogRow key={r.id} r={r} onOpenStudent={onOpenStudent} />)
        ) : (
          <div className="empty-hint">No matching incidents.</div>
        )}
      </div>
    </div>
  );
}
