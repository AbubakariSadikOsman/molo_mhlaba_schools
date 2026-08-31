import { useEffect, useState } from 'react';
import { useAppData } from '../lib/AppDataContext';
import { useUi } from '../lib/UiContext';
import * as api from '../lib/api';
import type { Profile, Role } from '../types';

export function AdminStaff({ onBack }: { onBack: () => void }) {
  const { campuses } = useAppData();
  const { toast } = useUi();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setProfiles(await api.fetchAllProfiles());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateRole(p: Profile, role: Role) {
    await api.updateProfileRole(p.id, role, p.campus_id);
    await load();
    toast(`${p.full_name || p.email} is now ${role}`);
  }

  async function updateCampus(p: Profile, campusId: string) {
    await api.updateProfileRole(p.id, p.role, campusId === 'ALL' ? null : campusId);
    await load();
  }

  return (
    <div>
      <button className="back-row" onClick={onBack}>
        ← Back to More
      </button>
      <div className="section-title">Staff &amp; roles ({profiles.length})</div>
      <div className="card">
        {loading && <div className="empty-hint">Loading…</div>}
        {!loading && !profiles.length && <div className="empty-hint">No staff accounts yet.</div>}
        {profiles.map((p) => (
          <div className="admin-list-item" key={p.id} style={{ flexWrap: 'wrap' }}>
            <div>
              <div className="admin-list-name">{p.full_name || '(no name)'}</div>
              <div className="admin-list-sub">{p.email}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <select className="role-select" value={p.role} onChange={(e) => updateRole(p, e.target.value as Role)}>
                <option value="pending">pending</option>
                <option value="staff">staff</option>
                <option value="admin">admin</option>
              </select>
              <select className="role-select" value={p.campus_id ?? 'ALL'} onChange={(e) => updateCampus(p, e.target.value)}>
                <option value="ALL">All campuses</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.short_code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
      <div className="empty-hint">
        New staff sign-ups start as "pending" with no campus access. Assign a role and campus
        here to grant them access.
      </div>
    </div>
  );
}
