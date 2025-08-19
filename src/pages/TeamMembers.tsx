import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listTeamMembers, createTeamMember } from '@/lib/teamMembersData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';

export default function TeamMembers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members', { search, roleFilter }],
    queryFn: () => listTeamMembers({ search, role: roleFilter }),
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
      setForm({ full_name: '', email: '', role: 'account_manager' });
    },
    onError: (e: any) =>
      toast({
        variant: 'destructive',
        title: 'Create failed',
        description: e.message || 'Unknown error',
      }),
  });

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
                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v || undefined)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All roles</SelectItem>
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
                        <div className="font-medium">{member.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.email} • {member.role?.replace('_', ' ')}
                        </div>
                      </div>
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