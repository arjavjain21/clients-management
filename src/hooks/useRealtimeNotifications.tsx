import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useActivity } from '@/context/activity';

export function useRealtimeNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { push } = useActivity();

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients'
        },
        (payload) => {
          // INSERT
          if (payload.eventType === 'INSERT') {
            const name = (payload.new as any)?.client_name ?? '—';
            toast({ title: "New client added", description: name });
            push({
              id: crypto.randomUUID(),
              type: 'insert',
              client_name: name,
              at: Date.now(),
              summary: `New client: ${name}`
            });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['metrics'] });
          }
          // UPDATE
          if (payload.eventType === 'UPDATE') {
            const name = (payload.new as any)?.client_name ?? '—';
            toast({ title: "Client updated", description: name });
            push({
              id: crypto.randomUUID(),
              type: 'update',
              client_name: name,
              at: Date.now(),
              summary: `Updated: ${name}`
            });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['metrics'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, queryClient, push]);
}