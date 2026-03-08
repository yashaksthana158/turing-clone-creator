import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Plus, Trash2, Users as UsersIcon, UserPlus, X } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  member_count?: number;
}

interface TeamMember {
  id: string;
  user_id: string;
  position: string;
  joined_at: string;
  profiles: { full_name: string | null } | null;
}

export default function ManageTeams() {
  const { user, loading: authLoading } = useAuth();
  const { hasMinRoleLevel } = useRole();
  const navigate = useNavigate();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Add member form state
  const [showAddMember, setShowAddMember] = useState(false);
  const [allUsers, setAllUsers] = useState<{ id: string; full_name: string | null }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<'MEMBER' | 'LEAD'>('MEMBER');

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return; }
    if (!authLoading && !hasMinRoleLevel(3)) { navigate('/unauthorized'); return; }
    if (user) fetchTeams();
  }, [user, authLoading]);

  const fetchTeams = async () => {
    const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      // Fetch member counts
      const teamsWithCounts = await Promise.all(
        data.map(async (t) => {
          const { count } = await supabase
            .from('team_members')
            .select('id', { count: 'exact', head: true })
            .eq('team_id', t.id);
          return { ...t, member_count: count || 0 };
        })
      );
      setTeams(teamsWithCounts);
    }
    setLoading(false);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTeam.name.trim();
    if (!name || name.length > 100) { toast.error('Name required (max 100 chars)'); return; }

    setCreating(true);
    const { error } = await supabase.from('teams').insert({
      name,
      description: newTeam.description.trim() || null,
      created_by: user!.id,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Team created!');
      setNewTeam({ name: '', description: '' });
      setShowCreateForm(false);
      fetchTeams();
    }
    setCreating(false);
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Delete this team? All members will be removed.')) return;
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Team deleted'); fetchTeams(); if (selectedTeam === id) setSelectedTeam(null); }
  };

  const loadMembers = async (teamId: string) => {
    setSelectedTeam(teamId);
    setLoadingMembers(true);
    const { data, error } = await supabase
      .from('team_members')
      .select('id, user_id, position, joined_at, profiles(full_name)')
      .eq('team_id', teamId)
      .order('position', { ascending: true });
    if (!error) setMembers((data as unknown as TeamMember[]) || []);
    setLoadingMembers(false);
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name');
    if (data) setAllUsers(data);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedTeam) return;

    const { error } = await supabase.from('team_members').insert({
      team_id: selectedTeam,
      user_id: selectedUserId,
      position: selectedPosition,
    });
    if (error) {
      if (error.code === '23505') toast.error('User is already a team member');
      else toast.error(error.message);
    } else {
      toast.success('Member added!');
      setShowAddMember(false);
      setSelectedUserId('');
      loadMembers(selectedTeam);
      fetchTeams();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;
    const { error } = await supabase.from('team_members').delete().eq('id', memberId);
    if (error) toast.error(error.message);
    else { toast.success('Member removed'); if (selectedTeam) { loadMembers(selectedTeam); fetchTeams(); } }
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

  const selectedTeamData = teams.find((t) => t.id === selectedTeam);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-['Oxanium']">Team Management</h1>
            <p className="text-gray-400 mt-1">Create and manage society teams</p>
          </div>
          {hasMinRoleLevel(4) && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#9113ff] hover:bg-[#7c0fd9] text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus size={18} /> New Team
            </button>
          )}
        </div>

        {/* Create team form */}
        {showCreateForm && (
          <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Create New Team</h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Team Name</label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  maxLength={100}
                  required
                  className="w-full px-4 py-2.5 bg-black border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#9113ff] transition-colors"
                  placeholder="e.g. Design Team"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  maxLength={500}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-black border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#9113ff] transition-colors resize-none"
                  placeholder="Team description..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 bg-[#9113ff] hover:bg-[#7c0fd9] text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Team'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2.5 border border-gray-600 text-gray-300 hover:bg-white/5 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams list */}
          <div className="lg:col-span-1 space-y-3">
            {teams.length === 0 ? (
              <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-8 text-center">
                <UsersIcon size={40} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No teams yet</p>
              </div>
            ) : (
              teams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => loadMembers(team.id)}
                  className={`bg-[#1c1c1c] border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedTeam === team.id
                      ? 'border-[#9113ff] bg-[#9113ff]/5'
                      : 'border-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold">{team.name}</h3>
                      <p className="text-gray-500 text-sm mt-0.5">
                        {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {hasMinRoleLevel(5) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id); }}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  {team.description && (
                    <p className="text-gray-400 text-sm mt-2 line-clamp-2">{team.description}</p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Team details / members */}
          <div className="lg:col-span-2">
            {!selectedTeam ? (
              <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-12 text-center">
                <UsersIcon size={48} className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Select a team to view members</p>
              </div>
            ) : (
              <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{selectedTeamData?.name}</h2>
                    <p className="text-gray-400 text-sm">{selectedTeamData?.description || 'No description'}</p>
                  </div>
                  <button
                    onClick={() => { setShowAddMember(true); fetchAllUsers(); }}
                    className="flex items-center gap-2 px-3 py-2 bg-[#9113ff] hover:bg-[#7c0fd9] text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <UserPlus size={16} /> Add Member
                  </button>
                </div>

                {/* Add member form */}
                {showAddMember && (
                  <div className="bg-black/50 border border-gray-700 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white text-sm font-medium">Add Member</h3>
                      <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-white">
                        <X size={16} />
                      </button>
                    </div>
                    <form onSubmit={handleAddMember} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1">User</label>
                        <select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-black border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#9113ff]"
                        >
                          <option value="">Select user...</option>
                          {allUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.full_name || u.id.slice(0, 8)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Position</label>
                        <select
                          value={selectedPosition}
                          onChange={(e) => setSelectedPosition(e.target.value as 'MEMBER' | 'LEAD')}
                          className="px-3 py-2 bg-black border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#9113ff]"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="LEAD">Lead</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#9113ff] hover:bg-[#7c0fd9] text-white rounded-lg text-sm font-medium"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                )}

                {/* Members list */}
                {loadingMembers ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9113ff]"></div>
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No members in this team</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-4 py-3 bg-black/30 rounded-lg border border-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#9113ff]/20 flex items-center justify-center text-sm text-[#9113ff] font-bold uppercase">
                            {(m.profiles?.full_name || '?')[0]}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {m.profiles?.full_name || 'Unnamed User'}
                            </p>
                            <p className="text-gray-500 text-xs">{m.user_id.slice(0, 8)}...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full border ${
                              m.position === 'LEAD'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }`}
                          >
                            {m.position}
                          </span>
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
