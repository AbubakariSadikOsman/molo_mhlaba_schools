import type { Incident } from '../types';
import { CAT_VAR } from '../types';
import { fmtDate, sevColor } from '../lib/stats';
import { useAppData } from '../lib/AppDataContext';
import { useUi } from '../lib/UiContext';

export function LogRow({ r, showStudentLink = true }: { r: Incident; showStudentLink?: boolean }) {
  const { students } = useAppData();
  const { openModal } = useUi();
  const student = students.find((s) => s.id === r.student_id);

  return (
    <div className="log-row" onClick={() => openModal(<LogDetail r={r} />)}>
      <div className="log-sev" style={{ background: sevColor(r.severity) }}>
        {r.severity}
      </div>
      <div className="log-main">
        <div className="log-title-row">
          <span className="log-name">{student?.full_name || 'Unknown student'}</span>
          <span className="log-date">{fmtDate(r.date)}</span>
        </div>
        <div className="log-sub">
          <span className="chip" style={{ background: CAT_VAR[r.category] }}>
            {r.category}
          </span>
          {showStudentLink && student && <span>{student.class}</span>}
        </div>
      </div>
    </div>
  );
}

function kv(k: string, v: string) {
  return (
    <div className="kv-row" key={k}>
      <div className="kv-label">{k}</div>
      <div className="kv-val">{v}</div>
    </div>
  );
}

export function LogDetail({ r }: { r: Incident }) {
  const { students } = useAppData();
  const student = students.find((s) => s.id === r.student_id);
  return (
    <div>
      <span className="chip" style={{ background: CAT_VAR[r.category] }}>
        {r.category}
      </span>{' '}
      <span className="chip" style={{ background: sevColor(r.severity) }}>
        Severity {r.severity}
      </span>
      <div style={{ marginTop: 10 }}>
        {kv('Log ID', r.log_code || '—')}
        {kv('Date', fmtDate(r.date))}
        {kv('Student', student?.full_name || '—')}
        {kv('Specific Behaviour', r.specific_behaviour || '—')}
        {kv('Intervention Used', r.intervention_used || '—')}
        {kv('Outcome', r.outcome || '—')}
        {kv('Staff Reporting', r.staff_reporting_name || '—')}
        {r.notes && kv('Notes', r.notes)}
      </div>
    </div>
  );
}
