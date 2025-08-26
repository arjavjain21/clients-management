import { createClient } from '@supabase/supabase-js';
import type { 
  Client, 
  TeamMember, 
  RelationshipStatus, 
  RelationshipType,
  ClientStagingRow,
  ClientAuditStatus,
  ClientAuditType,
  ClientAuditAssignment,
  ClientAuditPricing,
  ClientFilters,
  ClientUpdateData,
  BulkUpdateData
} from '@/types/database';

// Use the existing Supabase client
export { supabase } from '@/integrations/supabase/client';
export type { Database } from '@/integrations/supabase/types';

// Helper functions for working with the database
export const clientsApi = {
  // Get clients with optional filtering and pagination
  async getClients(
    filters: ClientFilters = {}, 
    page = 0, 
    pageSize = 50,
    sortBy = 'client_name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ) {
    const { supabase } = await import('@/integrations/supabase/client');
    
    let query = supabase
      .from('clients')
      .select(`
        *
      `);

    // Apply filters
    if (filters.search) {
      query = query.or(`client_name.ilike.%${filters.search}%, client_email.ilike.%${filters.search}%, client_code.ilike.%${filters.search}%`);
    }
    
    if (filters.relationship_status) {
      query = query.eq('relationship_status', filters.relationship_status);
    }
    
    if (filters.relationship_type) {
      query = query.eq('relationship_type', filters.relationship_type);
    }

    if (filters.closelix) {
      query = query.eq('closelix', filters.closelix === 'true');
    }

    if (filters.weekend_sending_mode) {
      query = query.eq('weekend_sending_mode', filters.weekend_sending_mode);
    }
    
    if (filters.assigned_account_manager_id) {
      if (filters.assigned_account_manager_id === 'unassigned') {
        query = query.is('assigned_account_manager_id', null);
      } else {
        query = query.eq('assigned_account_manager_id', filters.assigned_account_manager_id);
      }
    }
    
    if (filters.assigned_inbox_manager_id) {
      if (filters.assigned_inbox_manager_id === 'unassigned') {
        query = query.is('assigned_inbox_manager_id', null);
      } else {
        query = query.eq('assigned_inbox_manager_id', filters.assigned_inbox_manager_id);
      }
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    return query;
  },

  // Get a single client with full details
  async getClient(client_code: string, client_id: number) {
    const { supabase } = await import('@/integrations/supabase/client');
    
    return supabase
      .from('clients')
      .select(`
        *
      `)
      .eq('client_code', client_code)
      .eq('client_id', client_id)
      .single();
  },

  // Update a client
  async updateClient(client_code: string, client_id: number, updates: ClientUpdateData) {
    const { supabase } = await import('@/integrations/supabase/client');
    
    return supabase
      .from('clients')
      .update(updates)
      .eq('client_code', client_code)
      .eq('client_id', client_id)
      .select()
      .single();
  },

  // Bulk update clients
  async bulkUpdateClients(bulkData: BulkUpdateData) {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const results = await Promise.all(
      bulkData.client_codes.map(({ client_code, client_id }) =>
        supabase
          .from('clients')
          .update(bulkData.updates)
          .eq('client_code', client_code)
          .eq('client_id', client_id)
      )
    );
    
    return results;
  }
};

export const lookupsApi = {
  // Get team members by role
  async getTeamMembers(role?: 'account_manager' | 'inbox_manager') {
    const { supabase } = await import('@/integrations/supabase/client');
    
    let query = supabase
      .from('team_members')
      .select('*')
      .eq('active', true)
      .order('full_name');
    
    if (role) {
      query = query.eq('role', role);
    }
    
    return query;
  },

  // Get relationship statuses
  async getRelationshipStatuses() {
    const { supabase } = await import('@/integrations/supabase/client');
    
    return supabase
      .from('relationship_statuses')
      .select('*')
      .order('name');
  },

  // Get relationship types
  async getRelationshipTypes() {
    const { supabase } = await import('@/integrations/supabase/client');
    
    return supabase
      .from('relationship_types')
      .select('*')
      .order('name');
  }
};

export const auditApi = {
  // Get status audit records for a client
  async getStatusAudit(client_code: string, client_id: number, page = 0, pageSize = 20) {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    return supabase
      .from('clients_audit_status')
      .select('*')
      .eq('client_code', client_code)
      .eq('client_id', client_id)
      .order('changed_at', { ascending: false })
      .range(from, to);
  },

  // Get type audit records for a client
  async getTypeAudit(client_code: string, client_id: number, page = 0, pageSize = 20) {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    return supabase
      .from('clients_audit_type')
      .select('*')
      .eq('client_code', client_code)
      .eq('client_id', client_id)
      .order('changed_at', { ascending: false })
      .range(from, to);
  },

  // Get assignment audit records for a client
  async getAssignmentAudit(client_code: string, client_id: number, page = 0, pageSize = 20) {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    return supabase
      .from('clients_audit_assignment')
      .select('*')
      .eq('client_code', client_code)
      .eq('client_id', client_id)
      .order('changed_at', { ascending: false })
      .range(from, to);
  },

  // Get pricing audit records for a client
  async getPricingAudit(client_code: string, client_id: number, page = 0, pageSize = 20) {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    return supabase
      .from('clients_audit_pricing')
      .select('*')
      .eq('client_code', client_code)
      .eq('client_id', client_id)
      .order('changed_at', { ascending: false })
      .range(from, to);
  }
};

export const stagingApi = {
  // Get staging data with pagination
  async getStagingData(page = 0, pageSize = 50) {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    return supabase
      .from('clients_staging')
      .select('*')
      .range(from, to);
  }
};