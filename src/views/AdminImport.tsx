import { useState } from 'react';
import Papa from 'papaparse';
import { useAppData } from '../lib/AppDataContext';
import { useUi } from '../lib/UiContext';
import * as api from '../lib/api';
import { supabase } from '../supabaseClient';
import { CATEGORY_ORDER } from '../types';
import { isValidEmail, isValidSchoolAge } from '../lib/validation';

const STUDENT_COLUMNS =
  'student_code, campus_id, full_name, class, teacher, date_of_birth, enrolment_date, allergies, medical_conditions, emotional_issues, psychological_problems, social_issues, notes, parent_name, parent_email';

const INCIDENT_COLUMNS =
  'student_code, campus_id, date, category, specific_behaviour, trigger_context, location, severity, duration_min, intervention_used, outcome, staff_reporting_name, notes';

type Mode = 'students' | 'incidents';

export function AdminImport({ onBack }: { onBack: () => void }) {
  const { campuses, refresh } = useAppData();
  const { toast } = useUi();
  const [mode, setMode] = useState<Mode>('students');
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null);

  const validCampusIds = new Set(campuses.map((c) => c.id));

  async function handleFile(file: File) {
    setFileName(file.name);
    setResult(null);
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
      if (parsed.errors.length) {
        setResult({ inserted: 0, errors: parsed.errors.map((e) => `Row ${e.row}: ${e.message}`) });
        return;
      }
      if (mode === 'students') {
        await importStudents(parsed.data);
      } else {
        await importIncidents(parsed.data);
      }
    } catch (err) {
      setResult({ inserted: 0, errors: [err instanceof Error ? err.message : 'Could not read file'] });
    } finally {
      setBusy(false);
    }
  }

  async function importStudents(rows: Record<string, string>[]) {
    const valid: api.NewStudent[] = [];
    const errors: string[] = [];
    rows.forEach((r, i) => {
      const line = i + 2; // header is line 1
      const campusId = (r.campus_id || '').trim().toUpperCase();
      if (!validCampusIds.has(campusId)) {
        errors.push(`Row ${line}: campus_id "${r.campus_id}" is not one of ${[...validCampusIds].join('/')}`);
        return;
      }
      if (!r.full_name?.trim()) {
        errors.push(`Row ${line}: full_name is required`);
        return;
      }
      if (!isValidSchoolAge(r.date_of_birth?.trim())) {
        errors.push(`Row ${line}: date_of_birth "${r.date_of_birth}" must give an age between 3 and 13`);
        return;
      }
      if (!r.parent_name?.trim() || !isValidEmail(r.parent_email || '')) {
        errors.push(`Row ${line}: parent_name and a valid parent_email are required`);
        return;
      }
      valid.push({
        campus_id: campusId,
        student_code: r.student_code?.trim() || null,
        full_name: r.full_name.trim(),
        class: r.class?.trim() || null,
        teacher: r.teacher?.trim() || null,
        date_of_birth: r.date_of_birth.trim(),
        enrolment_date: r.enrolment_date?.trim() || null,
        allergies: r.allergies?.trim() || null,
        medical_conditions: r.medical_conditions?.trim() || null,
        emotional_issues: r.emotional_issues?.trim() || null,
        psychological_problems: r.psychological_problems?.trim() || null,
        social_issues: r.social_issues?.trim() || null,
        notes: r.notes?.trim() || null,
        parent_name: r.parent_name.trim(),
        parent_email: r.parent_email.trim(),
      });
    });
    const { inserted, errors: insertErrors } = await api.bulkInsertStudents(valid);
    setResult({ inserted, errors: [...errors, ...insertErrors] });
    await refresh();
    if (inserted) toast(`Imported ${inserted} student${inserted === 1 ? '' : 's'}`);
  }

  async function importIncidents(rows: Record<string, string>[]) {
    const { data: allStudents, error: studentsErr } = await supabase
      .from('students')
      .select('id, student_code, campus_id');
    if (studentsErr) {
      setResult({ inserted: 0, errors: [studentsErr.message] });
      return;
    }
    const studentCodeToId: Record<string, string> = {};
    (allStudents ?? []).forEach((s) => {
      if (s.student_code) studentCodeToId[s.student_code] = s.id;
    });

    const valid: api.BulkIncidentRow[] = [];
    const errors: string[] = [];
    rows.forEach((r, i) => {
      const line = i + 2;
      const campusId = (r.campus_id || '').trim().toUpperCase();
      if (!validCampusIds.has(campusId)) {
        errors.push(`Row ${line}: campus_id "${r.campus_id}" is not one of ${[...validCampusIds].join('/')}`);
        return;
      }
      const category = (r.category || '').trim();
      if (!(CATEGORY_ORDER as readonly string[]).includes(category)) {
        errors.push(`Row ${line}: category "${r.category}" is not a recognised behaviour category`);
        return;
      }
      const severity = Number(r.severity);
      if (!Number.isInteger(severity) || severity < 1 || severity > 5) {
        errors.push(`Row ${line}: severity "${r.severity}" must be a whole number 1–5`);
        return;
      }
      if (!r.date?.trim() || !r.student_code?.trim()) {
        errors.push(`Row ${line}: date and student_code are required`);
        return;
      }
      valid.push({
        student_code: r.student_code.trim(),
        campus_id: campusId,
        date: r.date.trim(),
        category,
        specific_behaviour: r.specific_behaviour?.trim() || null,
        trigger_context: r.trigger_context?.trim() || null,
        location: r.location?.trim() || null,
        severity,
        duration_min: r.duration_min ? Number(r.duration_min) : null,
        intervention_used: r.intervention_used?.trim() || null,
        outcome: r.outcome?.trim() || null,
        staff_reporting_name: r.staff_reporting_name?.trim() || null,
        notes: r.notes?.trim() || null,
      });
    });
    const { inserted, errors: insertErrors } = await api.bulkInsertIncidents(valid, studentCodeToId);
    setResult({ inserted, errors: [...errors, ...insertErrors] });
    await refresh();
    if (inserted) toast(`Imported ${inserted} incident${inserted === 1 ? '' : 's'}`);
  }

  return (
    <div>
      <button className="back-row" onClick={onBack}>
        ← Back to Students
      </button>
      <div className="section-title">Import from CSV</div>
      <div className="card">
        <div className="form-field">
          <label>What are you importing?</label>
          <select value={mode} onChange={(e) => { setMode(e.target.value as Mode); setResult(null); }}>
            <option value="students">Students (roster)</option>
            <option value="incidents">Behaviour log (incidents)</option>
          </select>
        </div>
        <div className="empty-hint" style={{ padding: '10px 0', textAlign: 'left' }}>
          Expected CSV columns (first row = header, exact names):
          <br />
          <code style={{ fontSize: 11 }}>{mode === 'students' ? STUDENT_COLUMNS : INCIDENT_COLUMNS}</code>
          {mode === 'students' && (
            <>
              <br />
              <br />
              campus_id must be one of: {[...validCampusIds].join(', ')}. date_of_birth must give an age
              between 3 and 13 (YYYY-MM-DD). parent_name and parent_email are required for every row —
              this is the school's admission contact for that learner.
            </>
          )}
          {mode === 'incidents' && (
            <>
              <br />
              <br />
              student_code must match an existing student's code (e.g. TEN-0001) already in the roster —
              import students first. category must be one of the 8 behaviour categories. severity is 1–5.
            </>
          )}
        </div>
        <div className="form-field">
          <label>CSV file</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
        {busy && <div className="empty-hint">Importing {fileName}…</div>}
        {result && (
          <div className={result.errors.length ? 'auth-error' : 'auth-notice'} style={{ maxHeight: 220, overflowY: 'auto' }}>
            <div>
              <b>{result.inserted}</b> row{result.inserted === 1 ? '' : 's'} imported.
              {result.errors.length > 0 && ` ${result.errors.length} row(s) skipped:`}
            </div>
            {result.errors.map((e, i) => (
              <div key={i} style={{ marginTop: 4 }}>
                {e}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
