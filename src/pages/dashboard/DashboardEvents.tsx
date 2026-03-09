import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CreateEventModal from '@/components/dashboard/CreateEventModal';
import EditEventModal from '@/components/dashboard/EditEventModal';
import EventApprovalActions from '@/components/dashboard/EventApprovalActions';
import AttendanceModal from '@/components/dashboard/AttendanceModal';
import EventRegistrationsView from '@/components/dashboard/EventRegistrationsView';
import { Calendar, Ticket, MapPin, Clock, Users, Plus, Filter, Pencil, CheckSquare, Square, Lock, Trash2, EyeOff, Star, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { useMyRegistrations, useEvents, useEventApprovals, useCancelRegistration, type Event, type Approval } from '@/hooks/queries';
import { useQueryClient } from '@tanstack/react-query';

const STATUS_FILTERS = ['ALL', 'DRAFT', 'PENDING_LEAD', 'PENDING_PRESIDENT', 'APPROVED', 'PUBLISHED', 'CLOSED'];

export default function DashboardEvents() {
  const { user } = useAuth();
  const { hasMinRoleLevel } = useRole();
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading: loadingRegs } = useMyRegistrations();
  const { data: events = [], isLoading: loadingEvents } = useEvents();
  const eventIds = events.map(e => e.id);
  const { data: approvals = [] } = useEventApprovals(eventIds);
  const cancelRegistration = useCancelRegistration();

  const loading = loadingRegs || loadingEvents;

  const [activeView, setActiveView] = useState<'my' | 'manage' | 'registrations'>('my');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [attendanceEvent, setAttendanceEvent] = useState<Event | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const refetchAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['event-approvals'] });
  }, [queryClient]);

  const getApprovalForEvent = (eventId: string): Approval | null =>
    approvals.find(a => a.item_id === eventId) || null;

  const filteredEvents = statusFilter === 'ALL' ? events : events.filter(e => e.status === statusFilter);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === filteredEvents.length ? new Set() : new Set(filteredEvents.map(e => e.id)));
  };

  const selectedEvents = filteredEvents.filter(e => selectedIds.has(e.id));

  const bulkClose = async () => {
    const ids = selectedEvents.filter(e => e.status === 'PUBLISHED').map(e => e.id);
    if (ids.length === 0) { toast.error('No published events selected'); return; }
    setBulkLoading(true);
    const { error } = await supabase.from('events').update({ status: 'CLOSED' }).in('id', ids);
    if (error) toast.error('Failed to close events');
    else { toast.success(`${ids.length} event(s) closed`); setSelectedIds(new Set()); refetchAll(); }
    setBulkLoading(false);
  };

  const bulkUnpublish = async () => {
    const ids = selectedEvents.filter(e => e.status === 'PUBLISHED').map(e => e.id);
    if (ids.length === 0) { toast.error('No published events selected'); return; }
    setBulkLoading(true);
    const { error } = await supabase.from('events').update({ status: 'APPROVED' }).in('id', ids);
    if (error) toast.error('Failed');
    else { toast.success(`${ids.length} event(s) unpublished`); setSelectedIds(new Set()); refetchAll(); }
    setBulkLoading(false);
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('events').delete().in('id', ids);
    if (error) toast.error('Failed to delete');
    else { toast.success(`${ids.length} event(s) deleted`); setSelectedIds(new Set()); refetchAll(); }
    setBulkLoading(false);
  };

  const bulkClosePast = async () => {
    const now = new Date().toISOString();
    const ids = filteredEvents.filter(e => e.status === 'PUBLISHED' && e.event_date && e.event_date < now).map(e => e.id);
    if (ids.length === 0) { toast.info('No past published events'); return; }
    setBulkLoading(true);
    const { error } = await supabase.from('events').update({ status: 'CLOSED' }).in('id', ids);
    if (error) toast.error('Failed');
    else { toast.success(`${ids.length} past event(s) closed`); refetchAll(); }
    setBulkLoading(false);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: 'bg-gray-600/20 text-gray-400',
      PENDING_LEAD: 'bg-amber-600/20 text-amber-400',
      PENDING_PRESIDENT: 'bg-orange-600/20 text-orange-400',
      APPROVED: 'bg-blue-600/20 text-blue-400',
      PUBLISHED: 'bg-green-600/20 text-green-400',
      CLOSED: 'bg-red-600/20 text-red-400',
    };
    return map[status] || 'bg-gray-600/20 text-gray-400';
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA';

  const tabs = [
    { key: 'my', label: 'My Events', minLevel: 1 },
    { key: 'manage', label: 'Manage Events', minLevel: 2 },
    { key: 'registrations', label: 'Registrations', minLevel: 3 },
  ] as const;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-['Oxanium']">Events</h1>
            <p className="text-gray-400 mt-1">Manage and track events</p>
          </div>
          {hasMinRoleLevel(2) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#9113ff] hover:bg-[#7c0fd9] text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus size={18} /> Create Event
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1c1c1c] border border-gray-800 rounded-lg p-1 w-fit">
          {tabs.filter(t => hasMinRoleLevel(t.minLevel)).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveView(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === t.key ? 'bg-[#9113ff] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#9113ff]" />
          </div>
        ) : (
          <>
            {/* My Events */}
            {activeView === 'my' && (
              <div className="space-y-3">
                {registrations.length === 0 ? (
                  <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-12 text-center">
                    <Ticket size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No registrations yet</p>
                  </div>
                ) : (
                  registrations.map(reg => (
                    <div key={reg.id} className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-white font-medium truncate">{reg.events?.title || 'Unknown Event'}</h3>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                            {reg.events?.event_date && <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(reg.events.event_date)}</span>}
                            {reg.events?.venue && <span className="flex items-center gap-1"><MapPin size={12} />{reg.events.venue}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${statusBadge(reg.status)}`}>
                            {reg.status}
                          </span>
                          {reg.status === 'REGISTERED' && (
                            <button
                              onClick={() => cancelRegistration.mutate(reg.id)}
                              className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Manage Events */}
            {activeView === 'manage' && hasMinRoleLevel(2) && (
              <div className="space-y-4">
                {/* Status filter + bulk bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {STATUS_FILTERS.map(s => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                          statusFilter === s ? 'bg-[#9113ff] text-white' : 'bg-[#1c1c1c] text-gray-400 hover:text-white border border-gray-800'
                        }`}
                      >
                        {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={bulkClosePast} disabled={bulkLoading} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1c1c1c] border border-gray-800 text-gray-400 hover:text-white disabled:opacity-50">
                      Close Past
                    </button>
                  </div>
                </div>

                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-[#9113ff]/10 border border-[#9113ff]/30 rounded-lg">
                    <span className="text-sm text-white">{selectedIds.size} selected</span>
                    <button onClick={bulkClose} disabled={bulkLoading} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#1c1c1c] border border-gray-700 rounded-lg text-gray-300 hover:text-white disabled:opacity-50">
                      <Lock size={12} /> Close
                    </button>
                    <button onClick={bulkUnpublish} disabled={bulkLoading} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#1c1c1c] border border-gray-700 rounded-lg text-gray-300 hover:text-white disabled:opacity-50">
                      <EyeOff size={12} /> Unpublish
                    </button>
                    {hasMinRoleLevel(4) && (
                      <button onClick={bulkDelete} disabled={bulkLoading} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600/10 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 disabled:opacity-50">
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                    <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-gray-500 hover:text-white text-xs">Clear</button>
                  </div>
                )}

                {filteredEvents.length === 0 ? (
                  <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-12 text-center">
                    <Calendar size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No events found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                      <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white">
                        {selectedIds.size === filteredEvents.length ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                      <span className="text-xs text-gray-500">{filteredEvents.length} event(s)</span>
                    </div>
                    {filteredEvents.map(event => (
                      <div key={event.id} className={`bg-[#1c1c1c] border rounded-lg p-4 transition-colors ${selectedIds.has(event.id) ? 'border-[#9113ff]/50' : 'border-gray-800 hover:border-gray-700'}`}>
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleSelect(event.id)} className="mt-0.5 text-gray-400 hover:text-white shrink-0">
                            {selectedIds.has(event.id) ? <CheckSquare size={16} className="text-[#9113ff]" /> : <Square size={16} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-white font-medium">{event.title}</h3>
                              {event.is_featured && <Star size={12} className="text-amber-400" />}
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${statusBadge(event.status)}`}>
                                {event.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                              {event.event_date && <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(event.event_date)}</span>}
                              {event.venue && <span className="flex items-center gap-1"><MapPin size={12} />{event.venue}</span>}
                              {event.max_participants && <span className="flex items-center gap-1"><Users size={12} />{event.max_participants} max</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => setEditingEvent(event)} className="p-1.5 text-gray-500 hover:text-[#9113ff] transition-colors">
                              <Pencil size={14} />
                            </button>
                            {event.status === 'PUBLISHED' && (
                              <button onClick={() => setAttendanceEvent(event)} title="Mark Attendance" className="p-1.5 text-gray-500 hover:text-emerald-400 transition-colors">
                                <ClipboardList size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 pl-7">
                          <EventApprovalActions
                            eventId={event.id}
                            eventStatus={event.status}
                            eventCreatedBy={event.created_by}
                            approval={getApprovalForEvent(event.id)}
                            onUpdated={refetchAll}
                            onMarkAttendance={() => setAttendanceEvent(event)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Registrations */}
            {activeView === 'registrations' && hasMinRoleLevel(3) && (
              <EventRegistrationsView />
            )}
          </>
        )}
      </div>

      <CreateEventModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={refetchAll} />
      <EditEventModal open={!!editingEvent} event={editingEvent} onClose={() => setEditingEvent(null)} onUpdated={refetchAll} />
      {attendanceEvent && (
        <AttendanceModal event={attendanceEvent} onClose={() => setAttendanceEvent(null)} onUpdated={refetchAll} />
      )}
    </DashboardLayout>
  );
}
