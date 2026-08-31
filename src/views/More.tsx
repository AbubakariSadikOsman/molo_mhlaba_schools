import { useAppData } from '../lib/AppDataContext';
import { useAuth } from '../auth/AuthProvider';
import { CAT_VAR } from '../types';

export function More({ onManageStudents, onManageStaff }: { onManageStudents: () => void; onManageStaff: () => void }) {
  const { categories, ilpNotes } = useAppData();
  const { profile } = useAuth();

  return (
    <div>
      {profile?.role === 'admin' && (
        <>
          <div className="section-title">Administration</div>
          <button className="btn-primary" onClick={onManageStudents}>
            Manage students
          </button>
          <button className="btn-secondary" onClick={onManageStaff}>
            Manage staff &amp; roles
          </button>
        </>
      )}

      <div className="section-title">Behavior Categories (reference)</div>
      {categories.map((c) => (
        <div className="ref-card" key={c.name} style={{ borderLeft: `4px solid ${CAT_VAR[c.name]}` }}>
          <h4>{c.name}</h4>
          <p>{c.description}</p>
          <p>
            <b>Examples:</b> {c.example_behaviours}
          </p>
          <p>
            <b>Typical ILP focus:</b> {c.ilp_focus_area}
          </p>
        </div>
      ))}

      <div className="section-title">ILP Bridge Notes (reference)</div>
      {ilpNotes.map((i) => (
        <div className="ref-card" key={i.trend_group}>
          <h4>{i.trend_group}</h4>
          <p>
            <b>ILP goal domain:</b> {i.ilp_goal_domain}
          </p>
          <p>{i.data_feed_notes}</p>
        </div>
      ))}

      <div className="section-title">About</div>
      <div className="ref-card">
        <p>
          Molo Mhlaba multi-campus behaviour tracker. Every incident, student record, and staff
          account here is live — logging an incident saves it to the school's database, scoped
          to your campus and role.
        </p>
      </div>
    </div>
  );
}
