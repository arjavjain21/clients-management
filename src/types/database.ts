export interface Client {
  client_code: string;
  client_id: number;
  client_name?: string;
  client_email?: string;
  correspondence_emails?: string[] | null;
  correspondence_categories?: string[] | null;
  client_company_name?: string;
  client_website?: string;
  relationship_status?: string;
  relationship_type?: string;
  onboarding_activated?: boolean;
  onboarding_date?: string;
  recurring_cost_usd?: number;
  weekend_sending_mode?: 'true' | 'false' | 'inherit';
  booking_link?: string;
  phone_number?: string;
  avg_dollar_gen_pm?: number;
  exit_date?: string;
  bonus_pool_monthly?: number | null;
  assigned_account_manager_id?: string;
  assigned_inbox_manager_id?: string;
  assigned_sdr_id?: string;
  assigned_sdr_name?: string;
  assigned_sdr_email?: string;
  weekly_target?: string | null;
  weekly_target_launch_date?: string | null;
  created_at: string;
  updated_at: string;
  website_canonical?: string;
  weekend_sending_effective?: boolean;
  closelix?: boolean;
  monthly_booking_goal?: number | null;
  notes?: string | null;
}

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: 'account_manager' | 'inbox_manager' | 'sdr' | 'other';
  active: boolean;
  round_robin_group?: string;
  capacity_clients?: number;
  weight: number;
  timezone?: string;
  external?: any;
  created_at: string;
}

export interface RelationshipStatus {
  name: string;
}

export interface RelationshipType {
  name: string;
}

export interface ClientStagingRow {
  client_code?: string;
  client_id?: number;
  client_name?: string;
  client_email?: string;
  client_company_name?: string;
  client_website?: string;
  relationship_status?: string;
  relationship_type?: string;
  onboarding_activated?: string;
  onboarding_date?: string;
  recurring_cost_usd?: string;
  weekend_sending?: string;
  booking_link?: string;
  phone_number?: string;
  avg_dollar_gen_pm?: string;
  exit_date?: string;
  assigned_account_manager?: string;
  assigned_inbox_manager?: string;
}

export interface AuditRecord {
  audit_id: number;
  client_code: string;
  client_id: number;
  changed_at: string;
  changed_by?: string;
}

export interface ClientAuditStatus extends AuditRecord {
  old_status?: string;
  new_status: string;
}

export interface ClientAuditType extends AuditRecord {
  old_type?: string;
  new_type?: string;
}

export interface ClientAuditAssignment extends AuditRecord {
  old_account_manager_id?: string;
  new_account_manager_id?: string;
  old_inbox_manager_id?: string;
  new_inbox_manager_id?: string;
}

export interface ClientAuditPricing extends AuditRecord {
  old_recurring_cost_usd?: number;
  new_recurring_cost_usd?: number;
  old_avg_dollar_gen_pm?: number;
  new_avg_dollar_gen_pm?: number;
}

export interface ClientFilters {
  search?: string;
  relationship_status?: string;
  relationship_type?: string;
  weekend_sending_mode?: string;
  assigned_account_manager_id?: string;
  assigned_inbox_manager_id?: string;
  assigned_sdr_id?: string;
  weekly_target_type?: 'numeric' | 'launch' | 'none';
  has_correspondence_emails?: boolean;
  correspondence_category?: 'feedback' | 'positives';
}

export interface ClientUpdateData {
  relationship_status?: string;
  relationship_type?: string;
  weekend_sending_mode?: 'true' | 'false' | 'inherit';
  avg_dollar_gen_pm?: number;
  assigned_account_manager_id?: string | null;
  assigned_inbox_manager_id?: string | null;
  assigned_sdr_id?: string | null;
  weekly_target?: string | null;
  weekly_target_launch_date?: string | null;
  correspondence_emails?: string[] | null;
  correspondence_categories?: string[] | null;
  bonus_pool_monthly?: number | null;
  monthly_booking_goal?: number | null;
  closelix?: boolean | null;
  notes?: string | null;
}

export interface BulkUpdateData {
  client_codes: Array<{ client_code: string; client_id: number }>;
  updates: Partial<ClientUpdateData>;
}