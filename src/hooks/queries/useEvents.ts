import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { toast } from 'sonner';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  status: string;
  max_participants: number | null;
  created_by: string;
  poster_url: string | null;
  category: string | null;
  is_featured: boolean;
}

export interface Approval {
  id: string;
  item_id: string;
  level: number;
  status: string;
}

export interface Registration {
  id: string;
  status: string;
  registered_at: string;
  event_id: string;
  events: {
    title: string;
    event_date: string | null;
    venue: string | null;
    status: string;
  } | null;
}

export function useMyRegistrations() {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['my-registrations', user?.id],
    queryFn: async (): Promise<Registration[]> => {
      if (!user) return [];
      const { data } = await supabase
        .from('event_registrations')
        .select('id, status, registered_at, event_id, events(title, event_date, venue, status)')
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false });
      return (data as unknown as Registration[]) || [];
    },
    enabled: isReady && !!user,
    staleTime: 30000,
  });
}

export function useEvents() {
  const { hasMinRoleLevel } = useRole();
  const canManage = hasMinRoleLevel(2);

  return useQuery({
    queryKey: ['events', canManage],
    queryFn: async (): Promise<Event[]> => {
      if (!canManage) return [];
      const { data } = await supabase
        .from('events')
        .select('id, title, description, event_date, venue, status, max_participants, created_by, poster_url, category, is_featured')
        .order('created_at', { ascending: false });
      return (data as Event[]) || [];
    },
    enabled: canManage,
    staleTime: 30000,
  });
}

export function useEventApprovals(eventIds: string[]) {
  return useQuery({
    queryKey: ['event-approvals', eventIds],
    queryFn: async (): Promise<Approval[]> => {
      if (eventIds.length === 0) return [];
      const { data } = await supabase
        .from('approvals')
        .select('id, item_id, level, status')
        .eq('item_type', 'EVENT')
        .eq('status', 'PENDING')
        .in('item_id', eventIds);
      return (data as Approval[]) || [];
    },
    enabled: eventIds.length > 0,
    staleTime: 30000,
  });
}

export function useCancelRegistration() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (regId: string) => {
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: 'CANCELLED' })
        .eq('id', regId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Registration cancelled');
      queryClient.invalidateQueries({ queryKey: ['my-registrations', user?.id] });
    },
    onError: () => {
      toast.error('Failed to cancel');
    },
  });
}
