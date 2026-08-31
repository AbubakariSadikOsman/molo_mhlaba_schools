import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useUi } from '../lib/UiContext';
import * as api from '../lib/api';
import { fmtDate } from '../lib/stats';
import type { CommChannel, ParentCommunication, Student } from '../types';

const CHANNEL_LABEL: Record<CommChannel, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  phone: 'Phone call',
  in_person: 'In person',
  other: 'Other',
};

export function ParentCommsPanel({ student }: { student: Student }) {
  const { profile } = useAuth();
  const { toast } = useUi();
  const [comms, setComms] = useState<ParentCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [channel, setChannel] = useState<CommChannel>('email');
  const [subject, setSubject] = useState('');
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setComms(await api.fetchParentCommunications(student.id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  function openForm() {
    setChannel('email');
    setSubject('');
    setSummary('');
    setFormOpen(true);
  }

  async function submit() {
    if (!profile || !summary.trim()) {
      toast('A summary is required');
      return;
    }
    setSaving(true);
    try {
      await api.createParentCommunication({
        student_id: student.id,
        channel,
        date: new Date().toISOString().slice(0, 10),
        subject: subject || null,
        summary: summary.trim(),
        related_incident_id: null,
        logged_by: profile.id,
        logged_by_name: profile.full_name || profile.email,
      });
      await load();
      setFormOpen(false);
      toast('Communication logged');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  function emailParent() {
    const to = student.parent_email;
    const subj = `${student.full_name} — update from Molo Mhlaba`;
    const body = `Dear ${student.parent_name || 'Parent/Guardian'},\n\n\n\nKind regards,\n${profile?.full_name || 'Molo Mhlaba staff'}`;
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div>
      <div className="section-title">Parent communication</div>
      <div className="card">
        <div className="admin-list-sub" style={{ marginBottom: 8 }}>
          Contact: {student.parent_name} · {student.parent_email}
        </div>
        <button className="btn-primary" onClick={emailParent}>
          ✉ Email parent
        </button>
        {!formOpen && (
          <button className="btn-secondary" onClick={openForm}>
            Log a communication
          </button>
        )}
        {formOpen && (
          <div style={{ marginTop: 10 }}>
            <div className="form-field">
              <label>Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value as CommChannel)}>
                {(Object.keys(CHANNEL_LABEL) as CommChannel[]).map((c) => (
                  <option key={c} value={c}>
                    {CHANNEL_LABEL[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Subject (optional)</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Summary</label>
              <textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What was discussed / shared" />
            </div>
            <button className="btn-primary" onClick={submit} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="btn-secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {loading && <div className="empty-hint">Loading…</div>}
      {!loading &&
        comms.map((c) => (
          <div className="ref-card" key={c.id}>
            <h4>
              {CHANNEL_LABEL[c.channel]} · {fmtDate(c.date)}
            </h4>
            {c.subject && (
              <p>
                <b>{c.subject}</b>
              </p>
            )}
            <p>{c.summary}</p>
            <p style={{ color: 'var(--text-muted)' }}>Logged by {c.logged_by_name || 'staff'}</p>
          </div>
        ))}
      {!loading && !comms.length && <div className="empty-hint">No communications logged yet.</div>}
    </div>
  );
}
