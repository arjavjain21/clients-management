import { supabase } from '@/integrations/supabase/client';
import { sendAssignmentEmail } from '@/lib/email';

export interface RoundRobinAssignment {
  account_manager_id?: string;
  inbox_manager_id?: string;
  account_manager?: { id: string; full_name: string; email: string };
  inbox_manager?: { id: string; full_name: string; email: string };
}

export async function getNextAvailableTeamMember(role: 'account_manager' | 'inbox_manager'): Promise<{ id: string; full_name: string; email: string } | null> {
  // Get team members with their current load, sorted by load (ascending) then by name
  const { data: members, error } = await supabase
    .from('team_member_load')
    .select('*')
    .eq('role', role)
    .eq('active', true)
    .order(role === 'account_manager' ? 'active_clients_am' : 'active_clients_im', { ascending: true })
    .order('full_name', { ascending: true });

  if (error) throw error;
  if (!members || members.length === 0) return null;

  // Return the member with the least load
  const nextMember = members[0];
  return {
    id: nextMember.member_id,
    full_name: nextMember.full_name,
    email: nextMember.email
  };
}

export async function assignTeamMembersRoundRobin(client: any): Promise<RoundRobinAssignment> {
  const assignments: RoundRobinAssignment = {};

  try {
    // Get next available account manager
    const nextAM = await getNextAvailableTeamMember('account_manager');
    if (nextAM) {
      assignments.account_manager_id = nextAM.id;
      assignments.account_manager = nextAM;
    }

    // Get next available inbox manager
    const nextIM = await getNextAvailableTeamMember('inbox_manager');
    if (nextIM) {
      assignments.inbox_manager_id = nextIM.id;
      assignments.inbox_manager = nextIM;
    }

    // Send assignment emails
    const emailPromises = [];
    
    if (nextAM) {
      emailPromises.push(sendAssignmentEmail({
        to: nextAM.email,
        subject: `New client assigned: ${client.client_name || client.client_code}`,
        text: `Hi ${nextAM.full_name},

You have been assigned as Account Manager to a new client.

Client Name: ${client.client_name || '—'}
Client Code: ${client.client_code}
Client ID: ${client.client_id}
Company: ${client.client_company_name || '—'}
Relationship: ${client.relationship_status || '—'} (${client.relationship_type || '—'})
Target (avg_dollar_gen_pm): ${client.avg_dollar_gen_pm || '—'}
Weekend Sending: ${client.weekend_sending_mode || '—'}

Regards,
Operations Team`
      }));
    }

    if (nextIM) {
      emailPromises.push(sendAssignmentEmail({
        to: nextIM.email,
        subject: `New client assigned: ${client.client_name || client.client_code}`,
        text: `Hi ${nextIM.full_name},

You have been assigned as Inbox Manager to a new client.

Client Name: ${client.client_name || '—'}
Client Code: ${client.client_code}
Client ID: ${client.client_id}
Company: ${client.client_company_name || '—'}
Relationship: ${client.relationship_status || '—'} (${client.relationship_type || '—'})
Target (avg_dollar_gen_pm): ${client.avg_dollar_gen_pm || '—'}
Weekend Sending: ${client.weekend_sending_mode || '—'}

Regards,
Operations Team`
      }));
    }

    // Send emails in parallel (don't wait for them to complete)
    Promise.all(emailPromises).catch(error => {
      console.error('Error sending assignment emails:', error);
    });

  } catch (error) {
    console.error('Error in round-robin assignment:', error);
  }

  return assignments;
}