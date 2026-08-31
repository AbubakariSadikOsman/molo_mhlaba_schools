import { useAppData } from '../lib/AppDataContext';
import { CATEGORY_ORDER, CAT_VAR } from '../types';
import { studentStats } from '../lib/stats';
import { LogRow } from '../components/LogRow';

export function Home({ onOpenLogForm }: { onOpenLogForm: () => void }) {
  const { campuses, students, incidents, campusScope, setCampusScope, canSwitchCampus } = useAppData();

  const totalIncidents = incidents.length;
  const avgSev = totalIncidents ? (incidents.reduce((a, r) => a + r.severity, 0) / totalIncidents).toFixed(2) : '—';
  const groups = new Set(
    students.map((s) => studentStats(s.id, incidents).assigned).filter((g) => g && g !== 'Insufficient Data'),
  );

  const catCounts: Record<string, number> = {};
  CATEGORY_ORDER.forEach((c) => (catCounts[c] = 0));
  incidents.forEach((r) => {
    catCounts[r.category] = (catCounts[r.category] || 0) + 1;
  });
  const maxCat = Math.max(1, ...Object.values(catCounts));

  const recent = incidents.slice(0, 5);

  return (
    <div>
      <div className="section-title">Campuses</div>
      <div className="campus-cards">
        <div
          className={`campus-card${campusScope === null ? ' active' : ''}`}
          style={{ background: '#14140f' }}
          onClick={() => canSwitchCampus && setCampusScope(null)}
        >
          <div className="cc-top">
            <div className="cc-logo">
              <img src="/logos/molo-mhlaba.png" alt="" />
            </div>
          </div>
          <div>
            <div className="cc-name">All Campuses</div>
            <div className="cc-count">{students.length} students</div>
          </div>
        </div>
        {campuses.map((c) => {
          const active = campusScope === c.id;
          const n = students.filter((s) => s.campus_id === c.id).length;
          return (
            <div
              key={c.id}
              className={`campus-card${active ? ' active' : ''}`}
              style={{ background: c.brand_color }}
              onClick={() => canSwitchCampus && setCampusScope(c.id)}
            >
              <div className="cc-top">
                {c.logo_url && (
                  <div className="cc-logo">
                    <img src={c.logo_url} alt="" />
                  </div>
                )}
              </div>
              <div>
                <div className="cc-name">{c.name.replace(' Campus', '')}</div>
                <div className="cc-count">{n} students</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-title">Snapshot {campusScope ? `— ${campuses.find((c) => c.id === campusScope)?.name}` : '— all campuses'}</div>
      <div className="stat-row">
        <div className="stat-tile">
          <div className="stat-val">{students.length}</div>
          <div className="stat-label">Students tracked</div>
        </div>
        <div className="stat-tile">
          <div className="stat-val">{totalIncidents}</div>
          <div className="stat-label">Incidents logged</div>
        </div>
        <div className="stat-tile">
          <div className="stat-val">{avgSev}</div>
          <div className="stat-label">Avg. severity</div>
        </div>
        <div className="stat-tile">
          <div className="stat-val">{groups.size}</div>
          <div className="stat-label">Trend groups active</div>
        </div>
      </div>

      <div className="section-title">Incidents by category</div>
      <div className="card">
        {CATEGORY_ORDER.map((c) => (
          <div className="barchart-row" key={c}>
            <div className="barchart-label">{c}</div>
            <div className="barchart-track">
              <div
                className="barchart-fill"
                style={{ width: `${(catCounts[c] / maxCat) * 100}%`, background: CAT_VAR[c] }}
              />
            </div>
            <div className="barchart-val">{catCounts[c]}</div>
          </div>
        ))}
      </div>

      <div className="section-title">Recent incidents</div>
      <div className="card" style={{ padding: '4px 12px' }}>
        {recent.length ? recent.map((r) => <LogRow key={r.id} r={r} />) : <div className="empty-hint">No incidents logged yet.</div>}
      </div>

      <button className="btn-primary" onClick={onOpenLogForm} style={{ marginTop: 4 }}>
        + Log an incident
      </button>
    </div>
  );
}
