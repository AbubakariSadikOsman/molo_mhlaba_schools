import { useEffect, useState } from 'react';
import { useAppData } from '../lib/AppDataContext';
import { useAuth } from '../auth/AuthProvider';
import { useUi } from '../lib/UiContext';
import * as api from '../lib/api';
import { studentStats } from '../lib/stats';
import type { IlpPlan, Student } from '../types';

export function IlpPanel({ student }: { student: Student }) {
  const { incidents, ilpNotes } = useAppData();
  const { profile } = useAuth();
  const { toast } = useUi();
  const [plans, setPlans] = useState<IlpPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const st = studentStats(student.id, incidents);
  const suggestedDomain =
    st.assigned !== 'Insufficient Data' ? ilpNotes.find((n) => n.trend_group === st.assigned)?.ilp_goal_domain ?? '' : '';

  const [goalDomain, setGoalDomain] = useState('');
  const [goalText, setGoalText] = useState('');
  const [strategies, setStrategies] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setPlans(await api.fetchIlpPlans(student.id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  function openForm() {
    setGoalDomain(suggestedDomain);
    setGoalText('');
    setStrategies('');
    setTargetDate('');
    setFormOpen(true);
  }

  async function submit() {
    if (!profile || !goalDomain.trim() || !goalText.trim()) {
      toast('Goal domain and goal are required');
      return;
    }
    setSaving(true);
    try {
      await api.createIlpPlan({
        student_id: student.id,
        goal_domain: goalDomain.trim(),
        goal_text: goalText.trim(),
        strategies: strategies || null,
        target_date: targetDate || null,
        created_by: profile.id,
        created_by_name: profile.full_name || profile.email,
      });
      await load();
      setFormOpen(false);
      toast('ILP goal added');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save ILP goal');
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: IlpPlan['status']) {
    await api.updateIlpPlanStatus(id, status);
    await load();
  }

  return (
    <div>
      <div className="section-title">Individual Learning Plan</div>
      <div className="card">
        {!formOpen && (
          <button className="btn-primary" onClick={openForm}>
            + Add ILP goal
          </button>
        )}
        {formOpen && (
          <div>
            <div className="form-field">
              <label>Goal domain</label>
              <input value={goalDomain} onChange={(e) => setGoalDomain(e.target.value)} placeholder={suggestedDomain || 'e.g. Self-regulation / emotional coping skills'} />
              {suggestedDomain && (
                <div className="admin-list-sub" style={{ marginTop: 4 }}>
                  Suggested from {student.full_name.split(' ')[0]}'s dominant trend ({st.assigned}): "{suggestedDomain}"
                </div>
              )}
            </div>
            <div className="form-field">
              <label>Goal</label>
              <textarea rows={2} value={goalText} onChange={(e) => setGoalText(e.target.value)} placeholder="What should this learner be able to do?" />
            </div>
            <div className="form-field">
              <label>Strategies</label>
              <textarea rows={2} value={strategies} onChange={(e) => setStrategies(e.target.value)} placeholder="Classroom strategies to support this goal" />
            </div>
            <div className="form-field">
              <label>Target date (optional)</label>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={submit} disabled={saving}>
              {saving ? 'Saving…' : 'Save goal'}
            </button>
            <button className="btn-secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {loading && <div className="empty-hint">Loading…</div>}
      {!loading &&
        plans.map((p) => (
          <div className="ref-card" key={p.id}>
            <h4>
              {p.goal_domain}{' '}
              <span
                className="chip outline"
                style={{ fontSize: 9.5, marginLeft: 4, opacity: p.status === 'active' ? 1 : 0.6 }}
              >
                {p.status}
              </span>
            </h4>
            <p>{p.goal_text}</p>
            {p.strategies && (
              <p>
                <b>Strategies:</b> {p.strategies}
              </p>
            )}
            {p.target_date && (
              <p>
                <b>Target:</b> {p.target_date}
              </p>
            )}
            <p style={{ color: 'var(--text-muted)' }}>
              Added by {p.created_by_name || 'staff'}
            </p>
            {p.status === 'active' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn-danger-text" style={{ color: 'var(--status-good)' }} onClick={() => setStatus(p.id, 'achieved')}>
                  Mark achieved
                </button>
                <button className="btn-danger-text" onClick={() => setStatus(p.id, 'discontinued')}>
                  Discontinue
                </button>
              </div>
            )}
          </div>
        ))}
      {!loading && !plans.length && <div className="empty-hint">No ILP goals yet.</div>}
    </div>
  );
}
