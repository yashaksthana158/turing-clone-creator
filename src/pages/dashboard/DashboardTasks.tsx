import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CreateTaskModal from '@/components/dashboard/CreateTaskModal';
import EditTaskModal from '@/components/dashboard/EditTaskModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { toast } from 'sonner';
import {
  ClipboardList,
  Plus,
  Play,
  Send,
  CheckCircle,
  XCircle,
  Trash2,
  Calendar,
  User,
  Users,
  Loader2,
} from 'lucide-react';

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

interface Task {
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

const STATUS_FILTERS: (TaskStatus | 'ALL')[] = ['ALL', 'PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED'];

const STATUS_COLORS: Record<TaskStatus, string> = {
  PENDING: 'bg-gray-600/20 text-gray-400',
  IN_PROGRESS: 'bg-blue-600/20 text-blue-400',
  SUBMITTED: 'bg-amber-600/20 text-amber-400',
  APPROVED: 'bg-green-600/20 text-green-400',
  REJECTED: 'bg-red-600/20 text-red-400',
};

export default function DashboardTasks() {
  const { user } = useAuth();
  const { isTeamLead, isPresident, hasMinRoleLevel } = useRole();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canCreate = isTeamLead();
  const canDelete = isTeamLead();

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);

    const { data: taskData, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load tasks');
      setLoading(false);
      return;
    }

    if (!taskData || taskData.length === 0) {
      setTasks([]);
      setLoading(false);
      return;
    }

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

    setTasks(
      taskData.map((t) => ({
        ...t,
        status: t.status as TaskStatus,
        team_name: teamMap[t.team_id] || 'Unknown',
        assignee_name: t.assigned_to ? profileMap[t.assigned_to] || 'Unknown' : undefined,
        assigner_name: t.assigned_by ? profileMap[t.assigned_by] || 'Unknown' : undefined,
      }))
    );
    setLoading(false);
  };

  const updateStatus = async (taskId: string, newStatus: TaskStatus) => {
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Task marked as ${newStatus.replace('_', ' ')}`);
    fetchTasks();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('tasks').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Task deleted');
    fetchTasks();
  };

  const filtered = filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isOverdue = (d: string | null, status: TaskStatus) => {
    if (!d || status === 'APPROVED') return false;
    return new Date(d) < new Date();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-['Oxanium']">Task Management</h1>
            <p className="text-gray-400 mt-1">Create, assign, and review tasks</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#9113ff] hover:bg-[#7b0fd9] text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={16} /> New Task
            </button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filter === s
                  ? 'bg-[#9113ff] text-white'
                  : 'bg-[#1c1c1c] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
              {s !== 'ALL' && (
                <span className="ml-1 opacity-60">
                  ({tasks.filter((t) => t.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-gray-500" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-12 text-center">
            <ClipboardList size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No tasks found</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((task) => (
              <div
                key={task.id}
                className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold text-sm truncate">{task.title}</h3>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${STATUS_COLORS[task.status]}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {task.team_name}
                      </span>
                      {task.assignee_name && (
                        <span className="flex items-center gap-1">
                          <User size={12} /> {task.assignee_name}
                        </span>
                      )}
                      {task.due_date && (
                        <span className={`flex items-center gap-1 ${isOverdue(task.due_date, task.status) ? 'text-red-400' : ''}`}>
                          <Calendar size={12} /> {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Assignee actions */}
                    {task.assigned_to === user?.id && task.status === 'PENDING' && (
                      <button
                        onClick={() => updateStatus(task.id, 'IN_PROGRESS')}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                      >
                        <Play size={12} /> Start
                      </button>
                    )}
                    {task.assigned_to === user?.id && task.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateStatus(task.id, 'SUBMITTED')}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 transition-colors"
                      >
                        <Send size={12} /> Submit
                      </button>
                    )}

                    {/* Lead actions */}
                    {canCreate && task.status === 'SUBMITTED' && (
                      <>
                        <button
                          onClick={() => updateStatus(task.id, 'APPROVED')}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
                        >
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button
                          onClick={() => updateStatus(task.id, 'PENDING')}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => setDeleteId(task.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={fetchTasks} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Task"
        description="This task will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </DashboardLayout>
  );
}
