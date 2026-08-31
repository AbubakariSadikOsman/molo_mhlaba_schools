export type ViewName = 'home' | 'log' | 'students' | 'studentDetail' | 'trends' | 'more';

const TABS: { view: ViewName; icon: string; label: string }[] = [
  { view: 'home', icon: '🏠', label: 'Home' },
  { view: 'log', icon: '📋', label: 'Log' },
  { view: 'students', icon: '🧒', label: 'Students' },
  { view: 'trends', icon: '📊', label: 'Trends' },
  { view: 'more', icon: '⋯', label: 'More' },
];

export function TabBar({ view, onChange }: { view: ViewName; onChange: (v: ViewName) => void }) {
  return (
    <div className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.view}
          className={`tab${view === t.view || (t.view === 'students' && view === 'studentDetail') ? ' active' : ''}`}
          onClick={() => onChange(t.view)}
        >
          <div className="tab-icon">{t.icon}</div>
          <div className="tab-label">{t.label}</div>
        </button>
      ))}
    </div>
  );
}
