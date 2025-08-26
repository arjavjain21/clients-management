import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { listTeamMembers } from '@/lib/teamMembersData';
import { sendAssignmentEmail } from '@/lib/email';
import type { Client } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { RoundRobinAssignButton } from './RoundRobinAssignButton';

interface ClientEditDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientEditDialog({
  client,
  open,
  onOpenChange,
}: ClientEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const initial = useMemo(() => client, [client]);

  // Load team members and lookups with role filtering
  const { data: accountManagers = [] } = useQuery({
    queryKey: ['team-members', { role: 'account_manager' }],
    queryFn: () => listTeamMembers({ role: 'account_manager' }),
    enabled: open,
  });

  const { data: inboxManagers = [] } = useQuery({
    queryKey: ['team-members', { role: 'inbox_manager' }],
    queryFn: () => listTeamMembers({ role: 'inbox_manager' }),
    enabled: open,
  });

  const { data: relationshipStatuses = [] } = useQuery({
    queryKey: ['relationship-statuses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('relationship_statuses').select('*').order('name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const { data: relationshipTypes = [] } = useQuery({
    queryKey: ['relationship-types'],
    queryFn: async () => {
      const { data, error } = await supabase.from('relationship_types').select('*').order('name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  useEffect(() => {
    if (client) {
      setFormData({
        client_company_name: client.client_company_name || '',
        client_email: client.client_email || '',
        client_website: client.client_website || '',
        relationship_status: client.relationship_status || '',
        relationship_type: client.relationship_type || '',
        closelix: client.closelix === true ? 'true' : client.closelix === false ? 'false' : '',
        weekend_sending_mode: client.weekend_sending_mode || 'inherit',
        assigned_account_manager_id: client.assigned_account_manager_id || '',
        assigned_inbox_manager_id: client.assigned_inbox_manager_id || '',
        phone_number: client.phone_number || '',
        booking_link: client.booking_link || '',
        recurring_cost_usd: client.recurring_cost_usd ?? '',
      });
    }
  }, [client]);

  const handleSave = async () => {
    if (!client) return;
    setSaving(true);
    try {
      // Normalize values: empty strings -> null, numbers -> number, booleans -> boolean, UUID empties -> null
      const numericFields = new Set(['recurring_cost_usd']);
      const booleanFields = new Set(['onboarding_activated', 'closelix']);
      const uuidFields = new Set(['assigned_account_manager_id', 'assigned_inbox_manager_id']);

      const normalizeValue = (key: string, value: any) => {
        if (value === '') return null;
        if (uuidFields.has(key)) return value || null;
        if (numericFields.has(key)) {
          const num = typeof value === 'number' ? value : parseFloat(value);
          return Number.isFinite(num) ? num : null;
        }
        if (booleanFields.has(key)) {
          if (typeof value === 'boolean') return value;
          if (value === 'true') return true;
          if (value === 'false') return false;
          return null;
        }
        return value;
      };

      // Build normalized current and initial, then compute minimal patch
      const keys = Object.keys(formData);
      const normalizedCurrent: Record<string, any> = {};
      const normalizedInitial: Record<string, any> = {};
      for (const key of keys) {
        if (["client_code","client_id","client_name","created_at","updated_at"].includes(key)) continue;
        normalizedCurrent[key] = normalizeValue(key, (formData as any)[key]);
        normalizedInitial[key] = normalizeValue(key, (initial as any)?.[key]);
      }

      const patch: Record<string, any> = {};
      for (const key of Object.keys(normalizedCurrent)) {
        if (normalizedCurrent[key] !== normalizedInitial[key]) {
          patch[key] = normalizedCurrent[key];
        }
      }
      
      if (Object.keys(patch).length === 0) {
        toast({ title: "No changes", description: "Nothing to update." });
        setSaving(false);
        return;
      }
      
      // Update via Supabase client directly
      const { error } = await supabase
        .from("clients")
        .update(patch)
        .eq("client_code", client.client_code)
        .eq("client_id", client.client_id)
        .select()
        .single();
      
      if (error) throw error;

      // Send assignment emails if managers changed
      const toNotify: Array<{email: string; full_name: string}> = [];
      
      if (
        patch.assigned_account_manager_id &&
        patch.assigned_account_manager_id !== initial?.assigned_account_manager_id
      ) {
        const am = accountManagers.find(m => m.id === patch.assigned_account_manager_id);
        if (am) toNotify.push({ email: am.email, full_name: am.full_name });
      }
      
      if (
        patch.assigned_inbox_manager_id &&
        patch.assigned_inbox_manager_id !== initial?.assigned_inbox_manager_id
      ) {
        const im = inboxManagers.find(m => m.id === patch.assigned_inbox_manager_id);
        if (im) toNotify.push({ email: im.email, full_name: im.full_name });
      }
      
      // Send notification emails
      for (const tm of toNotify) {
        try {
          await sendAssignmentEmail({
            to: tm.email,
            subject: `Client assigned: ${client.client_name ?? client.client_code}`,
            text: `Hi ${tm.full_name},

You have been assigned to a client.

Client Name: ${client.client_name ?? "-"}
Client Code: ${client.client_code}
Client ID: ${client.client_id}
Company: ${formData.client_company_name ?? "-"}
Relationship: ${formData.relationship_status ?? "-"} (${formData.relationship_type ?? "-"})
Weekend Sending: ${formData.weekend_sending_mode ?? "-"}

Regards,
Operations`
          });
        } catch (emailError) {
          console.warn('Failed to send assignment email:', emailError);
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['metrics','global'] });
      queryClient.invalidateQueries({ queryKey: ['metrics','filtered'] });

      toast({
        title: "Client updated",
        description: `${client.client_name || client.client_code} has been updated successfully.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Update failed",
        description: error.message ?? "There was an error updating the client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update client information and settings. Read-only fields are marked with badges.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Read-only fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client Code <Badge variant="secondary" className="ml-2">Read-only</Badge></Label>
              <Input value={`${client.client_code}-${client.client_id}`} disabled />
            </div>
            <div>
              <Label>Client Name <Badge variant="secondary" className="ml-2">Read-only</Badge></Label>
              <Input value={client.client_name || 'No name'} disabled />
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client_email">Email</Label>
              <Input
                id="client_email"
                type="email"
                value={formData.client_email}
                onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                placeholder="client@company.com"
              />
            </div>
            <div>
              <Label htmlFor="client_company_name">Company Name</Label>
              <Input
                id="client_company_name"
                value={formData.client_company_name}
                onChange={(e) => setFormData({ ...formData, client_company_name: e.target.value })}
                placeholder="Company Inc."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client_website">Website</Label>
              <Input
                id="client_website"
                type="url"
                value={formData.client_website}
                onChange={(e) => setFormData({ ...formData, client_website: e.target.value })}
                placeholder="https://company.com"
              />
            </div>
            <div>
              <Label htmlFor="phone_number">Phone</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+1 555 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="relationship_status">Relationship Status</Label>
              <Select
                value={formData.relationship_status}
                onValueChange={(value) => setFormData({ ...formData, relationship_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipStatuses.map((status) => (
                    <SelectItem key={status.name} value={status.name}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="relationship_type">Relationship Type</Label>
              <Select
                value={formData.relationship_type}
                onValueChange={(value) => setFormData({ ...formData, relationship_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipTypes.map((type) => (
                    <SelectItem key={type.name} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="closelix">Closelix</Label>
            <Select
              value={formData.closelix}
              onValueChange={(value) => setFormData({ ...formData, closelix: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weekend_sending_mode">Weekend Sending</Label>
            <Select
              value={formData.weekend_sending_mode}
                onValueChange={(value) => setFormData({ ...formData, weekend_sending_mode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Inherit</SelectItem>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="booking_link">Booking Link</Label>
              <Input
                id="booking_link"
                type="url"
                value={formData.booking_link}
                onChange={(e) => setFormData({ ...formData, booking_link: e.target.value })}
                placeholder="https://calendly.com/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assigned_account_manager_id">Account Manager</Label>
              <Select
                value={formData.assigned_account_manager_id}
                onValueChange={(value) => setFormData({ ...formData, assigned_account_manager_id: value === 'unassigned' ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {accountManagers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assigned_inbox_manager_id">Inbox Manager</Label>
              <Select
                value={formData.assigned_inbox_manager_id}
                onValueChange={(value) => setFormData({ ...formData, assigned_inbox_manager_id: value === 'unassigned' ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select inbox manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {inboxManagers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="recurring_cost_usd">Recurring Cost (USD)</Label>
            <Input
              id="recurring_cost_usd"
              type="number"
              value={formData.recurring_cost_usd}
              onChange={(e) => setFormData({ ...formData, recurring_cost_usd: parseFloat(e.target.value) || 0 })}
              placeholder="2500"
            />
          </div>
        </div>
        </div>

        <DialogFooter className="flex justify-between">
          <RoundRobinAssignButton 
            client={client} 
            onAssignmentComplete={() => {
              // Refresh the clients queries to get updated data
              queryClient.invalidateQueries({ queryKey: ['clients'] });
              queryClient.invalidateQueries({ queryKey: ['metrics'] });
              
              // Update form data with latest client info after assignment
              // Note: The queries will refresh the parent component and close/reopen this dialog with fresh data
              onOpenChange(false);
            }}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}