import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface Team {
  id: string;
  name: string;
}

interface Member {
  user_id: string;
  full_name: string | null;
}

export default function CreateTaskModal({ open, onClose, onCreated }: CreateTaskModalProps) {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [teamId, setTeamId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTeams();
      setTeamId('');
      setAssignedTo('');
      setTitle('');
      setDescription('');
      setDueDate('');
      setMembers([]);
    }
  }, [open]);

  useEffect(() => {
    if (teamId) fetchMembers(teamId);
    else setMembers([]);
    setAssignedTo('');
  }, [teamId]);

  const fetchTeams = async () => {
    const { data } = await supabase.from('teams').select('id, name').order('name');
    setTeams(data || []);
  };

  const fetchMembers = async (tid: string) => {
    const { data } = await supabase
      .from('team_members')
      .select('user_id, profiles:user_id(full_name)')
      .eq('team_id', tid);

    if (data) {
      setMembers(
        data.map((m: any) => ({
          user_id: m.user_id,
          full_name: m.profiles?.full_name || 'Unknown',
        }))
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !teamId) {
      toast.error('Title and team are required');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('tasks').insert({
      title: title.trim(),
      description: description.trim() || null,
      team_id: teamId,
      assigned_to: assignedTo || null,
      assigned_by: user!.id,
      due_date: dueDate || null,
      status: 'PENDING',
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Task created');
    onCreated();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-gray-800 rounded-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold text-white font-['Oxanium'] mb-4">Create Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#9113ff]"
              placeholder="Task title"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#1c1c1c] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#9113ff] resize-none"
              placeholder="Optional description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Team *</label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#9113ff]"
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Assign to</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#9113ff]"
                disabled={!teamId}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>{m.full_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Due date</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#9113ff]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg border border-gray-700 text-gray-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-[#9113ff] hover:bg-[#7b0fd9] text-white font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
