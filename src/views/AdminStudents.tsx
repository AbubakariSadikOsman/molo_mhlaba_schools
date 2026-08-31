import { useState } from 'react';
import { useAppData } from '../lib/AppDataContext';
import { useUi } from '../lib/UiContext';
import * as api from '../lib/api';
import { isValidEmail, isValidSchoolAge } from '../lib/validation';

export function AdminStudents({ onBack, onImportData }: { onBack: () => void; onImportData: () => void }) {
  const { campuses, students, refresh, canSwitchCampus, campusScope } = useAppData();
  const { toast } = useUi();

  const [campusId, setCampusId] = useState(campusScope || campuses[0]?.id || '');
  const [fullName, setFullName] = useState('');
  const [cls, setCls] = useState('');
  const [teacher, setTeacher] = useState('');
  const [dob, setDob] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medical, setMedical] = useState('');
  const [emotional, setEmotional] = useState('');
  const [psychological, setPsychological] = useState('');
  const [social, setSocial] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!isValidSchoolAge(dob)) {
      setError('Date of birth must put the learner between 3 and 13 years old — Molo Mhlaba enrols girls in that age range only.');
      return;
    }
    if (!parentName.trim()) {
      setError('A parent/guardian name is required.');
      return;
    }
    if (!isValidEmail(parentEmail)) {
      setError('A valid parent/guardian email is required — the school uses it as the primary contact for admission and updates.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createStudent({
        campus_id: campusId,
        full_name: fullName.trim(),
        class: cls || null,
        teacher: teacher || null,
        date_of_birth: dob,
        allergies: allergies || null,
        medical_conditions: medical || null,
        emotional_issues: emotional || null,
        psychological_problems: psychological || null,
        social_issues: social || null,
        notes: notes || null,
        parent_name: parentName.trim(),
        parent_email: parentEmail.trim(),
      });
      await refresh();
      toast(`${fullName.trim()} added`);
      setFullName('');
      setCls('');
      setTeacher('');
      setDob('');
      setParentName('');
      setParentEmail('');
      setAllergies('');
      setMedical('');
      setEmotional('');
      setPsychological('');
      setSocial('');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add student');
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id: string, name: string) {
    if (!confirm(`Remove ${name} from the active roster?`)) return;
    await api.deactivateStudent(id);
    await refresh();
    toast(`${name} removed`);
  }

  return (
    <div>
      <button className="back-row" onClick={onBack}>
        ← Back to More
      </button>
      <button className="btn-secondary" onClick={onImportData}>
        Import students / behaviour log from CSV
      </button>
      <div className="section-title">Add a student</div>
      <div className="card">
        {canSwitchCampus && (
          <div className="form-field">
            <label>Campus</label>
            <select value={campusId} onChange={(e) => setCampusId(e.target.value)}>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="form-field">
          <label>Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Class</label>
          <input value={cls} onChange={(e) => setCls(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Teacher</label>
          <input value={teacher} onChange={(e) => setTeacher(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Date of birth</label>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          <div className="admin-list-sub" style={{ marginTop: 4 }}>
            Molo Mhlaba enrols girls aged 3–13 only. Gender is fixed to Female.
          </div>
        </div>
        <div className="form-field">
          <label>Parent/guardian name</label>
          <input value={parentName} onChange={(e) => setParentName(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Parent/guardian email</label>
          <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} />
          <div className="admin-list-sub" style={{ marginTop: 4 }}>
            Required — this is the school's primary contact channel for this learner.
          </div>
        </div>
        <div className="form-field">
          <label>Allergies</label>
          <input value={allergies} onChange={(e) => setAllergies(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Medical conditions</label>
          <input value={medical} onChange={(e) => setMedical(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Emotional issues</label>
          <input value={emotional} onChange={(e) => setEmotional(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Psychological problems</label>
          <input value={psychological} onChange={(e) => setPsychological(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Social issues</label>
          <input value={social} onChange={(e) => setSocial(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Notes</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <div className="auth-error">{error}</div>}
        <button className="btn-primary" onClick={submit} disabled={saving}>
          {saving ? 'Saving…' : 'Add student'}
        </button>
      </div>

      <div className="section-title">Active roster ({students.length})</div>
      <div className="card">
        {students.length ? (
          students.map((s) => (
            <div className="admin-list-item" key={s.id}>
              <div>
                <div className="admin-list-name">{s.full_name}</div>
                <div className="admin-list-sub">
                  {campuses.find((c) => c.id === s.campus_id)?.name} · {s.class || '—'}
                </div>
                <div className="admin-list-sub">
                  Parent: {s.parent_name} · {s.parent_email}
                </div>
              </div>
              <button className="btn-danger-text" onClick={() => deactivate(s.id, s.full_name)}>
                Remove
              </button>
            </div>
          ))
        ) : (
          <div className="empty-hint">No students yet.</div>
        )}
      </div>
    </div>
  );
}
