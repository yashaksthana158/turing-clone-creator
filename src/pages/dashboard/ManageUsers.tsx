import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Shield, Search, CheckCircle, Eye } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import IdCardVerifyModal from '@/components/dashboard/IdCardVerifyModal';

type AppRole = 'SUPER_ADMIN' | 'PRESIDENT' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'PARTICIPANT';

interface UserWithRoles {
  id: string;
  full_name: string | null;
  email: string;
  roles: AppRole[];
  id_card_url: string | null;
  id_card_verified: boolean;
}

interface RoleDef {
  id: string;
  name: AppRole;
  description: string | null;
}

export default function ManageUsers() {
  const { user, loading: authLoading } = useAuth();
  const { hasMinRoleLevel } = useRole();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roleDefs, setRoleDefs] = useState<RoleDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; roleName: AppRole } | null>(null);

  // ID card modal state
  const [idModalOpen, setIdModalOpen] = useState(false);
  const [idModalUser, setIdModalUser] = useState<{ id: string; name: string; url: string } | null>(null);

  const canVerifyId = hasMinRoleLevel(3);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return; }
    if (!authLoading && !hasMinRoleLevel(5)) { navigate('/unauthorized'); return; }
    if (user) fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    const { data: rolesData } = await supabase.from('roles').select('*').order('name');
    if (rolesData) setRoleDefs(rolesData as RoleDef[]);

    const { data: profilesData } = await supabase.from('profiles').select('id, full_name, id_card_url, id_card_verified');

    const { data: userRolesData } = await supabase
      .from('user_roles')
      .select('user_id, roles(name)');

    const userMap = new Map<string, UserWithRoles>();
    profilesData?.forEach((p: any) => {
      userMap.set(p.id, {
        id: p.id,
        full_name: p.full_name,
        email: '',
        roles: [],
        id_card_url: p.id_card_url,
        id_card_verified: p.id_card_verified ?? false,
      });
    });

    (userRolesData as unknown as { user_id: string; roles: { name: AppRole } }[])?.forEach((ur) => {
      const existing = userMap.get(ur.user_id);
      if (existing) existing.roles.push(ur.roles.name);
    });

    setUsers(Array.from(userMap.values()));
    setLoading(false);
  };

  const handleAssignRole = async (userId: string, roleName: AppRole) => {
    const roleDef = roleDefs.find((r) => r.name === roleName);
    if (!roleDef) return;
    setUpdating(userId);
    const { error } = await supabase.from('user_roles').insert({
      user_id: userId, role_id: roleDef.id, assigned_by: user!.id,
    });
    if (error) {
      if (error.code === '23505') toast.error('Role already assigned');
      else toast.error(error.message);
    } else {
      toast.success(`${roleName.replace('_', ' ')} role assigned!`);
      fetchData();
    }
    setUpdating(null);
  };

  const handleRemoveRole = (userId: string, roleName: AppRole) => {
    setConfirmAction({ userId, roleName });
    setConfirmOpen(true);
  };

  const executeRemoveRole = async () => {
    if (!confirmAction) return;
    const { userId, roleName } = confirmAction;
    setConfirmOpen(false);
    setConfirmAction(null);
    const roleDef = roleDefs.find((r) => r.name === roleName);
    if (!roleDef) return;
    setUpdating(userId);
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role_id', roleDef.id);
    if (error) toast.error(error.message);
    else { toast.success('Role removed'); fetchData(); }
    setUpdating(null);
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadgeColor: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
    PRESIDENT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    TEAM_LEAD: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    TEAM_MEMBER: 'bg-green-500/20 text-green-400 border-green-500/30',
    PARTICIPANT: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9113ff]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Oxanium']">Manage Users</h1>
          <p className="text-gray-400 mt-1">Assign and manage user roles</p>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#1c1c1c] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#9113ff] transition-colors"
          />
        </div>

        <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Current Roles</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#9113ff]/20 flex items-center justify-center text-sm text-[#9113ff] font-bold uppercase">
                          {(u.full_name || '?')[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm font-medium">{u.full_name || 'Unnamed'}</p>
                            {u.id_card_verified && (
                              <CheckCircle size={14} className="text-emerald-400" title="ID Verified" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-gray-500 text-xs">{u.id.slice(0, 12)}...</p>
                            {canVerifyId && u.id_card_url && !u.id_card_verified && (
                              <button
                                onClick={() => {
                                  setIdModalUser({ id: u.id, name: u.full_name || 'Unnamed', url: u.id_card_url! });
                                  setIdModalOpen(true);
                                }}
                                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                              >
                                <Eye size={12} /> View ID
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles.map((role) => (
                          <span
                            key={role}
                            onClick={() => handleRemoveRole(u.id, role)}
                            className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer hover:opacity-70 transition-opacity ${
                              roleBadgeColor[role] || 'bg-gray-500/20 text-gray-400'
                            }`}
                            title="Click to remove"
                          >
                            {role.replace('_', ' ')} ×
                          </span>
                        ))}
                        {u.roles.length === 0 && (
                          <span className="text-gray-500 text-xs">No roles</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        disabled={updating === u.id}
                        onChange={(e) => {
                          if (e.target.value) handleAssignRole(u.id, e.target.value as AppRole);
                          e.target.value = '';
                        }}
                        className="px-3 py-1.5 bg-black border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#9113ff] disabled:opacity-50"
                        defaultValue=""
                      >
                        <option value="" disabled>Assign...</option>
                        {roleDefs
                          .filter((r) => !u.roles.includes(r.name))
                          .map((r) => (
                            <option key={r.id} value={r.name}>
                              {r.name.replace('_', ' ')}
                            </option>
                          ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center">
              <Shield size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No users found</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remove Role"
        description={`Remove ${confirmAction?.roleName.replace(/_/g, ' ')} role from this user?`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={executeRemoveRole}
      />

      {idModalUser && (
        <IdCardVerifyModal
          open={idModalOpen}
          onOpenChange={setIdModalOpen}
          userId={idModalUser.id}
          userName={idModalUser.name}
          idCardUrl={idModalUser.url}
          onApproved={() => {
            toast.success('ID card approved!');
            fetchData();
          }}
        />
      )}
    </DashboardLayout>
  );
}
