import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Shield, ArrowRightLeft, Search, Loader2, Users, Check, X, Info, Plus, Trash2 } from 'lucide-react';
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

interface PermissionDef {
  id: string;
  name: string;
  description: string | null;
}

interface RolePermissionEntry {
  id: string;
  role_id: string;
  permission_id: string;
}

interface UserWithRoles {
  id: string;
  full_name: string | null;
  roles: AppRole[];
}

const ROLE_ORDER: AppRole[] = ['SUPER_ADMIN', 'PRESIDENT', 'TEAM_LEAD', 'TEAM_MEMBER', 'PARTICIPANT'];

const ROLE_COLORS: Record<AppRole, string> = {
  SUPER_ADMIN: 'bg-red-600/20 text-red-400 border-red-600/30',
  PRESIDENT: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
  TEAM_LEAD: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  TEAM_MEMBER: 'bg-green-600/20 text-green-400 border-green-600/30',
  PARTICIPANT: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
};

const ROLE_HEADER_COLORS: Record<AppRole, string> = {
  SUPER_ADMIN: 'text-red-400',
  PRESIDENT: 'text-purple-400',
  TEAM_LEAD: 'text-blue-400',
  TEAM_MEMBER: 'text-green-400',
  PARTICIPANT: 'text-gray-400',
};

