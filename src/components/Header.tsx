import { useAuth } from '../auth/AuthProvider';
import { useAppData } from '../lib/AppDataContext';

export function Header({ onSwitchCampus }: { onSwitchCampus: () => void }) {
  const { profile, signOut } = useAuth();
  const { campuses, campusScope, canSwitchCampus } = useAppData();
  const activeCampus = campuses.find((c) => c.id === campusScope);
  const label = activeCampus ? activeCampus.name : 'All Campuses';
  const dotColor = activeCampus ? activeCampus.brand_color : '#14140f';

  return (
    <div className="app-header">
      <div className="app-header-row">
        <img
          className="header-logo"
          src={activeCampus?.logo_url || '/logos/molo-mhlaba.png'}
          alt={activeCampus ? `${activeCampus.name} logo` : 'Molo Mhlaba logo'}
        />
        <div className="app-titles">
          <div className="app-title">Behaviour Tracker</div>
          <div className="app-subtitle">
            <span className="scope-dot" style={{ background: dotColor }} />
            <span>{label}</span>
          </div>
        </div>
        {canSwitchCampus && (
          <button className="scope-chip" style={{ background: '#14140f' }} onClick={onSwitchCampus}>
            Switch
          </button>
        )}
      </div>
      <button className="user-chip" onClick={() => signOut()} style={{ marginTop: 6 }}>
        {profile?.full_name || profile?.email} · Sign out
      </button>
    </div>
  );
}
