import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Plus, Trash2, Users as UsersIcon, UserPlus, X, Loader2 } from 'lucide-react';
import {
  useTeams, useTeamMembers, useCreateTeam, useDeleteTeam,
  useAddTeamMember, useRemoveTeamMember,
} from '@/hooks/queries';
import { useQuery } from '@tanstack/react-query';

export default function ManageTeams() {
  const { user } = useAuth();
  const { hasMinRoleLevel } = useRole();
  const navigate = useNavigate();

  const { data: teams = [], isLoading } = useTeams();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<'MEMBER' | 'LEAD'>('MEMBER');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string; description: string; confirmLabel: string; onConfirm: () => void;
  }>({ title: '', description: '', confirmLabel: 'Confirm', onConfirm: () => {} });

  const { data: members = [], isLoading: loadingMembers } = useTeamMembers(selectedTeam);

  // Fetch all users only when add member panel is open
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, full_name');
      return data || [];
    },
    enabled: showAddMember,
    staleTime: 60000,
  });

  const openConfirm = (config: typeof confirmConfig) => {
    setConfirmConfig(config);
    setConfirmOpen(true);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTeam.name.trim();
    if (!name || name.length > 100) { toast.error('Name required (max 100 chars)'); return; }
    await createTeam.mutateAsync({ name, description: newTeam.description.trim() || null });
    setNewTeam({ name: '', description: '' });
    setShowCreateForm(false);
  };

  const handleDeleteTeam = (id: string) => {
    openConfirm({
      title: 'Delete Team',
      description: 'Delete this team? All members will be removed. This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setConfirmOpen(false);
        await deleteTeam.mutateAsync(id);
        if (selectedTeam === id) setSelectedTeam(null);
      },
    });
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedTeam) return;
    await addMember.mutateAsync({ teamId: selectedTeam, userId: selectedUserId, position: selectedPosition });
    setShowAddMember(false);
    setSelectedUserId('');
  };

  const handleRemoveMember = (memberId: string) => {
    openConfirm({
      title: 'Remove Member',
      description: 'Remove this member from the team?',
      confirmLabel: 'Remove',
      onConfirm: async () => {
        setConfirmOpen(false);
        if (selectedTeam) await removeMember.mutateAsync({ memberId, teamId: selectedTeam });
      },
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9113ff]" />
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
                  disabled={createTeam.isPending}
                  className="px-6 py-2.5 bg-[#9113ff] hover:bg-[#7c0fd9] text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {createTeam.isPending ? 'Creating...' : 'Create Team'}
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)} className="px-6 py-2.5 border border-gray-600 text-gray-300 hover:bg-white/5 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  onClick={() => setSelectedTeam(team.id)}
                  className={`bg-[#1c1c1c] border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedTeam === team.id ? 'border-[#9113ff] bg-[#9113ff]/5' : 'border-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold">{team.name}</h3>
                      <p className="text-gray-500 text-sm mt-0.5">{team.member_count} member{team.member_count !== 1 ? 's' : ''}</p>
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
                  {team.description && <p className="text-gray-400 text-sm mt-2 line-clamp-2">{team.description}</p>}
                </div>
              ))
            )}
          </div>

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
                    onClick={() => setShowAddMember(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#9113ff] hover:bg-[#7c0fd9] text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <UserPlus size={16} /> Add Member
                  </button>
                </div>

                {showAddMember && (
                  <div className="bg-black/50 border border-gray-700 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white text-sm font-medium">Add Member</h3>
                      <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-white"><X size={16} /></button>
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
                            <option key={u.id} value={u.id}>{u.full_name || u.id.slice(0, 8)}</option>
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
                        disabled={addMember.isPending}
                        className="px-4 py-2 bg-[#9113ff] hover:bg-[#7c0fd9] text-white rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {addMember.isPending ? 'Adding...' : 'Add'}
                      </button>
                    </form>
                  </div>
                )}

                {loadingMembers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-[#9113ff]" size={32} />
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No members in this team</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between px-4 py-3 bg-black/30 rounded-lg border border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#9113ff]/20 flex items-center justify-center text-sm text-[#9113ff] font-bold uppercase">
                            {(m.profiles?.full_name || '?')[0]}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{m.profiles?.full_name || 'Unnamed User'}</p>
                            <p className="text-gray-500 text-xs">{m.user_id.slice(0, 8)}...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full border ${
                            m.position === 'LEAD' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }`}>
                            {m.position}
                          </span>
                          <button onClick={() => handleRemoveMember(m.id)} className="text-gray-500 hover:text-red-400 transition-colors">
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

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmLabel={confirmConfig.confirmLabel}
        variant="danger"
        onConfirm={confirmConfig.onConfirm}
      />
    </DashboardLayout>
  );
}