export default function DashboardRoles() {
  const { user } = useAuth();
  const { isSuperAdmin } = useRole();
  const [roleDefs, setRoleDefs] = useState<RoleDef[]>([]);
  const [permissions, setPermissions] = useState<PermissionDef[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionEntry[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [transferTarget, setTransferTarget] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'users' | 'transfer'>('matrix');
  const [newPermName, setNewPermName] = useState('');
  const [newPermDesc, setNewPermDesc] = useState('');
  const [creatingPerm, setCreatingPerm] = useState(false);
  const [showAddPerm, setShowAddPerm] = useState(false);
  const [deletingPerm, setDeletingPerm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [rolesRes, permsRes, rpRes, profilesRes, urRes] = await Promise.all([
      supabase.from('roles').select('id, name, description'),
      supabase.from('permissions').select('id, name, description').order('name'),
      supabase.from('role_permissions').select('id, role_id, permission_id'),
      supabase.from('profiles').select('id, full_name'),
      supabase.from('user_roles').select('user_id, role_id, roles(name)'),
    ]);

    const sortedRoles = ((rolesRes.data as RoleDef[]) || []).sort(
      (a, b) => ROLE_ORDER.indexOf(a.name) - ROLE_ORDER.indexOf(b.name)
    );
    setRoleDefs(sortedRoles);
    setPermissions((permsRes.data as PermissionDef[]) || []);
    setRolePermissions((rpRes.data as RolePermissionEntry[]) || []);

    const userMap = new Map<string, UserWithRoles>();
    for (const p of profilesRes.data || []) {
      userMap.set(p.id, { id: p.id, full_name: p.full_name, roles: [] });
    }
    for (const ur of (urRes.data as any[]) || []) {
      const u = userMap.get(ur.user_id);
      if (u && ur.roles?.name) u.roles.push(ur.roles.name);
    }
    setUsers(Array.from(userMap.values()));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hasPermission = (roleId: string, permissionId: string) =>
    rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permissionId);

  const handleTogglePermission = async (roleId: string, permissionId: string) => {
    if (!isSuperAdmin()) return;
    const key = `${roleId}-${permissionId}`;
    setToggling(key);

    const existing = rolePermissions.find(rp => rp.role_id === roleId && rp.permission_id === permissionId);

    if (existing) {
      const { error } = await supabase.from('role_permissions').delete().eq('id', existing.id);
      if (error) {
        toast.error('Failed to remove permission');
      } else {
        setRolePermissions(prev => prev.filter(rp => rp.id !== existing.id));
        toast.success('Permission removed');
      }
    } else {
      const { data, error } = await supabase
        .from('role_permissions')
        .insert({ role_id: roleId, permission_id: permissionId })
        .select('id, role_id, permission_id')
        .single();
      if (error) {
        toast.error('Failed to add permission');
      } else if (data) {
        setRolePermissions(prev => [...prev, data as RolePermissionEntry]);
        toast.success('Permission added');
      }
    }
    setToggling(null);
  };

  const handleTransferAdmin = async (targetUserId: string) => {
    if (!user || !isSuperAdmin()) return;
    const targetUser = users.find(u => u.id === targetUserId);
    if (!confirm(`Transfer Super Admin to ${targetUser?.full_name || 'this user'}? You will lose your Super Admin role.`)) return;

    setTransferring(true);
    setTransferTarget(targetUserId);

    try {
      const adminRole = roleDefs.find(r => r.name === 'SUPER_ADMIN');
      if (!adminRole) throw new Error('SUPER_ADMIN role not found');

      const { error: assignError } = await supabase
        .from('user_roles')
        .insert({ user_id: targetUserId, role_id: adminRole.id, assigned_by: user.id });

      if (assignError && assignError.code !== '23505') throw assignError;

      const { error: removeError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id)
        .eq('role_id', adminRole.id);

      if (removeError) throw removeError;

      toast.success('Super Admin transferred! Redirecting...');
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed');
    }
    setTransferring(false);
    setTransferTarget(null);
  };

  const handleCreatePermission = async () => {
    if (!isSuperAdmin() || !newPermName.trim()) return;
    setCreatingPerm(true);
    const slug = newPermName.trim().toLowerCase().replace(/\s+/g, '_');
    const { data, error } = await supabase
      .from('permissions')
      .insert({ name: slug, description: newPermDesc.trim() || null })
      .select('id, name, description')
      .single();
    if (error) {
      toast.error(error.code === '23505' ? 'Permission already exists' : 'Failed to create permission');
    } else if (data) {
      setPermissions(prev => [...prev, data as PermissionDef].sort((a, b) => a.name.localeCompare(b.name)));
      setNewPermName('');
      setNewPermDesc('');
      setShowAddPerm(false);
      toast.success('Permission created');
    }
    setCreatingPerm(false);
  };

  const handleDeletePermission = async (permId: string) => {
    if (!isSuperAdmin()) return;
    const perm = permissions.find(p => p.id === permId);
    if (!confirm(`Delete permission "${perm?.name}"? This will also remove it from all roles.`)) return;
    setDeletingPerm(permId);
    const { error } = await supabase.from('permissions').delete().eq('id', permId);
    if (error) {
      toast.error('Failed to delete permission');
    } else {
      setPermissions(prev => prev.filter(p => p.id !== permId));
      setRolePermissions(prev => prev.filter(rp => rp.permission_id !== permId));
      toast.success('Permission deleted');
    }
    setDeletingPerm(null);
  };

  const filteredUsers = users.filter(u =>
    (u.full_name || u.id).toLowerCase().includes(search.toLowerCase())
  );

  const roleUserCounts = roleDefs.map(r => ({
    ...r,
    count: users.filter(u => u.roles.includes(r.name)).length,
  }));

  const formatPermName = (name: string) =>
    name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const tabs = [
    { id: 'matrix' as const, label: 'Permission Matrix', icon: Shield },
    { id: 'users' as const, label: 'Users & Roles', icon: Users },
    ...(isSuperAdmin() ? [{ id: 'transfer' as const, label: 'Transfer Admin', icon: ArrowRightLeft }] : []),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Oxanium']">Roles & Permissions</h1>
          <p className="text-gray-400 mt-1">Manage role permissions and transfer admin access</p>
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
                  <div className="text-2xl font-bold font-['Oxanium']">{r.count}</div>
                  <div className="text-xs mt-1 opacity-80">{r.name.replace(/_/g, ' ')}</div>
                  {r.description && <div className="text-[10px] mt-0.5 opacity-60">{r.description}</div>}
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-800 pb-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#1c1c1c] text-white border border-gray-800 border-b-[#1c1c1c] -mb-px'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Permission Matrix Tab */}
            {activeTab === 'matrix' && (
              <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={20} className="text-purple-500" />
                  <h2 className="text-lg font-semibold text-white">Permission Matrix</h2>
                  {!isSuperAdmin() && (
                    <span className="text-xs text-gray-500 ml-2">(read-only)</span>
                  )}
                  <div className="ml-auto">
                    {isSuperAdmin() && !showAddPerm && (
                      <button
                        onClick={() => setShowAddPerm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-600/30 rounded-lg transition-colors"
                      >
                        <Plus size={14} /> Add Permission
                      </button>
                    )}
                  </div>
                </div>

                {showAddPerm && isSuperAdmin() && (
                  <div className="flex items-end gap-3 p-3 bg-black/30 border border-gray-700 rounded-lg">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 mb-1 block">Name</label>
                      <input
                        type="text"
                        value={newPermName}
                        onChange={e => setNewPermName(e.target.value)}
                        placeholder="e.g. manage_events"
                        className="w-full px-3 py-1.5 text-sm bg-black border border-gray-700 rounded text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 mb-1 block">Description (optional)</label>
                      <input
                        type="text"
                        value={newPermDesc}
                        onChange={e => setNewPermDesc(e.target.value)}
                        placeholder="What this permission controls"
                        className="w-full px-3 py-1.5 text-sm bg-black border border-gray-700 rounded text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <button
                      onClick={handleCreatePermission}
                      disabled={creatingPerm || !newPermName.trim()}
                      className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:opacity-50"
                    >
                      {creatingPerm ? <Loader2 size={14} className="animate-spin" /> : 'Create'}
                    </button>
                    <button
                      onClick={() => { setShowAddPerm(false); setNewPermName(''); setNewPermDesc(''); }}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left py-3 px-3 text-gray-400 font-medium sticky left-0 bg-[#1c1c1c] min-w-[200px] border-b border-gray-700">
                          Permission
                        </th>
                        {roleDefs.map(role => (
                          <th
                            key={role.id}
                            className={`py-3 px-2 text-center font-medium border-b border-gray-700 min-w-[100px] ${ROLE_HEADER_COLORS[role.name]}`}
                          >
                            <div className="text-xs leading-tight">{role.name.replace(/_/g, ' ')}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.map((perm, idx) => (
                        <tr
                          key={perm.id}
                          className={`${idx % 2 === 0 ? 'bg-black/20' : ''} hover:bg-white/5 transition-colors`}
                        >
                          <td className="py-2.5 px-3 sticky left-0 bg-[#1c1c1c]" style={{ zIndex: 1 }}>
                            <div className="flex items-center gap-2">
                              <span className="text-white text-xs font-medium">{formatPermName(perm.name)}</span>
                              {perm.description && (
                                <span className="group relative">
                                  <Info size={12} className="text-gray-600 cursor-help" />
                                  <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-900 text-gray-300 text-[10px] px-2 py-1 rounded whitespace-nowrap border border-gray-700 z-10">
                                    {perm.description}
                                  </span>
                                </span>
                              )}
                              {isSuperAdmin() && (
                                <button
                                  onClick={() => handleDeletePermission(perm.id)}
                                  disabled={deletingPerm === perm.id}
                                  className="ml-auto text-gray-700 hover:text-red-400 transition-colors disabled:opacity-50"
                                  title="Delete permission"
                                >
                                  {deletingPerm === perm.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                </button>
                              )}
                            </div>
                          </td>
                          {roleDefs.map(role => {
                            const enabled = hasPermission(role.id, perm.id);
                            const isToggling = toggling === `${role.id}-${perm.id}`;
                            return (
                              <td key={role.id} className="py-2.5 px-2 text-center">
                                <button
                                  onClick={() => handleTogglePermission(role.id, perm.id)}
                                  disabled={!isSuperAdmin() || isToggling}
                                  className={`w-8 h-8 rounded-md border inline-flex items-center justify-center transition-all ${
                                    enabled
                                      ? 'bg-purple-600/30 border-purple-500/50 text-purple-400 hover:bg-purple-600/50'
                                      : 'bg-gray-800/50 border-gray-700/50 text-gray-700 hover:border-gray-600 hover:text-gray-500'
                                  } ${!isSuperAdmin() ? 'cursor-default' : 'cursor-pointer'} disabled:opacity-50`}
                                >
                                  {isToggling ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : enabled ? (
                                    <Check size={14} />
                                  ) : (
                                    <X size={14} />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-4 pt-2 text-[10px] text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded bg-purple-600/30 border border-purple-500/50 inline-flex items-center justify-center"><Check size={10} className="text-purple-400" /></span>
                    Granted
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded bg-gray-800/50 border border-gray-700/50 inline-flex items-center justify-center"><X size={10} className="text-gray-700" /></span>
                    Not granted
                  </span>
                </div>
              </div>
            )}

            {/* Users & Roles Tab */}
            {activeTab === 'users' && (
              <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-purple-500" />
                  <h2 className="text-lg font-semibold text-white">All Users & Roles</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 text-gray-400 font-medium">User</th>
                        <th className="text-left py-2 text-gray-400 font-medium">Roles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-gray-800/50 hover:bg-white/5">
                          <td className="py-3 text-white">
                            {u.full_name || 'Unnamed User'}
                            {u.id === user?.id && (
                              <span className="ml-2 text-[10px] text-purple-400">(you)</span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1 flex-wrap">
                              {u.roles.length > 0 ? u.roles.map(r => (
                                <span key={r} className={`text-[10px] px-1.5 py-0.5 rounded border ${ROLE_COLORS[r]}`}>
                                  {r.replace(/_/g, ' ')}
                                </span>
                              )) : (
                                <span className="text-gray-600 text-xs">No roles</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Transfer Admin Tab */}
            {activeTab === 'transfer' && isSuperAdmin() && (
              <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft size={20} className="text-red-400" />
                  <h2 className="text-lg font-semibold text-white">Transfer Super Admin</h2>
                </div>
                <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-3 text-sm text-red-300">
                  <strong>Warning:</strong> This will remove your Super Admin role and assign it to the selected user. This action cannot be undone — the new admin will need to transfer it back.
                </div>

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

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {filteredUsers
                    .filter(u => u.id !== user?.id)
                    .map(u => (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-black/50 border border-gray-800 rounded-lg">
                        <div>
                          <div className="text-white text-sm font-medium">{u.full_name || 'Unnamed User'}</div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {u.roles.map(r => (
                              <span key={r} className={`text-[10px] px-1.5 py-0.5 rounded border ${ROLE_COLORS[r]}`}>
                                {r.replace(/_/g, ' ')}
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
