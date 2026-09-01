// Supabase Edge Function: send-parent-email
//
// Sends a transactional email to a student's parent/guardian when:
//   - a behaviour incident is logged, or
//   - an ILP goal is marked achieved / discontinued
// and logs the email in `parent_communications` so it shows up in the
// student's Parent Communication history automatically.
//
// Deploy:
//   supabase functions deploy send-parent-email
//
// Secrets (set once via `supabase secrets set NAME=value`):
//   RESEND_API_KEY   - API key from resend.com
//   FROM_EMAIL       - sender address on a domain verified in Resend, e.g.
//                       "Molo Mhlaba Behaviour Tracker <notifications@molomhlaba.org>"
//                       (falls back to Resend's sandbox sender if unset — that
//                       sandbox address only delivers to the Resend account owner's
//                       own inbox, so set this for real parent delivery)
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided
// automatically by the Supabase platform — no need to set them.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Molo Mhlaba Behaviour Tracker <onboarding@resend.dev>';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type Body =
  | { kind: 'incident'; incidentId: string }
  | { kind: 'ilp_status'; ilpPlanId: string; status: 'achieved' | 'discontinued' };

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401, origin);

    // Bound to the caller's own JWT — used only to confirm they're a signed-in staff/admin.
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'Not authenticated' }, 401, origin);

    const { data: profile } = await userClient.from('profiles').select('*').eq('id', userData.user.id).single();
    if (!profile || (profile.role !== 'staff' && profile.role !== 'admin')) {
      return json({ error: 'Not authorized' }, 403, origin);
    }

    // Service-role client: the caller has already been confirmed staff/admin above,
    // and the record they're emailing about was itself created under RLS scoping —
    // this function only reads it back to build/send the email, it never mutates.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = (await req.json()) as Body;

    let studentId: string;
    let to: string;
    let subject: string;
    let html: string;
    let summary: string;
    let relatedIncidentId: string | null = null;

    if (body.kind === 'incident') {
      const { data: incident, error } = await admin
        .from('incidents')
        .select('*, students(full_name, parent_name, parent_email)')
        .eq('id', body.incidentId)
        .single();
      if (error || !incident) return json({ error: 'Incident not found' }, 404, origin);
      const student = incident.students as { full_name: string; parent_name: string; parent_email: string };

      studentId = incident.student_id;
      to = student.parent_email;
      relatedIncidentId = incident.id;
      subject = `Behaviour update for ${student.full_name} — ${incident.category}`;
      summary = `Automated email sent to parent about a ${incident.category} incident logged on ${incident.date} (severity ${incident.severity}/5).`;
      html = incidentEmailHtml({
        parentName: student.parent_name,
        studentName: student.full_name,
        category: incident.category,
        date: incident.date,
        severity: incident.severity,
        notes: incident.notes,
        staffName: incident.staff_reporting_name,
      });
    } else {
      const { data: plan, error } = await admin
        .from('ilp_plans')
        .select('*, students(full_name, parent_name, parent_email)')
        .eq('id', body.ilpPlanId)
        .single();
      if (error || !plan) return json({ error: 'ILP goal not found' }, 404, origin);
      const student = plan.students as { full_name: string; parent_name: string; parent_email: string };
      const achieved = body.status === 'achieved';

      studentId = plan.student_id;
      to = student.parent_email;
      subject = `ILP goal ${achieved ? 'achieved' : 'update'} for ${student.full_name}`;
      summary = `Automated email sent to parent: ILP goal "${plan.goal_domain}" marked ${body.status}.`;
      html = ilpEmailHtml({
        parentName: student.parent_name,
        studentName: student.full_name,
        goalDomain: plan.goal_domain,
        goalText: plan.goal_text,
        achieved,
      });
    }

    if (!RESEND_API_KEY) return json({ error: 'Email is not configured (missing RESEND_API_KEY)' }, 500, origin);

    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!sendRes.ok) {
      const errText = await sendRes.text();
      return json({ error: `Email provider error: ${errText}` }, 502, origin);
    }

    await admin.from('parent_communications').insert({
      student_id: studentId,
      channel: 'email',
      date: new Date().toISOString().slice(0, 10),
      subject,
      summary,
      related_incident_id: relatedIncidentId,
      logged_by: userData.user.id,
      logged_by_name: profile.full_name || profile.email,
    });

    return json({ ok: true }, 200, origin);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500, origin);
  }
});

function incidentEmailHtml(p: {
  parentName: string;
  studentName: string;
  category: string;
  date: string;
  severity: number;
  notes: string | null;
  staffName: string | null;
}) {
  return `
    <div style="font-family: -apple-system, Arial, sans-serif; color:#14140f; max-width:520px; margin:0 auto;">
      <h2 style="margin-bottom:4px;">Behaviour update — ${p.studentName}</h2>
      <p>Dear ${p.parentName || 'Parent/Guardian'},</p>
      <p>We're letting you know that a behaviour incident was logged for ${p.studentName} on ${p.date}.</p>
      <table style="width:100%; border-collapse:collapse; margin:12px 0;">
        <tr><td style="padding:4px 0; color:#83817a;">Category</td><td style="padding:4px 0;"><b>${p.category}</b></td></tr>
        <tr><td style="padding:4px 0; color:#83817a;">Severity</td><td style="padding:4px 0;"><b>${p.severity}/5</b></td></tr>
        ${p.notes ? `<tr><td style="padding:4px 0; color:#83817a; vertical-align:top;">Notes</td><td style="padding:4px 0;">${p.notes}</td></tr>` : ''}
        <tr><td style="padding:4px 0; color:#83817a;">Logged by</td><td style="padding:4px 0;">${p.staffName || 'School staff'}</td></tr>
      </table>
      <p>A member of staff will be in touch if follow-up is needed. Please reach out to the school if you have any questions.</p>
      <p>Kind regards,<br/>Molo Mhlaba Schools</p>
    </div>`;
}

function ilpEmailHtml(p: {
  parentName: string;
  studentName: string;
  goalDomain: string;
  goalText: string;
  achieved: boolean;
}) {
  return `
    <div style="font-family: -apple-system, Arial, sans-serif; color:#14140f; max-width:520px; margin:0 auto;">
      <h2 style="margin-bottom:4px;">Individual Learning Plan update — ${p.studentName}</h2>
      <p>Dear ${p.parentName || 'Parent/Guardian'},</p>
      <p>
        ${
          p.achieved
            ? `We're pleased to let you know that ${p.studentName} has <b>achieved</b> an Individual Learning Plan goal.`
            : `We want to let you know that an Individual Learning Plan goal for ${p.studentName} has been discontinued.`
        }
      </p>
      <table style="width:100%; border-collapse:collapse; margin:12px 0;">
        <tr><td style="padding:4px 0; color:#83817a;">Goal domain</td><td style="padding:4px 0;"><b>${p.goalDomain}</b></td></tr>
        <tr><td style="padding:4px 0; color:#83817a; vertical-align:top;">Goal</td><td style="padding:4px 0;">${p.goalText}</td></tr>
      </table>
      <p>${p.achieved ? 'Well done to ' + p.studentName + '! ' : ''}Please reach out to the school if you have any questions.</p>
      <p>Kind regards,<br/>Molo Mhlaba Schools</p>
    </div>`;
}
