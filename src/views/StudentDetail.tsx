import { useAppData } from '../lib/AppDataContext';
import { studentStats, initials, avatarColor, fmtDate } from '../lib/stats';
import { CATEGORY_ORDER, CAT_VAR } from '../types';
import { LogRow } from '../components/LogRow';
import { IlpPanel } from '../components/IlpPanel';
import { ParentCommsPanel } from '../components/ParentCommsPanel';

export function StudentDetail({ studentId, onBack }: { studentId: string; onBack: () => void }) {
  const { students, incidents, campuses } = useAppData();
  const s = students.find((x) => x.id === studentId);
  if (!s) {
    return (
      <div>
        <button className="back-row" onClick={onBack}>
          ← Back to Students
        </button>
        <div className="empty-hint">Student not found.</div>
      </div>
    );
  }
  const st = studentStats(s.id, incidents);
  const rows = incidents.filter((r) => r.student_id === s.id);
  const maxCat = Math.max(1, ...Object.values(st.counts));
  const campus = campuses.find((c) => c.id === s.campus_id);

  return (
    <div>
      <button className="back-row" onClick={onBack}>
        ← Back to Students
      </button>
      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="avatar" style={{ background: avatarColor(s.full_name), width: 52, height: 52, fontSize: 18 }}>
          {initials(s.full_name)}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{s.full_name}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            {s.class || '—'} · {s.teacher || '—'}
          </div>
          <div style={{ fontSize: 11, color: campus?.brand_color, fontWeight: 700, marginTop: 2 }}>{campus?.name}</div>
        </div>
      </div>

      <div className="section-title">Individual dashboard</div>
      <div className="stat-row">
        <div className="stat-tile">
          <div className="stat-val">{st.total}</div>
          <div className="stat-label">Total incidents</div>
        </div>
        <div className="stat-tile">
          <div className="stat-val">{st.avgSev.toFixed(2)}</div>
          <div className="stat-label">Avg. severity</div>
        </div>
        <div className="stat-tile">
          <div className="stat-val" style={{ fontSize: 14 }}>
            {fmtDate(st.latest)}
          </div>
          <div className="stat-label">Latest incident</div>
        </div>
        <div className="stat-tile">
          <div
            className="stat-val"
            style={{ fontSize: 13, color: st.assigned === 'Insufficient Data' ? 'var(--text-muted)' : CAT_VAR[st.assigned] }}
          >
            {st.assigned}
          </div>
          <div className="stat-label">Assigned group</div>
        </div>
      </div>

      <div className="section-title">Category breakdown</div>
      <div className="card">
        {CATEGORY_ORDER.filter((c) => st.counts[c] > 0).length ? (
          CATEGORY_ORDER.filter((c) => st.counts[c] > 0).map((c) => (
            <div className="barchart-row" key={c}>
              <div className="barchart-label">{c}</div>
              <div className="barchart-track">
                <div className="barchart-fill" style={{ width: `${(st.counts[c] / maxCat) * 100}%`, background: CAT_VAR[c] }} />
              </div>
              <div className="barchart-val">{st.counts[c]}</div>
            </div>
          ))
        ) : (
          <div className="empty-hint">No incidents yet.</div>
        )}
      </div>

      <div className="section-title">Incident history</div>
      <div className="card" style={{ padding: '4px 12px' }}>
        {rows.length ? rows.map((r) => <LogRow key={r.id} r={r} showStudentLink={false} />) : <div className="empty-hint">No incidents logged yet.</div>}
      </div>

      <IlpPanel student={s} />
      <ParentCommsPanel student={s} />
    </div>
  );
}
