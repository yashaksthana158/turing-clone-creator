import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';

interface Stats {
  teams: number;
  events: number;
  tasks: number;
  users: number;
  myRegistrations: number;
  certificates: number;
}

export function useStats() {
  const { user } = useAuth();
  const { hasMinRoleLevel } = useRole();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async (): Promise<Stats> => {
      if (!user) return { teams: 0, events: 0, tasks: 0, users: 0, myRegistrations: 0, certificates: 0 };

      const [eventsRes, myRegsRes, certsRes] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'PUBLISHED'),
        supabase.from('event_registrations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      let teams = 0, tasks = 0, users = 0;

      if (hasMinRoleLevel(3)) {
        const [teamsRes, tasksRes] = await Promise.all([
          supabase.from('teams').select('id', { count: 'exact', head: true }),
          supabase.from('tasks').select('id', { count: 'exact', head: true }),
        ]);
        teams = teamsRes.count || 0;
        tasks = tasksRes.count || 0;
      }
      if (hasMinRoleLevel(4)) {
        const usersRes = await supabase.from('profiles').select('id', { count: 'exact', head: true });
        users = usersRes.count || 0;
      }

      return {
        events: eventsRes.count || 0,
        myRegistrations: myRegsRes.count || 0,
        certificates: certsRes.count || 0,
        teams,
        tasks,
        users,
      };
    },
    enabled: !!user,
    staleTime: 30000,
  });
}
