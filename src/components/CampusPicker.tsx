import { useAppData } from '../lib/AppDataContext';

export function CampusPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { campuses, campusScope, setCampusScope } = useAppData();

  function pick(id: string | null) {
    setCampusScope(id);
    onClose();
  }

  return (
    <div className={`campus-picker${open ? ' open' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="campus-sheet">
        <h3>Switch campus</h3>
        <div
          className={`campus-option${campusScope === null ? ' active' : ''}`}
          onClick={() => pick(null)}
        >
          <div className="swatch swatch-logo">
            <img src="/logos/molo-mhlaba.png" alt="" />
          </div>
          <div style={{ flex: 1 }}>
            <div className="campus-option-name">All Campuses</div>
            <div className="campus-option-sub">District-wide view</div>
          </div>
        </div>
        {campuses.map((c) => (
          <div
            key={c.id}
            className={`campus-option${campusScope === c.id ? ' active' : ''}`}
            onClick={() => pick(c.id)}
          >
            {c.logo_url ? (
              <div className="swatch swatch-logo">
                <img src={c.logo_url} alt="" />
              </div>
            ) : (
              <div className="swatch" style={{ background: c.brand_color }} />
            )}
            <div style={{ flex: 1 }}>
              <div className="campus-option-name">{c.name}</div>
              <div className="campus-option-sub">{c.short_code}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
