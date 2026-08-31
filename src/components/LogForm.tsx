import { useEffect, useState } from 'react';
import { useAppData } from '../lib/AppDataContext';
import { useAuth } from '../auth/AuthProvider';
import { useUi } from '../lib/UiContext';
import { CATEGORY_ORDER } from '../types';
import { sevColor } from '../lib/stats';
import * as api from '../lib/api';

export function LogForm() {
  const { campuses, students, campusScope, canSwitchCampus, refresh } = useAppData();
  const { profile } = useAuth();
  const { toast, closeModal } = useUi();

  const [campusId, setCampusId] = useState<string>(campusScope || campuses[0]?.id || '');
  const [studentId, setStudentId] = useState<string>('');
  const [category, setCategory] = useState<string>(CATEGORY_ORDER[0]);
  const [severity, setSeverity] = useState(3);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const campusStudents = students.filter((s) => s.campus_id === campusId);
  useEffect(() => {
    if (!campusStudents.some((s) => s.id === studentId)) {
      setStudentId(campusStudents[0]?.id ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusId, students]);

  async function submit() {
    if (!studentId) {
      toast('Pick a student first');
      return;
    }
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const student = students.find((s) => s.id === studentId);
      await api.createIncident({
        campus_id: campusId,
        student_id: studentId,
        date: new Date().toISOString().slice(0, 10),
        category,
        severity,
        notes: notes || null,
        staff_reporting: profile.id,
        staff_reporting_name: profile.full_name || profile.email,
      });
      await refresh();
      closeModal();
      toast(`Incident logged for ${student?.full_name ?? 'student'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save incident');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h3 style={{ margin: '2px 0 14px' }}>Log a behaviour incident</h3>
      {canSwitchCampus && (
        <div className="form-field">
          <label>Campus</label>
          <select
            value={campusId}
            onChange={(e) => {
              setCampusId(e.target.value);
              setStudentId('');
            }}
          >
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="form-field">
        <label>Student</label>
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          {campusStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label>Behaviour Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORY_ORDER.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label>Severity</label>
        <div className="sev-picker">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`sev-btn${severity === n ? ' selected' : ''}`}
              style={severity === n ? { background: sevColor(n), color: '#fff' } : undefined}
              onClick={() => setSeverity(n)}
            >
              {n}
            </div>
          ))}
        </div>
      </div>
      <div className="form-field">
        <label>Notes (optional)</label>
        <textarea rows={2} placeholder="What happened…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <div className="auth-error">{error}</div>}
      <button className="btn-primary" onClick={submit} disabled={saving || !campusStudents.length}>
        {saving ? 'Saving…' : 'Save incident'}
      </button>
      {!campusStudents.length && <div className="empty-hint">No students in this campus yet.</div>}
    </div>
  );
}
