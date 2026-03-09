import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  assigned_by: string | null;
  team_id: string;
  due_date: string | null;
  created_at: string;
  team_name?: string;
  assignee_name?: string;
  assigner_name?: string;
}

export function useTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async (): Promise<Task[]> => {
      if (!user) return [];

      const { data: taskData, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load tasks');
        return [];
      }

      if (!taskData || taskData.length === 0) return [];

      // Gather unique user IDs and team IDs
      const userIds = new Set<string>();
      const teamIds = new Set<string>();
      taskData.forEach((t) => {
        if (t.assigned_to) userIds.add(t.assigned_to);
        if (t.assigned_by) userIds.add(t.assigned_by);
        teamIds.add(t.team_id);
      });

      // Fetch profiles and teams in parallel
      const [profilesRes, teamsRes] = await Promise.all([
        userIds.size > 0
          ? supabase.from('profiles').select('id, full_name').in('id', Array.from(userIds))
          : Promise.resolve({ data: [] }),
        supabase.from('teams').select('id, name').in('id', Array.from(teamIds)),
      ]);

      const profileMap: Record<string, string> = {};
      (profilesRes.data || []).forEach((p: any) => {
        profileMap[p.id] = p.full_name || 'Unknown';
      });
      const teamMap: Record<string, string> = {};
      (teamsRes.data || []).forEach((t: any) => {
        teamMap[t.id] = t.name;
      });

      return taskData.map((t) => ({
        ...t,
        status: t.status as TaskStatus,
        team_name: teamMap[t.team_id] || 'Unknown',
        assignee_name: t.assigned_to ? profileMap[t.assigned_to] || 'Unknown' : undefined,
        assigner_name: t.assigned_by ? profileMap[t.assigned_by] || 'Unknown' : undefined,
      }));
    },
    enabled: !!user,
    staleTime: 30000,
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) => {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: (_, { newStatus }) => {
      toast.success(`Task marked as ${newStatus.replace('_', ' ')}`);
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update task');
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Task deleted');
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete task');
    },
  });
}
