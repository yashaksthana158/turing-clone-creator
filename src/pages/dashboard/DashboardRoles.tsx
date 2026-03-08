import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Shield, ArrowRightLeft, Search, Loader2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { toast } from 'sonner';

type AppRole = 'SUPER_ADMIN' | 'PRESIDENT' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'PARTICIPANT';

interface RoleDef {
  id: string;
  name: AppRole;
  description: string | null;
}

interface UserWithRoles {
  id: string;
  full_name: string | null;
  email: string;
  roles: AppRole[];
}

const ROLE_COLORS: Record<AppRole, string> = {
  SUPER_ADMIN: 'bg-red-600/20 text-red-400 border-red-600/30',
  PRESIDENT: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
  TEAM_LEAD: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  TEAM_MEMBER: 'bg-green-600/20 text-green-400 border-green-600/30',
  PARTICIPANT: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
};

export default function DashboardRoles() {
  const { user } = useAuth();
  const { isSuperAdmin } = useRole();
  const [roleDefs, setRoleDefs] = useState<RoleDef[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [transferTarget, setTransferTarget] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch roles
    const { data: roles } = await supabase.from('roles').select('id, name, description');
    setRoleDefs((roles as RoleDef[]) || []);

    // Fetch profiles
    const { data: profiles } = await supabase.from('profiles').select('id, full_name');

    // Fetch user_roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('user_id, role_id, roles(name)');

    // Build user map
    const userMap = new Map<string, UserWithRoles>();
    for (const p of profiles || []) {
      userMap.set(p.id, { id: p.id, full_name: p.full_name, email: '', roles: [] });
    }

    // Get emails via auth - we can't, so we'll show user IDs or names
    // Actually fetch from auth users isn't possible client-side. We'll show profile info.

    for (const ur of (userRoles as any[]) || []) {
      const u = userMap.get(ur.user_id);
      if (u && ur.roles?.name) {
        u.roles.push(ur.roles.name);
      }
    }

    setUsers(Array.from(userMap.values()));
    setLoading(false);
  };

  const handleTransferAdmin = async (targetUserId: string) => {
    if (!user || !isSuperAdmin()) return;

    const targetUser = users.find(u => u.id === targetUserId);
    const confirmMsg = `Transfer Super Admin to ${targetUser?.full_name || targetUserId}? You will lose your Super Admin role.`;
    if (!confirm(confirmMsg)) return;

    setTransferring(true);
    setTransferTarget(targetUserId);

    try {
      // Get SUPER_ADMIN role id
      const adminRole = roleDefs.find(r => r.name === 'SUPER_ADMIN');
      if (!adminRole) throw new Error('SUPER_ADMIN role not found');

      // Assign to new user
      const { error: assignError } = await supabase
        .from('user_roles')
        .insert({ user_id: targetUserId, role_id: adminRole.id, assigned_by: user.id });

      if (assignError) {
        if (assignError.code === '23505') {
          // Already has the role, just remove from current
        } else {
          throw assignError;
        }
      }

      // Remove from current user
      const { error: removeError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id)
        .eq('role_id', adminRole.id);

      if (removeError) throw removeError;

      toast.success('Super Admin transferred! You will be redirected.');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed');
    }

    setTransferring(false);
    setTransferTarget(null);
  };

  const filteredUsers = users.filter(u =>
    (u.full_name || u.id).toLowerCase().includes(search.toLowerCase())
  );

  // Group users by role for overview
  const roleUserCounts = roleDefs.map(r => ({
    ...r,
    count: users.filter(u => u.roles.includes(r.name)).length,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Oxanium']">Roles & Permissions</h1>
          <p className="text-gray-400 mt-1">View roles and transfer Super Admin</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-purple-500" size={36} />
          </div>
        ) : (
          <>
            {/* Role Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {roleUserCounts.map(r => (
                <div key={r.id} className={`rounded-lg border p-4 ${ROLE_COLORS[r.name]}`}>
                  <div className="text-2xl font-bold">{r.count}</div>
                  <div className="text-xs mt-1 opacity-80">{r.name.replace('_', ' ')}</div>
                </div>
              ))}
            </div>

            {/* Transfer Admin Section */}
            {isSuperAdmin() && (
              <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft size={20} className="text-purple-500" />
                  <h2 className="text-lg font-semibold text-white">Transfer Super Admin</h2>
                </div>
                <p className="text-gray-400 text-sm">
                  Select a user below to transfer your Super Admin role. This action cannot be undone — the new admin will need to transfer it back.
                </p>

                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredUsers
                    .filter(u => u.id !== user?.id)
                    .map(u => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 bg-black/50 border border-gray-800 rounded-lg"
                      >
                        <div>
                          <div className="text-white text-sm font-medium">
                            {u.full_name || 'Unnamed User'}
                          </div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {u.roles.map(r => (
                              <span
                                key={r}
                                className={`text-[10px] px-1.5 py-0.5 rounded border ${ROLE_COLORS[r]}`}
                              >
                                {r.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => handleTransferAdmin(u.id)}
                          disabled={transferring}
                          className="px-3 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {transferTarget === u.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            'Transfer'
                          )}
                        </button>
                      </div>
                    ))}
                  {filteredUsers.filter(u => u.id !== user?.id).length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No other users found</p>
                  )}
                </div>
              </div>
            )}

            {/* All Users & Roles Table */}
            <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-purple-500" />
                <h2 className="text-lg font-semibold text-white">All Users & Roles</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-2 text-gray-400 font-medium">User</th>
                      <th className="text-left py-2 text-gray-400 font-medium">Roles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-800/50">
                        <td className="py-3 text-white">
                          {u.full_name || 'Unnamed User'}
                          {u.id === user?.id && (
                            <span className="ml-2 text-[10px] text-purple-400">(you)</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1 flex-wrap">
                            {u.roles.map(r => (
                              <span
                                key={r}
                                className={`text-[10px] px-1.5 py-0.5 rounded border ${ROLE_COLORS[r]}`}
                              >
                                {r.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
