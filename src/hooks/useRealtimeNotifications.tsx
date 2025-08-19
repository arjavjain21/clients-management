import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useRealtimeNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listen for changes to the clients table
    const clientsChannel = supabase
      .channel('clients-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clients'
        },
        (payload) => {
          console.log('New client added:', payload);
          
          toast({
            title: "New Client Added",
            description: `Client ${payload.new.client_name || payload.new.client_code} has been added.`,
          });
          
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          queryClient.invalidateQueries({ queryKey: ['metrics'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clients'
        },
        (payload) => {
          console.log('Client updated:', payload);
          
          toast({
            title: "Client Updated",
            description: `Client ${payload.new.client_name || payload.new.client_code} has been updated.`,
          });
          
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          queryClient.invalidateQueries({ queryKey: ['metrics'] });
        }
      )
      .subscribe();

    // Listen for changes to staging data
    const stagingChannel = supabase
      .channel('staging-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clients_staging'
        },
        (payload) => {
          console.log('New staging data:', payload);
          
          toast({
            title: "New Staging Data",
            description: "New client data has been imported to staging.",
          });
          
          // Invalidate staging queries
          queryClient.invalidateQueries({ queryKey: ['staging'] });
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(clientsChannel);
      supabase.removeChannel(stagingChannel);
    };
  }, [toast, queryClient]);
}