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
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { useSidebarState } from '@/hooks/useSidebarState';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { INACTIVE_STATUSES } from '@/config/statusBuckets';

export default function TeamMembers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useSidebarState();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members', { search, roleFilter }],
    queryFn: () => listTeamMembers({ search, role: roleFilter }),
  });

  // Per-member client counts (sum of AM + IM + SDR assignments) - ACTIVE clients only
  const { data: memberClientCounts = {}, isLoading: countsLoading } = useQuery({
    queryKey: ['team-members-client-counts', members.map(m => m.id).join(',')],
    enabled: members.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        members
          .filter((m) => !!m.id)
          .map(async (m) => {
            const [amRes, imRes, sdrRes] = await Promise.all([
              supabase
                .from('clients')
                .select('relationship_status, exit_date', { count: 'exact' })
                .eq('assigned_account_manager_id', m.id!)
                .is('exit_date', null),
              supabase
                .from('clients')
                .select('relationship_status, exit_date', { count: 'exact' })
                .eq('assigned_inbox_manager_id', m.id!)
                .is('exit_date', null),
              supabase
                .from('clients')
                .select('relationship_status, exit_date', { count: 'exact' })
                .eq('assigned_sdr_id', m.id!)
                .is('exit_date', null),
            ]);
            if (amRes.error) throw amRes.error;
            if (imRes.error) throw imRes.error;
            if (sdrRes.error) throw sdrRes.error;
            
            // Filter out inactive statuses on the frontend
            const activeAM = (amRes.data || []).filter(c => 
              !c.relationship_status || !INACTIVE_STATUSES.includes(c.relationship_status.toUpperCase())
            ).length;
            const activeIM = (imRes.data || []).filter(c => 
              !c.relationship_status || !INACTIVE_STATUSES.includes(c.relationship_status.toUpperCase())
            ).length;
            const activeSDR = (sdrRes.data || []).filter(c => 
              !c.relationship_status || !INACTIVE_STATUSES.includes(c.relationship_status.toUpperCase())
            ).length;
            
            const total = activeAM + activeIM + activeSDR;
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
      queryClient.invalidateQueries({ queryKey: ['team-members', { role: 'sdr' }] });
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
      queryClient.invalidateQueries({ queryKey: ['team-members', { role: 'sdr' }] });
    },
    onError: (e: any) =>
      toast({
        variant: 'destructive',
        title: 'Remove failed',
        description: e.message || 'Unknown error',
      }),
  });

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar 
        open={sidebarOpen} 
        onOpenChange={setSidebarOpen}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
      <div className={cn(
        "transition-all duration-200 ease-in-out",
        collapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
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
                      <SelectItem value="sdr">SDR</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={() => create.mutate(form)}
                disabled={!form.full_name || !form.email || create.isPending}
              >
                Add Member
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
                    <SelectItem value="sdr">SDR</SelectItem>
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
                        onClick={async () => {
                          if (!confirm(`Remove ${member.full_name}? They will be unassigned from all clients.`)) return;
                          deleteMutation.mutate(member.id!);
                        }}
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
  );
}