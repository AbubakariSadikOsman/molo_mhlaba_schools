import { useAppData } from '../lib/AppDataContext';
import { studentStats, initials, avatarColor } from '../lib/stats';
import { CAT_VAR } from '../types';

export function Students({ onOpenStudent }: { onOpenStudent: (id: string) => void }) {
  const { students, incidents, campusScope, campuses } = useAppData();

  return (
    <div>
      <div className="section-title">
        Students {campusScope ? `— ${campuses.find((c) => c.id === campusScope)?.name}` : '— all campuses'}
      </div>
      {students.length ? (
        <div className="student-grid">
          {students.map((s) => {
            const st = studentStats(s.id, incidents);
            const groupColor = st.assigned === 'Insufficient Data' ? '#a9a79d' : CAT_VAR[st.assigned];
            return (
              <div className="student-card" key={s.id} onClick={() => onOpenStudent(s.id)}>
                <div className="avatar" style={{ background: avatarColor(s.full_name) }}>
                  {initials(s.full_name)}
                </div>
                <div className="s-name">{s.full_name}</div>
                <div className="s-class">
                  {s.class || '—'}
                  {!campusScope && (
                    <>
                      <br />
                      {campuses.find((c) => c.id === s.campus_id)?.name}
                    </>
                  )}
                </div>
                <div className="s-stats">
                  <span>{st.total} incidents</span>
                  <span>⌀{st.avgSev.toFixed(1)}</span>
                </div>
                <div style={{ marginTop: 7 }}>
                  <span className="chip" style={{ background: groupColor, fontSize: '9.5px' }}>
                    {st.assigned}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-hint">No students yet. Ask an admin to add students from Admin → Students.</div>
      )}
    </div>
  );
}
