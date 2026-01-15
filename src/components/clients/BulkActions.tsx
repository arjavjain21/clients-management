import React, { useState } from 'react';
import { Users, X, Save, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { TeamMember, ClientUpdateData } from '@/types/database';

interface BulkActionsProps {
  selectedCount: number;
  onBulkUpdate: (updates: ClientUpdateData) => Promise<void>;
  onClearSelection: () => void;
  teamMembers: TeamMember[];
}

export function BulkActions({
  selectedCount,
  onBulkUpdate,
  onClearSelection,
  teamMembers,
}: BulkActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [updates, setUpdates] = useState<ClientUpdateData>({});
  const [loading, setLoading] = useState(false);
  const [weeklyTargetMode, setWeeklyTargetMode] = useState<'no-change' | 'target' | 'launch'>('no-change');

  const accountManagers = teamMembers.filter(tm => tm.role === 'account_manager');
  const inboxManagers = teamMembers.filter(tm => tm.role === 'inbox_manager');

  const handleSubmit = async () => {
    if (Object.keys(updates).length === 0) {
      return;
    }

    setLoading(true);
    try {
      // Before submitting, handle weekly target based on mode
      const finalUpdates = { ...updates };
      if (weeklyTargetMode === 'no-change') {
        delete finalUpdates.weekly_target;
        delete finalUpdates.weekly_target_launch_date;
      } else if (weeklyTargetMode === 'target') {
        finalUpdates.weekly_target_launch_date = null;
      } else if (weeklyTargetMode === 'launch' && finalUpdates.weekly_target_launch_date) {
        const launchDate = new Date(finalUpdates.weekly_target_launch_date);
        finalUpdates.weekly_target = `Launch ${format(launchDate, 'do MMM')}`;
      }
      
      await onBulkUpdate(finalUpdates);
      setUpdates({});
      setWeeklyTargetMode('no-change');
      setIsOpen(false);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ClientUpdateData, value: string) => {
    const newUpdates = { ...updates };
    
    if (value === '' || value === 'no-change') {
      delete newUpdates[field];
    } else {
      const finalValue = value === 'unassigned' ? null : value;
      
      // Type-safe assignment based on field
      if (field === 'weekend_sending_mode') {
        (newUpdates as any).weekend_sending_mode = finalValue as 'true' | 'false' | 'inherit' | null;
      } else if (field === 'assigned_account_manager_id' || field === 'assigned_inbox_manager_id') {
        (newUpdates as any)[field] = finalValue as string | null;
      } else if (field === 'weekly_target') {
        // Store as string
        (newUpdates as any).weekly_target = value || null;
      } else if (field === 'weekly_target_launch_date') {
        (newUpdates as any).weekly_target_launch_date = value || null;
      } else {
        (newUpdates as any)[field] = finalValue;
      }
    }
    
    setUpdates(newUpdates);
  };

  const hasUpdates = Object.keys(updates).length > 0 || weeklyTargetMode !== 'no-change';

  return (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {selectedCount} client{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
          <Badge variant="secondary">{selectedCount}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                Bulk Update
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Update Clients</DialogTitle>
                <DialogDescription>
                  Update {selectedCount} selected client{selectedCount !== 1 ? 's' : ''}. 
                  Only fields you change will be updated.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                {/* Weekend Sending Mode */}
                <div className="space-y-2">
                  <Label>Weekend Sending Mode</Label>
                  <Select
                    value={updates.weekend_sending_mode || 'no-change'}
                    onValueChange={(value) => updateField('weekend_sending_mode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">No change</SelectItem>
                      <SelectItem value="true">Enable</SelectItem>
                      <SelectItem value="false">Disable</SelectItem>
                      <SelectItem value="inherit">Inherit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Account Manager */}
                <div className="space-y-2">
                  <Label>Account Manager</Label>
                  <Select
                    value={updates.assigned_account_manager_id === null ? 'unassigned' : (updates.assigned_account_manager_id || 'no-change')}
                    onValueChange={(value) => updateField('assigned_account_manager_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">No change</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {accountManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Inbox Manager */}
                <div className="space-y-2">
                  <Label>Inbox Manager</Label>
                  <Select
                    value={updates.assigned_inbox_manager_id === null ? 'unassigned' : (updates.assigned_inbox_manager_id || 'no-change')}
                    onValueChange={(value) => updateField('assigned_inbox_manager_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">No change</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {inboxManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Weekly Target */}
                <div className="space-y-3">
                  <Label>Weekly Target</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={weeklyTargetMode === 'no-change' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setWeeklyTargetMode('no-change');
                        const newUpdates = { ...updates };
                        delete newUpdates.weekly_target;
                        delete newUpdates.weekly_target_launch_date;
                        setUpdates(newUpdates);
                      }}
                    >
                      No Change
                    </Button>
                    <Button
                      type="button"
                      variant={weeklyTargetMode === 'target' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setWeeklyTargetMode('target');
                        setUpdates({ ...updates, weekly_target_launch_date: null });
                      }}
                    >
                      Numeric
                    </Button>
                    <Button
                      type="button"
                      variant={weeklyTargetMode === 'launch' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setWeeklyTargetMode('launch');
                        setUpdates({ ...updates, weekly_target: '' });
                      }}
                    >
                      Future Launch
                    </Button>
                  </div>
                  
                  {weeklyTargetMode === 'target' && (
                    <Input
                      type="number"
                      placeholder="e.g. 2500"
                      value={updates.weekly_target ?? ''}
                      onChange={(e) => updateField('weekly_target', e.target.value)}
                    />
                  )}
                  
                  {weeklyTargetMode === 'launch' && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !updates.weekly_target_launch_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {updates.weekly_target_launch_date ? (
                            format(new Date(updates.weekly_target_launch_date), 'PPP')
                          ) : (
                            <span>Pick a launch date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={updates.weekly_target_launch_date ? new Date(updates.weekly_target_launch_date) : undefined}
                          onSelect={(date) => {
                            updateField('weekly_target_launch_date', date ? format(date, 'yyyy-MM-dd') : '');
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setUpdates({});
                    setWeeklyTargetMode('no-change');
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!hasUpdates || loading}
                >
                  {loading ? 'Updating...' : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update {selectedCount} Client{selectedCount !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
}