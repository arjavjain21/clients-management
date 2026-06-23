import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  TeamMember,
  TeamMemberRole,
  updateTeamMember,
  getMemberAssignedClients,
} from '@/lib/teamMembersData';

type Props = {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TeamMemberDetailDialog({ member, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TeamMember | null>(member);

  useEffect(() => {
    setForm(member);
  }, [member]);

  const { data: assigned = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['team-member-assigned-clients', member?.id],
    enabled: !!member?.id && open,
    queryFn: () => getMemberAssignedClients(member!.id!),
  });

  const update = useMutation({
    mutationFn: (patch: Partial<TeamMember>) => updateTeamMember(member!.id!, patch),
    onSuccess: () => {
      toast({ title: 'Member updated' });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onOpenChange(false);
    },
    onError: (e: any) =>
      toast({ variant: 'destructive', title: 'Update failed', description: e.message }),
  });

  if (!form) return null;

  const activeCount = assigned.filter((c) => !c.exit_date).length;
  const byRole = {
    AM: assigned.filter((c) => c.roles.includes('AM')).length,
    IM: assigned.filter((c) => c.roles.includes('IM')).length,
    SDR: assigned.filter((c) => c.roles.includes('SDR')).length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{member?.full_name}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              <Stat label="Total" value={assigned.length} />
              <Stat label="Active" value={activeCount} />
              <Stat label="As AM / IM / SDR" value={`${byRole.AM} / ${byRole.IM} / ${byRole.SDR}`} />
              <Stat label="Capacity" value={form.capacity_clients ?? '—'} />
            </div>

            {/* Editable details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground">Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name">
                  <Input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Field>
                <Field label="Role">
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v as TeamMemberRole })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account_manager">Account Manager</SelectItem>
                      <SelectItem value="inbox_manager">Inbox Manager</SelectItem>
                      <SelectItem value="sdr">SDR</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Slack UUID">
                  <Input
                    placeholder="U01ABC23DEF"
                    value={form.slack_uuid ?? ''}
                    onChange={(e) => setForm({ ...form, slack_uuid: e.target.value })}
                  />
                </Field>
                <Field label="Timezone">
                  <Input
                    placeholder="America/New_York"
                    value={form.timezone ?? ''}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  />
                </Field>
                <Field label="Capacity (clients)">
                  <Input
                    type="number"
                    min={0}
                    value={form.capacity_clients ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        capacity_clients: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Round Robin Group">
                  <Input
                    placeholder="default"
                    value={form.round_robin_group ?? ''}
                    onChange={(e) => setForm({ ...form, round_robin_group: e.target.value })}
                  />
                </Field>
              </div>
            </div>

            {/* Assigned clients */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                Assigned Clients ({assigned.length})
              </h3>
              {clientsLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : assigned.length === 0 ? (
                <p className="text-sm text-muted-foreground">No clients assigned.</p>
              ) : (
                <div className="border rounded divide-y">
                  {assigned.map((c) => (
                    <div
                      key={c.client_code ?? c.client_name}
                      className="p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {c.client_name || c.client_company_name || c.client_code}
                          {c.client_code && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              [{c.client_code}]
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {c.client_company_name && `${c.client_company_name} • `}
                          {c.relationship_type ?? '—'} • {c.relationship_status ?? '—'}
                          {c.exit_date && ` • exited ${c.exit_date}`}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {c.roles.map((r) => (
                          <Badge key={r} variant="secondary" className="text-xs">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              update.mutate({
                full_name: form.full_name,
                email: form.email,
                role: form.role,
                slack_uuid: form.slack_uuid,
                timezone: form.timezone,
                capacity_clients: form.capacity_clients,
                round_robin_group: form.round_robin_group,
              })
            }
            disabled={update.isPending || !form.full_name || !form.email}
          >
            {update.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border rounded p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
