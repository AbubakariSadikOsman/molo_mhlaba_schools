export type Role = 'pending' | 'staff' | 'admin';

export interface Campus {
  id: string;
  name: string;
  short_code: string;
  brand_color: string;
  sort_order: number;
  logo_url: string | null;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  campus_id: string | null;
  created_at: string;
}

export interface BehaviourCategory {
  name: string;
  description: string;
  example_behaviours: string;
  ilp_focus_area: string;
  sort_order: number;
}

export interface IlpBridgeNote {
  trend_group: string;
  ilp_goal_domain: string;
  data_feed_notes: string;
}

export interface Student {
  id: string;
  student_code: string | null;
  campus_id: string;
  full_name: string;
  class: string | null;
  teacher: string | null;
  date_of_birth: string;
  gender: 'Female';
  enrolment_date: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  emotional_issues: string | null;
  psychological_problems: string | null;
  social_issues: string | null;
  notes: string | null;
  parent_name: string;
  parent_email: string;
  active: boolean;
  created_at: string;
}

export interface Incident {
  id: string;
  log_code: string | null;
  campus_id: string;
  student_id: string;
  date: string;
  category: string;
  specific_behaviour: string | null;
  trigger_context: string | null;
  location: string | null;
  severity: number;
  duration_min: number | null;
  intervention_used: string | null;
  outcome: string | null;
  staff_reporting: string | null;
  staff_reporting_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface IlpPlan {
  id: string;
  student_id: string;
  goal_domain: string;
  goal_text: string;
  strategies: string | null;
  target_date: string | null;
  status: 'active' | 'achieved' | 'discontinued';
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export type CommChannel = 'email' | 'whatsapp' | 'phone' | 'in_person' | 'other';

export interface ParentCommunication {
  id: string;
  student_id: string;
  channel: CommChannel;
  date: string;
  subject: string | null;
  summary: string;
  related_incident_id: string | null;
  logged_by: string | null;
  logged_by_name: string | null;
  created_at: string;
}

export const CATEGORY_ORDER = [
  'Emotional Dysregulation',
  'Aggression/Physical',
  'Social/Peer Conflict',
  'Attention/Focus',
  'Withdrawal/Anxiety',
  'Defiance/Non-compliance',
  'Sensory Sensitivity',
  'Prosocial/Positive',
] as const;

export const CAT_VAR: Record<string, string> = Object.fromEntries(
  CATEGORY_ORDER.map((c, i) => [c, `var(--cat-${i + 1})`]),
);
