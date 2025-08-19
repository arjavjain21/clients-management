import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { clientsApi, lookupsApi } from '@/lib/supabase-client';
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

  const initial = React.useMemo(() => client, [client]);

  // Load team members and lookups
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => lookupsApi.getTeamMembers().then(res => res.data || []),
    enabled: open,
  });

  const { data: relationshipStatuses = [] } = useQuery({
    queryKey: ['relationship-statuses'],
    queryFn: () => lookupsApi.getRelationshipStatuses().then(res => res.data || []),
    enabled: open,
  });

  const { data: relationshipTypes = [] } = useQuery({
    queryKey: ['relationship-types'],
    queryFn: () => lookupsApi.getRelationshipTypes().then(res => res.data || []),
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
        weekend_sending_mode: client.weekend_sending_mode || 'inherit',
        assigned_account_manager_id: client.assigned_account_manager_id || '',
        assigned_inbox_manager_id: client.assigned_inbox_manager_id || '',
        avg_dollar_gen_pm: client.avg_dollar_gen_pm || 0,
        phone_number: client.phone_number || '',
        booking_link: client.booking_link || '',
        recurring_cost_usd: client.recurring_cost_usd || 0,
      });
    }
  }, [client]);

  const handleSave = async () => {
    if (!client) return;
    setSaving(true);
    try {
      // Minimal patch: only changed keys
      const patch: Record<string, any> = {};
      Object.entries(formData).forEach(([k, v]) => {
        if (k === 'client_code' || k === 'client_id' || k === 'client_name') return;
        if ((initial as any)?.[k] !== v) patch[k] = v;
      });
      
      if (Object.keys(patch).length === 0) {
        toast({ title: "No changes", description: "Nothing to update." });
        setSaving(false);
        return;
      }
      
      await clientsApi.updateClient(client.client_code, client.client_id, patch);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });

      toast({
        title: "Client updated",
        description: `${client.client_name || client.client_code} has been updated successfully.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating the client. Please try again.",
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
                  {teamMembers.map((member) => (
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
                  {teamMembers.map((member) => (
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
              <Label htmlFor="avg_dollar_gen_pm">Average $/Month Target</Label>
              <Input
                id="avg_dollar_gen_pm"
                type="number"
                value={formData.avg_dollar_gen_pm}
                onChange={(e) => setFormData({ ...formData, avg_dollar_gen_pm: parseFloat(e.target.value) || 0 })}
                placeholder="5000"
              />
            </div>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}