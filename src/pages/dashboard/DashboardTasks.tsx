import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CreateTaskModal from '@/components/dashboard/CreateTaskModal';
import EditTaskModal from '@/components/dashboard/EditTaskModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useTasks, useUpdateTaskStatus, useDeleteTask, type Task, type TaskStatus } from '@/hooks/queries';
import {
  ClipboardList, Plus, Play, Send, CheckCircle, XCircle, Trash2,
  Calendar, User, Users, Loader2, Pencil, Search,
} from 'lucide-react';

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
  const { isTeamLead } = useRole();
  const { data: tasks = [], isLoading } = useTasks();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canCreate = isTeamLead();
  const canDelete = isTeamLead();

  const filtered = tasks
    .filter((t) => filter === 'ALL' || t.status === filter)
    .filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()));

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

        {/* Summary cards */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED'] as TaskStatus[]).map((s) => {
              const count = tasks.filter((t) => t.status === s).length;
              const icons: Record<TaskStatus, React.ReactNode> = {
                PENDING: <ClipboardList size={16} />,
                IN_PROGRESS: <Play size={16} />,
                SUBMITTED: <Send size={16} />,
                APPROVED: <CheckCircle size={16} />,
                REJECTED: <XCircle size={16} />,
              };
              return (
                <button
                  key={s}
                  onClick={() => setFilter(filter === s ? 'ALL' : s)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    filter === s ? 'border-[#9113ff]/50 bg-[#9113ff]/10' : 'border-gray-800 bg-[#1c1c1c] hover:border-gray-700'
                  }`}
                >
                  <div className={`flex items-center gap-2 text-xs font-medium uppercase ${STATUS_COLORS[s].split(' ').find((c: string) => c.startsWith('text-'))}`}>
                    {icons[s]} {s.replace('_', ' ')}
                  </div>
                  <p className="text-2xl font-bold text-white mt-1">{count}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Search + Status filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="w-full bg-[#1c1c1c] border border-gray-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#9113ff]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  filter === s ? 'bg-[#9113ff] text-white' : 'bg-[#1c1c1c] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {s === 'ALL' ? 'All' : s.replace('_', ' ')}
                {s !== 'ALL' && (
                  <span className="ml-1 opacity-60">({tasks.filter((t) => t.status === s).length})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Task list */}
        {isLoading ? (
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
              <div key={task.id} className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
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
                      <span className="flex items-center gap-1"><Users size={12} /> {task.team_name}</span>
                      {task.assignee_name && (
                        <span className="flex items-center gap-1"><User size={12} /> {task.assignee_name}</span>
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
                    {task.assigned_to === user?.id && task.status === 'PENDING' && (
                      <button
                        onClick={() => updateStatus.mutate({ taskId: task.id, newStatus: 'IN_PROGRESS' })}
                        disabled={updateStatus.isPending}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors disabled:opacity-50"
                      >
                        <Play size={12} /> Start
                      </button>
                    )}
                    {task.assigned_to === user?.id && task.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateStatus.mutate({ taskId: task.id, newStatus: 'SUBMITTED' })}
                        disabled={updateStatus.isPending}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 transition-colors disabled:opacity-50"
                      >
                        <Send size={12} /> Submit
                      </button>
                    )}
                    {canCreate && task.status === 'SUBMITTED' && (
                      <>
                        <button
                          onClick={() => updateStatus.mutate({ taskId: task.id, newStatus: 'APPROVED' })}
                          disabled={updateStatus.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button
                          onClick={() => updateStatus.mutate({ taskId: task.id, newStatus: 'PENDING' })}
                          disabled={updateStatus.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    )}
                    {canCreate && (
                      <button
                        onClick={() => setEditTask(task)}
                        className="p-1.5 text-gray-500 hover:text-[#9113ff] transition-colors rounded-lg hover:bg-[#9113ff]/10"
                      >
                        <Pencil size={14} />
                      </button>
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

      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => {}} />
      <EditTaskModal open={!!editTask} task={editTask} onClose={() => setEditTask(null)} onUpdated={() => {}} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Task"
        description="This task will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { if (deleteId) { deleteTask.mutate(deleteId); setDeleteId(null); } }}
        loading={deleteTask.isPending}
      />
    </DashboardLayout>
  );
}
