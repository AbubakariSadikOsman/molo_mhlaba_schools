import { supabase } from '../supabaseClient';
import type {
  BehaviourCategory,
  Campus,
  CommChannel,
  IlpBridgeNote,
  IlpPlan,
  Incident,
  ParentCommunication,
  Profile,
  Student,
} from '../types';

export async function fetchCampuses(): Promise<Campus[]> {
  const { data, error } = await supabase.from('campuses').select('*').order('sort_order');
  if (error) throw error;
  return data as Campus[];
}

export async function fetchCategories(): Promise<BehaviourCategory[]> {
  const { data, error } = await supabase.from('behaviour_categories').select('*').order('sort_order');
  if (error) throw error;
  return data as BehaviourCategory[];
}

export async function fetchIlpNotes(): Promise<IlpBridgeNote[]> {
  const { data, error } = await supabase.from('ilp_bridge_notes').select('*');
  if (error) throw error;
  return data as IlpBridgeNote[];
}

export async function fetchStudents(campusId: string | null): Promise<Student[]> {
  let q = supabase.from('students').select('*').eq('active', true).order('full_name');
  if (campusId) q = q.eq('campus_id', campusId);
  const { data, error } = await q;
  if (error) throw error;
  return data as Student[];
}

export async function fetchStudent(id: string): Promise<Student> {
  const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Student;
}

export async function fetchIncidents(campusId: string | null): Promise<Incident[]> {
  let q = supabase.from('incidents').select('*').order('date', { ascending: false }).order('created_at', { ascending: false });
  if (campusId) q = q.eq('campus_id', campusId);
  const { data, error } = await q;
  if (error) throw error;
  return data as Incident[];
}

export async function fetchIncidentsForStudent(studentId: string): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data as Incident[];
}

export interface NewIncident {
  campus_id: string;
  student_id: string;
  date: string;
  category: string;
  severity: number;
  notes: string | null;
  staff_reporting: string;
  staff_reporting_name: string;
}

export async function createIncident(payload: NewIncident): Promise<Incident> {
  const { data, error } = await supabase
    .from('incidents')
    .insert({
      ...payload,
      specific_behaviour: payload.category,
      trigger_context: null,
      location: null,
      duration_min: null,
      intervention_used: 'Pending follow-up',
      outcome: 'Ongoing - monitor',
    })
    .select()
    .single();
  if (error) throw error;
  return data as Incident;
}

export interface NewStudent {
  campus_id: string;
  full_name: string;
  class: string | null;
  teacher: string | null;
  date_of_birth: string;
  enrolment_date?: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  emotional_issues?: string | null;
  psychological_problems?: string | null;
  social_issues?: string | null;
  notes: string | null;
  parent_name: string;
  parent_email: string;
  student_code?: string | null;
}

export async function createStudent(payload: NewStudent): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .insert({ ...payload, gender: 'Female' })
    .select()
    .single();
  if (error) throw error;
  return data as Student;
}

export async function bulkInsertStudents(rows: NewStudent[]): Promise<{ inserted: number; errors: string[] }> {
  let inserted = 0;
  const errors: string[] = [];
  for (const row of rows) {
    const { error } = await supabase.from('students').insert({ ...row, gender: 'Female' });
    if (error) errors.push(`${row.student_code ?? row.full_name}: ${error.message}`);
    else inserted++;
  }
  return { inserted, errors };
}

export interface BulkIncidentRow {
  student_code: string;
  campus_id: string;
  date: string;
  category: string;
  specific_behaviour: string | null;
  trigger_context: string | null;
  location: string | null;
  severity: number;
  duration_min: number | null;
  intervention_used: string | null;
  outcome: string | null;
  staff_reporting_name: string | null;
  notes: string | null;
}

export async function bulkInsertIncidents(
  rows: BulkIncidentRow[],
  studentCodeToId: Record<string, string>,
): Promise<{ inserted: number; errors: string[] }> {
  let inserted = 0;
  const errors: string[] = [];
  for (const row of rows) {
    const studentId = studentCodeToId[row.student_code];
    if (!studentId) {
      errors.push(`${row.student_code}: no matching student in this campus`);
      continue;
    }
    const { student_code, ...rest } = row;
    void student_code;
    const { error } = await supabase.from('incidents').insert({ ...rest, student_id: studentId, staff_reporting: null });
    if (error) errors.push(`${row.student_code} (${row.date}): ${error.message}`);
    else inserted++;
  }
  return { inserted, errors };
}

export async function deactivateStudent(id: string): Promise<void> {
  const { error } = await supabase.from('students').update({ active: false }).eq('id', id);
  if (error) throw error;
}

export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at');
  if (error) throw error;
  return data as Profile[];
}

export async function updateProfileRole(id: string, role: string, campusId: string | null): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role, campus_id: campusId }).eq('id', id);
  if (error) throw error;
}

export async function fetchIlpPlans(studentId: string): Promise<IlpPlan[]> {
  const { data, error } = await supabase
    .from('ilp_plans')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as IlpPlan[];
}

export interface NewIlpPlan {
  student_id: string;
  goal_domain: string;
  goal_text: string;
  strategies: string | null;
  target_date: string | null;
  created_by: string;
  created_by_name: string;
}

export async function createIlpPlan(payload: NewIlpPlan): Promise<IlpPlan> {
  const { data, error } = await supabase.from('ilp_plans').insert(payload).select().single();
  if (error) throw error;
  return data as IlpPlan;
}

export async function updateIlpPlanStatus(id: string, status: IlpPlan['status']): Promise<void> {
  const { error } = await supabase.from('ilp_plans').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function fetchParentCommunications(studentId: string): Promise<ParentCommunication[]> {
  const { data, error } = await supabase
    .from('parent_communications')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data as ParentCommunication[];
}

export interface NewParentCommunication {
  student_id: string;
  channel: CommChannel;
  date: string;
  subject: string | null;
  summary: string;
  related_incident_id: string | null;
  logged_by: string;
  logged_by_name: string;
}

export async function createParentCommunication(payload: NewParentCommunication): Promise<ParentCommunication> {
  const { data, error } = await supabase.from('parent_communications').insert(payload).select().single();
  if (error) throw error;
  return data as ParentCommunication;
}

// Fire-and-forget-ish parent notification emails, sent by the send-parent-email
// edge function (Resend). Callers should not block their own success toast on
// these — surface a soft warning on failure instead, since the incident/ILP
// change itself already saved successfully.
export async function sendIncidentEmail(incidentId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('send-parent-email', {
    body: { kind: 'incident', incidentId },
  });
  if (error) throw error;
}

export async function sendIlpStatusEmail(ilpPlanId: string, status: 'achieved' | 'discontinued'): Promise<void> {
  const { error } = await supabase.functions.invoke('send-parent-email', {
    body: { kind: 'ilp_status', ilpPlanId, status },
  });
  if (error) throw error;
}
