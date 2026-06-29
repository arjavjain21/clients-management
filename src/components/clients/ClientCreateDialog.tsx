import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { listTeamMembers } from '@/lib/teamMembersData';
import { createClient, type CreateClientInput } from '@/lib/clientsData';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface ClientCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const empty: CreateClientInput = {
  client_code: '',
  client_id: null,
  client_name: '',
  client_email: '',
  client_company_name: '',
  client_website: '',
  phone_number: '',
  booking_link: '',
  relationship_status: 'ACTIVE',
  relationship_type: '',
  weekend_sending_mode: 'inherit',
  onboarding_activated: false,
  onboarding_date: null,
  recurring_cost_usd: null,
  weekly_target: '',
  weekly_target_launch_date: null,
  monthly_booking_goal: null,
  bonus_pool_monthly: null,
  closelix: false,
  assigned_account_manager_id: null,
  assigned_inbox_manager_id: null,
  assigned_sdr_id: null,
  notes: '',
};

const NONE = '__none__';

export function ClientCreateDialog({ open, onOpenChange }: ClientCreateDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateClientInput>(empty);

  const setField = (k: keyof CreateClientInput, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

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
  const { data: sdrs = [] } = useQuery({
    queryKey: ['team-members', { role: 'sdr' }],
    queryFn: () => listTeamMembers({ role: 'sdr' }),
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

  const handleClose = (next: boolean) => {
    if (!next) setForm(empty);
    onOpenChange(next);
  };

  const handleSave = async () => {
    if (!form.client_code?.trim()) {
      toast({ title: 'Client code is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const created = await createClient(form);
      toast({
        title: 'Client created',
        description: `${created.client_name || created.client_code} added successfully.`,
      });
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['metrics'] });
      handleClose(false);
    } catch (e: any) {
      toast({
        title: 'Failed to create client',
        description: e?.message ?? 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Client</DialogTitle>
          <DialogDescription>
            Add a new client. Only the client code is required — other fields can be filled later.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* GENERAL */}
          <TabsContent value="general" className="space-y-6 pt-4">
            <div>
              <h4 className="text-sm font-semibold mb-3">Identification</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    Client Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.client_code ?? ''}
                    onChange={(e) => setField('client_code', e.target.value.toUpperCase())}
                    placeholder="e.g. ACME"
                  />
                </div>
                <div>
                  <Label>Client ID (optional)</Label>
                  <Input
                    type="number"
                    value={form.client_id ?? ''}
                    onChange={(e) =>
                      setField('client_id', e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder="Auto-generated if blank"
                  />
                </div>
                <div>
                  <Label>Client Name</Label>
                  <Input
                    value={form.client_name ?? ''}
                    onChange={(e) => setField('client_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={form.client_company_name ?? ''}
                    onChange={(e) => setField('client_company_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Primary Email</Label>
                  <Input
                    type="email"
                    value={form.client_email ?? ''}
                    onChange={(e) => setField('client_email', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={form.phone_number ?? ''}
                    onChange={(e) => setField('phone_number', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={form.client_website ?? ''}
                    onChange={(e) => setField('client_website', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Booking Link</Label>
                  <Input
                    value={form.booking_link ?? ''}
                    onChange={(e) => setField('booking_link', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Relationship</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={form.relationship_status ?? NONE}
                    onValueChange={(v) => setField('relationship_status', v === NONE ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— None —</SelectItem>
                      {relationshipStatuses.map((s: any) => (
                        <SelectItem key={s.name} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={form.relationship_type ?? NONE}
                    onValueChange={(v) => setField('relationship_type', v === NONE ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— None —</SelectItem>
                      {relationshipTypes.map((t: any) => (
                        <SelectItem key={t.name} value={t.name}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Weekend Sending</Label>
                  <Select
                    value={form.weekend_sending_mode ?? 'inherit'}
                    onValueChange={(v) => setField('weekend_sending_mode', v as any)}
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
                  <Label>Onboarding Date</Label>
                  <Input
                    type="date"
                    value={form.onboarding_date ?? ''}
                    onChange={(e) => setField('onboarding_date', e.target.value || null)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label className="m-0">Onboarding Activated</Label>
                  <Switch
                    checked={!!form.onboarding_activated}
                    onCheckedChange={(v) => setField('onboarding_activated', v)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label className="m-0">Closelix</Label>
                  <Switch
                    checked={!!form.closelix}
                    onCheckedChange={(v) => setField('closelix', v)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ASSIGNMENTS */}
          <TabsContent value="assignments" className="space-y-4 pt-4">
            <div>
              <Label>Account Manager</Label>
              <Select
                value={form.assigned_account_manager_id ?? NONE}
                onValueChange={(v) =>
                  setField('assigned_account_manager_id', v === NONE ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— Unassigned —</SelectItem>
                  {accountManagers.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Inbox Manager</Label>
              <Select
                value={form.assigned_inbox_manager_id ?? NONE}
                onValueChange={(v) =>
                  setField('assigned_inbox_manager_id', v === NONE ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— Unassigned —</SelectItem>
                  {inboxManagers.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>SDR</Label>
              <Select
                value={form.assigned_sdr_id ?? NONE}
                onValueChange={(v) => setField('assigned_sdr_id', v === NONE ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— Unassigned —</SelectItem>
                  {sdrs.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* TARGETS */}
          <TabsContent value="targets" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Weekly Target</Label>
                <Input
                  value={form.weekly_target ?? ''}
                  onChange={(e) => setField('weekly_target', e.target.value)}
                />
              </div>
              <div>
                <Label>Weekly Target Launch Date</Label>
                <Input
                  type="date"
                  value={form.weekly_target_launch_date ?? ''}
                  onChange={(e) =>
                    setField('weekly_target_launch_date', e.target.value || null)
                  }
                />
              </div>
              <div>
                <Label>Monthly Booking Goal</Label>
                <Input
                  type="number"
                  value={form.monthly_booking_goal ?? ''}
                  onChange={(e) =>
                    setField(
                      'monthly_booking_goal',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                />
              </div>
              <div>
                <Label>Bonus Pool (Monthly)</Label>
                <Input
                  type="number"
                  value={form.bonus_pool_monthly ?? ''}
                  onChange={(e) =>
                    setField('bonus_pool_monthly', e.target.value ? Number(e.target.value) : null)
                  }
                />
              </div>
              <div>
                <Label>Recurring Cost (USD)</Label>
                <Input
                  type="number"
                  value={form.recurring_cost_usd ?? ''}
                  onChange={(e) =>
                    setField('recurring_cost_usd', e.target.value ? Number(e.target.value) : null)
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* NOTES */}
          <TabsContent value="notes" className="pt-4">
            <Label>Notes</Label>
            <Textarea
              rows={10}
              maxLength={5000}
              value={form.notes ?? ''}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Add any context, background, or special instructions for this client..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(form.notes ?? '').length}/5000
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
