import { supabase } from "@/integrations/supabase/client";

/** Always CC'd on assignment and target-change emails. */
export const NOTIFY_CC = ['atishay@eagleinfoservice.com', 'arjav@eagleinfoservice.com', 'pm@eagleinfoservice.com'];

export async function sendAssignmentEmail({
  to,
  subject,
  text,
  cc,
}: {
  to: string;
  subject: string;
  text: string;
  cc?: string[];
}) {
  const body: Record<string, unknown> = { to, subject, text };
  const ccClean = (cc ?? []).filter((e) => e && e.toLowerCase() !== to.toLowerCase());
  if (ccClean.length > 0) body.cc = ccClean;
  const { data, error } = await supabase.functions.invoke("send-mail", { body });
  if (error) throw error;
  return data;
}

const NO_ASSIGNEE_SENTINEL = '00000000-0000-0000-0000-000000000000';
const ROLE_LABEL = { am: 'Account Manager', im: 'Inbox Manager', sdr: 'SDR' } as const;

/**
 * Email each newly assigned team member (AM / IM / SDR) with the standard CC list.
 * One email per assignee, listing all clients they were assigned in this action.
 */
export async function notifyNewAssignments(
  assignments: Array<{ role: keyof typeof ROLE_LABEL; memberId: string | null | undefined; client: { client_name?: string | null; client_code: string; client_id: number; client_company_name?: string | null } }>
) {
  const ids = Array.from(new Set(assignments.map((a) => a.memberId).filter((id): id is string => !!id && id !== NO_ASSIGNEE_SENTINEL)));
  if (ids.length === 0) return;
  const { data: members, error } = await supabase.from('team_members').select('id, full_name, email').in('id', ids);
  if (error) { console.warn('notifyNewAssignments: member lookup failed', error); return; }
  const byId = new Map((members ?? []).map((m) => [m.id, m]));

  const grouped = new Map<string, { member: { full_name: string; email: string }; lines: string[]; first: string }>();
  for (const a of assignments) {
    const m = a.memberId ? byId.get(a.memberId) : undefined;
    if (!m?.email) continue;
    const key = `${m.id}`;
    const line = `- ${a.client.client_name || '-'} (Code: ${a.client.client_code}, ID: ${a.client.client_id}${a.client.client_company_name ? `, Company: ${a.client.client_company_name}` : ''}) — as ${ROLE_LABEL[a.role]}`;
    const g = grouped.get(key) ?? { member: m, lines: [], first: a.client.client_name || a.client.client_code };
    g.lines.push(line);
    grouped.set(key, g);
  }

  const { data: { user } } = await supabase.auth.getUser();
  await Promise.all(
    Array.from(grouped.values()).map((g) =>
      sendAssignmentEmail({
        to: g.member.email,
        cc: NOTIFY_CC,
        subject: g.lines.length === 1 ? `Client assigned: ${g.first}` : `${g.lines.length} clients assigned to you`,
        text: `Hi ${g.member.full_name},\n\nYou have been assigned to the following client${g.lines.length > 1 ? 's' : ''}:\n\n${g.lines.join('\n')}\n\nAssigned by: ${user?.email ?? 'Unknown'}\n\nRegards,\nOperations`,
      }).catch((e) => console.warn('Failed to send assignment email:', e))
    )
  );
}
