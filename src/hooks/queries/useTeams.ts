import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  member_count?: number;
}

export interface TeamMember {
  id: string;
  user_id: string;
  position: string;
  joined_at: string;
  profiles: { full_name: string | null } | null;
}

export function useTeams() {
  const { isReady } = useAuth();

  return useQuery({
    queryKey: ['teams'],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      // Batch count query instead of N+1
      const teamIds = (data || []).map(t => t.id);
      if (teamIds.length === 0) return [];

      const { data: countData } = await supabase
        .from('team_members')
        .select('team_id')
        .in('team_id', teamIds);

      const countMap = new Map<string, number>();
      (countData || []).forEach(m => {
        countMap.set(m.team_id, (countMap.get(m.team_id) || 0) + 1);
      });

      return (data || []).map(t => ({
        ...t,
        member_count: countMap.get(t.id) || 0,
      }));
    },
    enabled: isReady,
    staleTime: 30000,
  });
}

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!teamId) return [];
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, position, joined_at, profiles(full_name)')
        .eq('team_id', teamId)
        .order('position', { ascending: true });
      if (error) throw error;
      return (data as unknown as TeamMember[]) || [];
    },
    enabled: !!teamId,
    staleTime: 30000,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string | null }) => {
      const { error } = await supabase.from('teams').insert({
        name,
        description,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Team created!');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.from('teams').delete().eq('id', teamId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Team deleted');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, userId, position }: { teamId: string; userId: string; position: 'MEMBER' | 'LEAD' }) => {
      const { error } = await supabase.from('team_members').insert({
        team_id: teamId,
        user_id: userId,
        position,
      });
      if (error) throw error;
    },
    onSuccess: (_, { teamId }) => {
      toast.success('Member added!');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: any) => {
      if (error.code === '23505') toast.error('User is already a team member');
      else toast.error(error.message);
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, teamId }: { memberId: string; teamId: string }) => {
      const { error } = await supabase.from('team_members').delete().eq('id', memberId);
      if (error) throw error;
      return teamId;
    },
    onSuccess: (teamId) => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}
