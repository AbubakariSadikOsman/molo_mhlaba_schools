import { useAppData } from '../lib/AppDataContext';
import { studentStats, initials, avatarColor } from '../lib/stats';
import { CATEGORY_ORDER, CAT_VAR } from '../types';
import { useUi } from '../lib/UiContext';

export function Trends({ onOpenStudent }: { onOpenStudent: (id: string) => void }) {
  const { students, incidents, categories, campusScope, campuses } = useAppData();
  const { openModal, closeModal } = useUi();

  const byGroup: Record<string, { students: typeof students; incidents: number; sevSum: number }> = {};
  CATEGORY_ORDER.forEach((c) => (byGroup[c] = { students: [], incidents: 0, sevSum: 0 }));
  students.forEach((s) => {
    const st = studentStats(s.id, incidents);
    if (st.assigned !== 'Insufficient Data' && byGroup[st.assigned]) byGroup[st.assigned].students.push(s);
  });
  incidents.forEach((r) => {
    if (byGroup[r.category]) {
      byGroup[r.category].incidents++;
      byGroup[r.category].sevSum += r.severity;
    }
  });
  const maxStudents = Math.max(1, ...CATEGORY_ORDER.map((c) => byGroup[c].students.length));

  function openGroupDetail(cat: string) {
    const group = byGroup[cat].students;
    openModal(
      <div>
        <h3 style={{ margin: '2px 0 4px' }}>{cat}</h3>
        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: 10 }}>
          {group.length} student(s) sharing this dominant trend
        </div>
        {group.length ? (
          group.map((s) => {
            const st = studentStats(s.id, incidents);
            return (
              <div
                className="log-row"
                key={s.id}
                onClick={() => {
                  closeModal();
                  onOpenStudent(s.id);
                }}
              >
                <div className="avatar" style={{ background: avatarColor(s.full_name) }}>
                  {initials(s.full_name)}
                </div>
                <div className="log-main">
                  <div className="log-title-row">
                    <span className="log-name">{s.full_name}</span>
                  </div>
                  <div className="log-sub">
                    {s.class} · {st.total} incidents · avg {st.avgSev.toFixed(1)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-hint">No students currently in this group.</div>
        )}
      </div>,
    );
  }

  return (
    <div>
      <div className="section-title">
        Behavioural Trend Groups {campusScope ? `— ${campuses.find((c) => c.id === campusScope)?.name}` : '— all campuses'}
      </div>
      <div className="card">
        {CATEGORY_ORDER.map((c) => (
          <div className="barchart-row" key={c}>
            <div className="barchart-label">{c}</div>
            <div className="barchart-track">
              <div
                className="barchart-fill"
                style={{ width: `${(byGroup[c].students.length / maxStudents) * 100}%`, background: CAT_VAR[c] }}
              />
            </div>
            <div className="barchart-val">{byGroup[c].students.length}</div>
          </div>
        ))}
      </div>
      {CATEGORY_ORDER.map((c) => {
        const g = byGroup[c];
        if (g.students.length === 0 && g.incidents === 0) return null;
        const focus = categories.find((x) => x.name === c)?.ilp_focus_area || '';
        const avgSev = g.incidents ? (g.sevSum / g.incidents).toFixed(2) : '—';
        return (
          <div key={c} className="ref-card" style={{ cursor: 'pointer', borderLeft: `4px solid ${CAT_VAR[c]}` }} onClick={() => openGroupDetail(c)}>
            <h4>
              {c} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 11 }}>— {g.students.length} student{g.students.length === 1 ? '' : 's'}</span>
            </h4>
            <p>
              <b>{g.incidents}</b> incidents this trend · avg severity <b>{avgSev}</b>
            </p>
            <p>Suggested focus: {focus}</p>
          </div>
        );
      })}
    </div>
  );
}
