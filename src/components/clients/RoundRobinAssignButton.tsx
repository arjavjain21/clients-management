import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { assignTeamMembersRoundRobin } from '@/lib/roundRobinAssignment';
import { Loader2, Users } from 'lucide-react';
import type { Client } from '@/types/database';

interface RoundRobinAssignButtonProps {
  client: Client;
  onAssignmentComplete?: () => void;
}

export function RoundRobinAssignButton({ client, onAssignmentComplete }: RoundRobinAssignButtonProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  const handleRoundRobinAssign = async () => {
    if (!client) return;
    
    setIsAssigning(true);
    try {
      // Get round-robin assignments
      const assignments = await assignTeamMembersRoundRobin(client);
      
      // Update the client with new assignments
      const updates: any = {};
      if (assignments.account_manager_id) {
        updates.assigned_account_manager_id = assignments.account_manager_id;
      }
      if (assignments.inbox_manager_id) {
        updates.assigned_inbox_manager_id = assignments.inbox_manager_id;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('clients')
          .update(updates)
          .eq('client_code', client.client_code)
          .eq('client_id', client.client_id);

        if (error) throw error;

        const assignedNames = [];
        if (assignments.account_manager) {
          assignedNames.push(`AM: ${assignments.account_manager.full_name}`);
        }
        if (assignments.inbox_manager) {
          assignedNames.push(`IM: ${assignments.inbox_manager.full_name}`);
        }

        toast({
          title: "Round-robin assignment complete",
          description: assignedNames.length > 0 
            ? `Assigned ${assignedNames.join(', ')}` 
            : "No available team members found"
        });

        onAssignmentComplete?.();
      } else {
        toast({
          title: "No assignments made",
          description: "No available team members found for assignment",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Round-robin assignment error:', error);
      toast({
        title: "Assignment failed",
        description: error.message || "Failed to assign team members",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRoundRobinAssign}
      disabled={isAssigning}
    >
      {isAssigning ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Users className="h-4 w-4 mr-2" />
      )}
      {isAssigning ? 'Assigning...' : 'Auto-Assign'}
    </Button>
  );
}