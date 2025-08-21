import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listTeamMembers, createTeamMember, deleteTeamMember } from '@/lib/teamMembersData';
import { sendAssignmentEmail } from '@/lib/email';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// NOTE: Minimal inline helpers to avoid broader refactors
function csvEscape(value: any) {
  const s = value == null ? '' : String(value);
  return '"' + s.replaceAll('"', '""') + '"';
}

export default function TeamMembers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; exporting: boolean; loading: boolean; member: any | null }>({ open: false, exporting: false, loading: false, member: null });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members', { search, roleFilter }],
    queryFn: () => listTeamMembers({ search, role: roleFilter }),
  });

  // Per-member client counts (sum of AM + IM assignments)
  const { data: memberClientCounts = {}, isLoading: countsLoading } = useQuery({
    queryKey: ['team-members-client-counts', members.map(m => m.id).join(',')],
    enabled: members.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        members
          .filter((m) => !!m.id)
          .map(async (m) => {
            const [amRes, imRes] = await Promise.all([
              supabase
                .from('clients')
                .select('client_id', { count: 'exact', head: true })
                .eq('assigned_account_manager_id', m.id!),
              supabase
                .from('clients')
                .select('client_id', { count: 'exact', head: true })
                .eq('assigned_inbox_manager_id', m.id!),
            ]);
            if (amRes.error) throw amRes.error;
            if (imRes.error) throw imRes.error;
            const total = (amRes.count ?? 0) + (imRes.count ?? 0);
            return [m.id!, total] as const;
          })
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
  });

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    role: 'account_manager' as const,
  });

  const create = useMutation({
    mutationFn: createTeamMember,
    onSuccess: (row) => {
      toast({ title: 'Team member added', description: row.full_name });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      // Also refresh role-specific queries for client overlay selects
      queryClient.invalidateQueries({ queryKey: ['team-members', { role: 'account_manager' }] });
      queryClient.invalidateQueries({ queryKey: ['team-members', { role: 'inbox_manager' }] });
      setForm({ full_name: '', email: '', role: 'account_manager' });

      // Non-blocking welcome email
      (async () => {
        try {
          await sendAssignmentEmail({
            to: row.email,
            subject: 'Welcome to the team',
            text: `Hi ${row.full_name},\n\nWelcome to the team! Your role is: ${row.role?.replace('_',' ')}.\n\nRegards,\nOperations`,
          });
        } catch (emailError: any) {
          console.warn('Failed to send welcome email:', emailError);
          toast({ title: 'Email warning', description: 'Could not send welcome email (send-mail)', variant: 'default' });
        }
      })();
    },
    onError: (e: any) =>
      toast({
        variant: 'destructive',
        title: 'Create failed',
        description: e.message || 'Unknown error',
      }),
  });

  // Conflict-aware add: check by email before insert
  const handleCreate = async () => {
    if (!form.full_name || !form.email) return;
    try {
      const { data: existing, error } = await supabase
        .from('team_members')
        .select('id')
        .eq('email', form.email)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (existing) {
        toast({ variant: 'destructive', title: 'Member already exists', description: 'A member with this email already exists.' });
        return;
      }
      create.mutate(form);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Validation failed', description: e.message || 'Could not verify uniqueness' });
    }
  };

  const deleteMutation = useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: async (removed: any) => {
      toast({ title: 'Team member removed', description: removed.full_name });

      // Optimistically remove from current cached lists
      queryClient.setQueriesData({ queryKey: ['team-members'] }, (old: any) => {
        if (Array.isArray(old)) {
          return old.filter((m) => m.id !== removed.id);
        }
        return old;
      });
      
      // Send removal notification email
      try {
        await sendAssignmentEmail({
          to: removed.email,
          subject: 'You have been removed from the team',
          text: `Hi ${removed.full_name},\n\nYou have been removed from the team directory and unassigned from all clients.\n\nRegards,\nOperations`,
        });
      } catch (emailError) {
        console.warn('Failed to send removal email:', emailError);
        toast({ title: 'Email warning', description: 'Could not send removal email (send-mail)', variant: 'default' });
      }
      
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['team-members', { role: 'account_manager' }] });
      queryClient.invalidateQueries({ queryKey: ['team-members', { role: 'inbox_manager' }] });
    },
    onError: (e: any) =>
      toast({
        variant: 'destructive',
        title: 'Remove failed',
        description: e.message || 'Unknown error',
      }),
  });

  const handleExportAndRemove = async () => {
    const member = removeDialog.member;
    if (!member?.id) return;
    setRemoveDialog((d) => ({ ...d, loading: true }));
    try {
      // Precheck existence
      const { data: existing, error: preErr } = await supabase
        .from('team_members')
        .select('id, full_name, email')
        .eq('id', member.id)
        .maybeSingle();
      if (preErr) throw preErr;
      if (!existing) {
        toast({ title: 'Already removed', description: 'This member no longer exists in the directory.' });
        queryClient.invalidateQueries({ queryKey: ['team-members'] });
        setRemoveDialog({ open: false, exporting: false, loading: false, member: null });
        return;
      }

      // Optional CSV export before unassigning/deleting
      if (removeDialog.exporting) {
        const [amRes, imRes] = await Promise.all([
          supabase.from('clients').select('*').eq('assigned_account_manager_id', member.id),
          supabase.from('clients').select('*').eq('assigned_inbox_manager_id', member.id),
        ]);
        if (amRes.error) throw amRes.error;
        if (imRes.error) throw imRes.error;
        const rows = [...(amRes.data || []), ...(imRes.data || [])];
        const seen = new Set<string>();
        const deduped = rows.filter((r: any) => {
          const key = `${r.client_code}-${r.client_id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        const headers = [
          'client_code','client_id','client_name','client_email','client_company_name','relationship_status','relationship_type','avg_dollar_gen_pm','weekend_sending_mode',
          'assigned_account_manager_id','assigned_account_manager_name','assigned_account_manager_email',
          'assigned_inbox_manager_id','assigned_inbox_manager_name','assigned_inbox_manager_email',
        ];
        const output: string[] = [headers.join(',')];
        const idTo = new Map(members.filter(m => m.id).map(m => [m.id!, { name: m.full_name, email: m.email }]));
        deduped.forEach((r: any) => {
          const am = r.assigned_account_manager_id ? idTo.get(r.assigned_account_manager_id) : undefined;
          const im = r.assigned_inbox_manager_id ? idTo.get(r.assigned_inbox_manager_id) : undefined;
          output.push([
            csvEscape(r.client_code),
            r.client_id,
            csvEscape(r.client_name ?? ''),
            csvEscape(r.client_email ?? ''),
            csvEscape(r.client_company_name ?? ''),
            csvEscape(r.relationship_status ?? ''),
            csvEscape(r.relationship_type ?? ''),
            r.avg_dollar_gen_pm ?? '',
            csvEscape(r.weekend_sending_mode ?? ''),
            csvEscape(r.assigned_account_manager_id ?? ''),
            csvEscape(am?.name ?? ''),
            csvEscape(am?.email ?? ''),
            csvEscape(r.assigned_inbox_manager_id ?? ''),
            csvEscape(im?.name ?? ''),
            csvEscape(im?.email ?? ''),
          ].join(','));
        });
        const blob = new Blob([output.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assigned_clients_${existing.full_name || 'member'}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Unassign first
      const { error: amErr } = await supabase
        .from('clients')
        .update({ assigned_account_manager_id: null })
        .eq('assigned_account_manager_id', member.id);
      if (amErr) throw amErr;
      const { error: imErr } = await supabase
        .from('clients')
        .update({ assigned_inbox_manager_id: null })
        .eq('assigned_inbox_manager_id', member.id);
      if (imErr) throw imErr;

      // Delete member (idempotent)
      const { error: delErr } = await supabase.from('team_members').delete().eq('id', member.id);
      if (delErr) throw delErr;

      // Email after successful delete
      try {
        await sendAssignmentEmail({
          to: existing.email,
          subject: 'You have been removed from the team',
          text: `Hi ${existing.full_name},\n\nYou have been removed from the team directory and unassigned from all clients.\n\nRegards,\nOperations`,
        });
      } catch (emailError) {
        console.warn('Failed to send removal email:', emailError);
        toast({ title: 'Email warning', description: 'Could not send removal email (send-mail)', variant: 'default' });
      }

      // Optimistic removal & invalidation
      queryClient.setQueriesData({ queryKey: ['team-members'] }, (old: any) => {
        if (Array.isArray(old)) return old.filter((m) => m.id !== member.id);
        return old;
      });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['team-members', { role: 'account_manager' }] });
      queryClient.invalidateQueries({ queryKey: ['team-members', { role: 'inbox_manager' }] });

      toast({ title: 'Team member removed', description: existing.full_name });
      setRemoveDialog({ open: false, exporting: false, loading: false, member: null });
    } catch (e: any) {
      console.error('Removal error', e);
      toast({ variant: 'destructive', title: 'Remove failed', description: e.message || 'Unknown error' });
      setRemoveDialog((d) => ({ ...d, loading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="lg:pl-64">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Team Members</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add New Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm((f) => ({ ...f, role: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account_manager">Account Manager</SelectItem>
                      <SelectItem value="inbox_manager">Inbox Manager</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={!form.full_name || !form.email || create.isPending}>
                {create.isPending ? 'Adding…' : 'Add Member'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Input
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={roleFilter || "all"} onValueChange={(v) => setRoleFilter(v === "all" ? undefined : v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="account_manager">Account Manager</SelectItem>
                    <SelectItem value="inbox_manager">Inbox Manager</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="divide-y border rounded">
                {isLoading ? (
                  <div className="p-6 text-center">Loading...</div>
                ) : members.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">No team members found.</div>
                ) : (
                  members.map((member) => (
                    <div key={member.id} className="p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          {member.full_name}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {(memberClientCounts as Record<string, number>)[member.id!] ?? 0} clients
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.email} • {member.role?.replace('_', ' ')}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRemoveDialog({ open: true, exporting: false, loading: false, member })}
                        disabled={deleteMutation.isPending}
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
    <Dialog
      open={removeDialog.open}
      onOpenChange={(nextOpen) => {
        if (!removeDialog.loading) setRemoveDialog((d) => ({ ...d, open: nextOpen }));
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Team Member</DialogTitle>
          <DialogDescription>
            {removeDialog.member ? `Remove ${removeDialog.member.full_name}? They will be unassigned from all clients and deleted from the directory.` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 flex items-center gap-2">
          <Checkbox id="export-before-remove" checked={removeDialog.exporting} onCheckedChange={(v) => setRemoveDialog((d) => ({ ...d, exporting: Boolean(v) }))} />
          <Label htmlFor="export-before-remove">Export assigned clients before removal</Label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRemoveDialog({ open: false, exporting: false, loading: false, member: null })} disabled={removeDialog.loading}>Cancel</Button>
          <Button variant="destructive" onClick={handleExportAndRemove} disabled={removeDialog.loading}>{removeDialog.loading ? 'Removing…' : 'Remove Member'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}