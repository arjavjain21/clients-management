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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CalendarIcon } from 'lucide-react';
import { RoundRobinAssignButton } from './RoundRobinAssignButton';
import { CorrespondenceEmailsInput } from './CorrespondenceEmailsInput';
import { CorrespondenceCategoriesInput } from './CorrespondenceCategoriesInput';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

  const [weeklyTargetMode, setWeeklyTargetMode] = useState<'target' | 'launch'>('target');
  const [monthlyGoalMode, setMonthlyGoalMode] = useState<'numeric' | 'closelix'>('numeric');

  useEffect(() => {
    if (client) {
      const hasLaunchDate = !!(client as any).weekly_target_launch_date;
      setWeeklyTargetMode(hasLaunchDate ? 'launch' : 'target');
      setMonthlyGoalMode((client as any).closelix ? 'closelix' : 'numeric');
      
      setFormData({
        client_company_name: client.client_company_name || '',
        client_email: client.client_email || '',
        correspondence_emails: (client as any).correspondence_emails || [],
        correspondence_categories: (client as any).correspondence_categories || [],
        client_website: client.client_website || '',
        relationship_status: client.relationship_status || '',
        relationship_type: client.relationship_type || '',
        weekend_sending_mode: client.weekend_sending_mode || 'inherit',
        assigned_account_manager_id: client.assigned_account_manager_id || '',
        assigned_inbox_manager_id: client.assigned_inbox_manager_id || '',
        assigned_sdr_id: (client as any).assigned_sdr_id || '',
        phone_number: client.phone_number || '',
        booking_link: client.booking_link || '',
        weekly_target: (client as any).weekly_target ?? '',
        weekly_target_launch_date: (client as any).weekly_target_launch_date || null,
        bonus_pool_monthly: (client as any).bonus_pool_monthly ?? null,
        monthly_booking_goal: (client as any).monthly_booking_goal ?? null,
        closelix: (client as any).closelix ?? false,
        notes: (client as any).notes ?? '',
      });
    }
  }, [client]);

  const handleSave = async () => {
    if (!client) return;
    setSaving(true);
    try {
      const textFields = new Set<string>(['weekly_target', 'notes']);
      const dateFields = new Set<string>(['weekly_target_launch_date']);
      const arrayFields = new Set<string>(['correspondence_emails', 'correspondence_categories']);
      const booleanFields = new Set(['onboarding_activated']);
      const uuidFields = new Set(['assigned_account_manager_id', 'assigned_inbox_manager_id', 'assigned_sdr_id']);
      const numericFields = new Set(['bonus_pool_monthly', 'monthly_booking_goal']);
      const boolFields2 = new Set(['closelix']);

      const normalizeValue = (key: string, value: any) => {
        if (arrayFields.has(key)) {
          if (!value || (Array.isArray(value) && value.length === 0)) return [];
          return value;
        }
        if (value === '') return null;
        if (uuidFields.has(key)) return value || null;
        if (textFields.has(key)) {
          return value ? String(value) : null;
        }
        if (dateFields.has(key)) {
          return value || null;
        }
        if (booleanFields.has(key)) {
          if (typeof value === 'boolean') return value;
          if (value === 'true') return true;
          if (value === 'false') return false;
          return null;
        }
        if (numericFields.has(key)) {
          if (value === '' || value === null || value === undefined) return null;
          const num = parseFloat(value);
          return isNaN(num) ? null : num;
        }
        if (boolFields2.has(key)) {
          return !!value;
        }
        return value;
      };

      let weeklyTargetValue = formData.weekly_target;
      let weeklyTargetLaunchDate = formData.weekly_target_launch_date;
      
      if (weeklyTargetMode === 'target') {
        weeklyTargetLaunchDate = null;
      } else {
        if (weeklyTargetLaunchDate) {
          const launchDate = new Date(weeklyTargetLaunchDate);
          weeklyTargetValue = `Launch ${format(launchDate, 'do MMM')}`;
        } else {
          weeklyTargetValue = null;
        }
      }
      
      let monthlyGoalValue = formData.monthly_booking_goal;
      let closelixValue = formData.closelix;
      if (monthlyGoalMode === 'closelix') {
        monthlyGoalValue = null;
        closelixValue = true;
      } else {
        closelixValue = false;
      }

      const patchFormData = {
        ...formData,
        weekly_target: weeklyTargetValue,
        weekly_target_launch_date: weeklyTargetLaunchDate,
        monthly_booking_goal: monthlyGoalValue,
        closelix: closelixValue,
      };

      const keys = Object.keys(patchFormData);
      const normalizedCurrent: Record<string, any> = {};
      const normalizedInitial: Record<string, any> = {};
      for (const key of keys) {
        if (["client_code","client_id","client_name","created_at","updated_at"].includes(key)) continue;
        normalizedCurrent[key] = normalizeValue(key, (patchFormData as any)[key]);
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

      const NO_SDR_SENTINEL = '00000000-0000-0000-0000-000000000000';
      if (
        patch.assigned_sdr_id &&
        patch.assigned_sdr_id !== (initial as any)?.assigned_sdr_id &&
        patch.assigned_sdr_id !== NO_SDR_SENTINEL
      ) {
        const sdr = sdrs.find(m => m.id === patch.assigned_sdr_id);
        if (sdr) toNotify.push({ email: sdr.email, full_name: sdr.full_name });
      }
      
      for (const tm of toNotify) {
        try {
          await sendAssignmentEmail({
            to: tm.email,
            subject: `Client assigned: ${client.client_name ?? client.client_code}`,
            text: `Hi ${tm.full_name},\n\nYou have been assigned to a client.\n\nClient Name: ${client.client_name ?? "-"}\nClient Code: ${client.client_code}\nClient ID: ${client.client_id}\nCompany: ${formData.client_company_name ?? "-"}\nRelationship: ${formData.relationship_status ?? "-"} (${formData.relationship_type ?? "-"})\nWeekend Sending: ${formData.weekend_sending_mode ?? "-"}\n\nRegards,\nOperations`
          });
        } catch (emailError) {
          console.warn('Failed to send assignment email:', emailError);
        }
      }

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

  const NOTES_SOFT_LIMIT = 5000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Client — {client.client_code}-{client.client_id}
          </DialogTitle>
          <DialogDescription>
            {client.client_name || 'Unnamed client'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="comms">Comms</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 pt-4">
            <h3 className="text-sm font-semibold text-foreground">General</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client Code <Badge variant="secondary" className="ml-1 text-xs">Read-only</Badge></Label>
                <Input value={`${client.client_code}-${client.client_id}`} disabled />
              </div>
              <div>
                <Label>Client Name <Badge variant="secondary" className="ml-1 text-xs">Read-only</Badge></Label>
                <Input value={client.client_name || 'No name'} disabled />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_email">Primary Email</Label>
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

            {/* Relationship Section */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-foreground mb-3">Relationship</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="relationship_status">Status</Label>
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
                  <Label htmlFor="relationship_type">Type</Label>
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
              </div>
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4 pt-4">
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
            <div className="max-w-xs">
              <Label htmlFor="assigned_sdr_id">SDR</Label>
              <Select
                value={formData.assigned_sdr_id || 'unassigned'}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  assigned_sdr_id: value === 'unassigned' ? null : value 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select SDR" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value="00000000-0000-0000-0000-000000000000">No SDR</SelectItem>
                  {sdrs.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2">
              <RoundRobinAssignButton 
                client={client} 
                onAssignmentComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ['clients'] });
                  queryClient.invalidateQueries({ queryKey: ['metrics'] });
                  onOpenChange(false);
                }}
              />
            </div>
          </TabsContent>

          {/* Targets & Financials Tab */}
          <TabsContent value="targets" className="space-y-6 pt-4">
            <div className="space-y-3">
              <Label>Weekly Target</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={weeklyTargetMode === 'target' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setWeeklyTargetMode('target');
                    setFormData({ ...formData, weekly_target_launch_date: null });
                  }}
                >
                  Numeric Target
                </Button>
                <Button
                  type="button"
                  variant={weeklyTargetMode === 'launch' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setWeeklyTargetMode('launch');
                    setFormData({ ...formData, weekly_target: '' });
                  }}
                >
                  Future Launch
                </Button>
              </div>
              {weeklyTargetMode === 'target' ? (
                <Input
                  id="weekly_target"
                  type="number"
                  value={formData.weekly_target || ''}
                  onChange={(e) => setFormData({ ...formData, weekly_target: e.target.value })}
                  placeholder="e.g. 2500"
                  className="max-w-xs"
                />
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "max-w-xs w-full justify-start text-left font-normal",
                        !formData.weekly_target_launch_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.weekly_target_launch_date ? (
                        format(new Date(formData.weekly_target_launch_date), 'PPP')
                      ) : (
                        <span>Pick a launch date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.weekly_target_launch_date ? new Date(formData.weekly_target_launch_date) : undefined}
                      onSelect={(date) => {
                        setFormData({
                          ...formData,
                          weekly_target_launch_date: date ? format(date, 'yyyy-MM-dd') : null,
                        });
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="space-y-3">
              <Label>Monthly Booking Goal</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={monthlyGoalMode === 'numeric' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setMonthlyGoalMode('numeric');
                    setFormData({ ...formData, closelix: false });
                  }}
                >
                  Numeric Target
                </Button>
                <Button
                  type="button"
                  variant={monthlyGoalMode === 'closelix' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setMonthlyGoalMode('closelix');
                    setFormData({ ...formData, monthly_booking_goal: null, closelix: true });
                  }}
                >
                  Closelix
                </Button>
              </div>
              {monthlyGoalMode === 'numeric' ? (
                <Input
                  type="number"
                  value={formData.monthly_booking_goal ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    monthly_booking_goal: e.target.value ? parseFloat(e.target.value) : null,
                  })}
                  placeholder="e.g. 15"
                  className="max-w-xs"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  $25 bonus if client renews and we receive no complaints on bad leads, disconnected senders, or errors with campaigns.
                </p>
              )}
            </div>

            <div className="max-w-xs">
              <Label htmlFor="bonus_pool_monthly">Bonus Pool (Monthly)</Label>
              <Input
                id="bonus_pool_monthly"
                type="number"
                value={formData.bonus_pool_monthly ?? ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  bonus_pool_monthly: e.target.value ? parseFloat(e.target.value) : null 
                })}
                placeholder="e.g. 80"
              />
            </div>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="comms" className="space-y-6 pt-4">
            <div>
              <Label>Correspondence Emails</Label>
              <p className="text-sm text-muted-foreground mb-2">Allowed emails for client communications</p>
              <CorrespondenceEmailsInput
                emails={formData.correspondence_emails || []}
                onChange={(emails) => setFormData({ ...formData, correspondence_emails: emails })}
              />
            </div>
            <div>
              <Label>Correspondence Categories</Label>
              <p className="text-sm text-muted-foreground mb-2">Types of correspondence for this client</p>
              <CorrespondenceCategoriesInput
                categories={formData.correspondence_categories || []}
                onChange={(categories) => setFormData({ ...formData, correspondence_categories: categories })}
              />
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-2 pt-4">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add notes about this client..."
              rows={6}
              className="resize-y"
            />
            <p className="text-xs text-muted-foreground text-right">
              {(formData.notes || '').length.toLocaleString()} / {NOTES_SOFT_LIMIT.toLocaleString()}
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between pt-4">
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
