import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { toast } from 'sonner';

export interface Certificate {
  id: string;
  title: string;
  description: string | null;
  certificate_number: string;
  issued_at: string;
  user_id: string;
  event_id: string | null;
  issued_by: string;
  profiles?: { full_name: string | null };
  events?: { title: string } | null;
}

export function useCertificates() {
  const { user, isReady } = useAuth();
  const { hasMinRoleLevel } = useRole();
  const isAdmin = hasMinRoleLevel(4);

  return useQuery({
    queryKey: ['certificates', user?.id, isAdmin],
    queryFn: async (): Promise<Certificate[]> => {
      if (!user) return [];

      let query = supabase
        .from('certificates')
        .select('*, events:event_id(title)')
        .order('issued_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching certificates:', error);
        return [];
      }

      const certs = (data as unknown as Certificate[]) || [];
      
      // Fetch profile names for certificate user_ids
      if (certs.length > 0 && isAdmin) {
        const userIds = [...new Set(certs.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
        certs.forEach(c => {
          c.profiles = { full_name: profileMap.get(c.user_id) || null };
        });
      }
      
      return certs;
    },
    enabled: isReady && !!user,
    staleTime: 30000,
  });
}

export function useDeleteCertificate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasMinRoleLevel } = useRole();

  return useMutation({
    mutationFn: async (certId: string) => {
      const { error } = await supabase.from('certificates').delete().eq('id', certId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Certificate deleted');
      queryClient.invalidateQueries({ queryKey: ['certificates', user?.id, hasMinRoleLevel(4)] });
    },
    onError: () => {
      toast.error('Failed to delete certificate');
    },
  });
}

export function useIssueCertificates() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasMinRoleLevel } = useRole();

  return useMutation({
    mutationFn: async (rows: {
      user_id: string;
      title: string;
      description: string | null;
      event_id: string | null;
      issued_by: string;
    }[]) => {
      const { error } = await supabase.from('certificates').insert(rows);
      if (error) throw error;
    },
    onSuccess: (_, rows) => {
      toast.success(`Issued ${rows.length} certificate(s)`);
      queryClient.invalidateQueries({ queryKey: ['certificates', user?.id, hasMinRoleLevel(4)] });
    },
    onError: (error: any) => {
      toast.error('Failed to issue certificates: ' + error.message);
    },
  });
}
