import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CreateEventModal from '@/components/dashboard/CreateEventModal';
import EditEventModal from '@/components/dashboard/EditEventModal';
import EventApprovalActions from '@/components/dashboard/EventApprovalActions';
import AttendanceModal from '@/components/dashboard/AttendanceModal';
import { Calendar, Ticket, MapPin, Clock, Users, Plus, Filter, Pencil, CheckSquare, Square, Lock, Trash2, EyeOff, Star } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  status: string;
  max_participants: number | null;
  created_by: string;
  poster_url: string | null;
  category: string | null;
  is_featured: boolean;
}

interface Approval {
  id: string;
  item_id: string;
  level: number;
  status: string;
}

interface Registration {
  id: string;
  status: string;
  registered_at: string;
  event_id: string;
  events: {
    title: string;
    event_date: string | null;
    venue: string | null;
    status: string;
  } | null;
}

const STATUS_FILTERS = ['ALL', 'DRAFT', 'PENDING_LEAD', 'PENDING_PRESIDENT', 'APPROVED', 'PUBLISHED', 'CLOSED'];

export default function DashboardEvents() {
  const { user } = useAuth();
  const { hasMinRoleLevel } = useRole();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'my' | 'manage'>('my');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [attendanceEvent, setAttendanceEvent] = useState<Event | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // All users: fetch their registrations
    const { data: regs } = await supabase
      .from('event_registrations')
      .select('id, status, registered_at, event_id, events(title, event_date, venue, status)')
      .eq('user_id', user.id)
      .order('registered_at', { ascending: false });

    setRegistrations((regs as unknown as Registration[]) || []);

    // Team members+: fetch events for management
    if (hasMinRoleLevel(2)) {
      const { data: evts } = await supabase
        .from('events')
        .select('id, title, description, event_date, venue, status, max_participants, created_by, poster_url, category, is_featured')
        .order('created_at', { ascending: false });
      setEvents((evts as Event[]) || []);

      // Fetch pending approvals for these events
      const eventIds = (evts as Event[])?.map(e => e.id) || [];
      if (eventIds.length > 0) {
        const { data: aprs } = await supabase
          .from('approvals')
          .select('id, item_id, level, status')
          .eq('item_type', 'EVENT')
          .eq('status', 'PENDING')
          .in('item_id', eventIds);
        setApprovals((aprs as Approval[]) || []);
      }
    }

    setLoading(false);
  }, [user, hasMinRoleLevel]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleCancelRegistration = async (regId: string) => {
    const { error } = await supabase
      .from('event_registrations')
      .update({ status: 'CANCELLED' })
      .eq('id', regId);
    if (error) toast.error('Failed to cancel');
    else { toast.success('Registration cancelled'); fetchData(); }
  };

  const getApprovalForEvent = (eventId: string): Approval | null => {
    return approvals.find(a => a.item_id === eventId) || null;
  };

  const filteredEvents = statusFilter === 'ALL'
    ? events
    : events.filter(e => e.status === statusFilter);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEvents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEvents.map(e => e.id)));
    }
  };

  const selectedEvents = filteredEvents.filter(e => selectedIds.has(e.id));

  const bulkClose = async () => {
    const ids = selectedEvents.filter(e => e.status === 'PUBLISHED').map(e => e.id);
    if (ids.length === 0) { toast.error('No published events selected'); return; }
    setBulkLoading(true);
    const { error } = await supabase.from('events').update({ status: 'CLOSED' }).in('id', ids);
    if (error) toast.error('Failed to close events');
    else { toast.success(`${ids.length} event(s) closed`); setSelectedIds(new Set()); fetchData(); }
    setBulkLoading(false);
  };

  const bulkUnpublish = async () => {
    const ids = selectedEvents.filter(e => e.status === 'PUBLISHED').map(e => e.id);
    if (ids.length === 0) { toast.error('No published events selected'); return; }
    setBulkLoading(true);
    const { error } = await supabase.from('events').update({ status: 'APPROVED' }).in('id', ids);
    if (error) toast.error('Failed to unpublish events');
    else { toast.success(`${ids.length} event(s) unpublished`); setSelectedIds(new Set()); fetchData(); }
    setBulkLoading(false);
  };

  const bulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkLoading(true);
    await Promise.all([
      supabase.from('event_registrations').delete().in('event_id', ids),
      supabase.from('approvals').delete().in('item_id', ids),
    ]);
    const { error } = await supabase.from('events').delete().in('id', ids);
    if (error) toast.error('Failed to delete events');
    else { toast.success(`${ids.length} event(s) deleted`); setSelectedIds(new Set()); fetchData(); }
    setBulkLoading(false);
  };

  const bulkClosePast = async () => {
    const now = new Date().toISOString();
    const pastPublished = events.filter(e => e.status === 'PUBLISHED' && e.event_date && e.event_date < now);
    if (pastPublished.length === 0) { toast.error('No past published events found'); return; }
    setBulkLoading(true);
    const { error } = await supabase.from('events').update({ status: 'CLOSED' }).in('id', pastPublished.map(e => e.id));
    if (error) toast.error('Failed to close past events');
    else { toast.success(`${pastPublished.length} past event(s) closed`); setSelectedIds(new Set()); fetchData(); }
    setBulkLoading(false);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      REGISTERED: 'bg-green-500/20 text-green-400 border-green-500/30',
      CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
      ATTENDED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      PUBLISHED: 'bg-green-500/20 text-green-400 border-green-500/30',
      DRAFT: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      PENDING_LEAD: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      PENDING_PRESIDENT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      APPROVED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      CLOSED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return map[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const views = [
    { id: 'my' as const, label: 'My Events', icon: Ticket },
    ...(hasMinRoleLevel(2) ? [{ id: 'manage' as const, label: 'Manage Events', icon: Calendar }] : []),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-['Oxanium']">Events</h1>
            <p className="text-gray-400 mt-1">
              {hasMinRoleLevel(2) ? 'Create, manage, and track event approvals' : 'View events you\'ve registered for'}
            </p>
          </div>
          {hasMinRoleLevel(2) && (
            <button
              onClick={() => { setActiveView('manage'); setShowCreateModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#9113ff] hover:bg-[#7c0fd9] text-white rounded-lg transition-colors text-sm font-semibold"
            >
              <Plus size={16} />
              Create Event
            </button>
          )}
        </div>

        {/* Tabs */}
        {views.length > 1 && (
          <div className="flex gap-1 border-b border-gray-800 pb-0">
            {views.map(v => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeView === v.id
                    ? 'bg-[#1c1c1c] text-white border border-gray-800 border-b-[#1c1c1c] -mb-px'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <v.icon size={16} />
                {v.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#9113ff]"></div>
          </div>
        ) : (
          <>
            {/* My Events Tab */}
            {activeView === 'my' && (
              <div className="space-y-3">
                {registrations.length === 0 ? (
                  <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-12 text-center">
                    <Ticket size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No registrations yet</p>
                    <p className="text-gray-500 text-sm mt-1">Register for events from the Events page</p>
                  </div>
                ) : (
                  registrations.map(reg => (
                    <div key={reg.id} className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg">{reg.events?.title || 'Unknown Event'}</h3>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-400">
                            {reg.events?.event_date && (
                              <span className="flex items-center gap-1.5">
                                <Clock size={14} />
                                {formatDate(reg.events.event_date)}
                              </span>
                            )}
                            {reg.events?.venue && (
                              <span className="flex items-center gap-1.5">
                                <MapPin size={14} />
                                {reg.events.venue}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full border ${statusBadge(reg.status)}`}>
                            {reg.status}
                          </span>
                          {reg.status === 'REGISTERED' && (
                            <button
                              onClick={() => handleCancelRegistration(reg.id)}
                              className="text-xs px-3 py-1.5 text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Registered on {formatDate(reg.registered_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Manage Events Tab */}
            {activeView === 'manage' && hasMinRoleLevel(2) && (
              <div className="space-y-4">
                {/* Status filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter size={14} className="text-gray-500" />
                  {STATUS_FILTERS.map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        statusFilter === s
                          ? 'bg-[#9113ff]/20 text-[#9113ff] border-[#9113ff]/40'
                          : 'text-gray-400 border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>

                {/* Bulk action bar */}
                {hasMinRoleLevel(3) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-gray-300 border border-gray-700 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {selectedIds.size === filteredEvents.length && filteredEvents.length > 0 ? <CheckSquare size={13} /> : <Square size={13} />}
                      {selectedIds.size === filteredEvents.length && filteredEvents.length > 0 ? 'Deselect All' : 'Select All'}
                    </button>

                    {selectedIds.size > 0 && (
                      <>
                        <span className="text-xs text-gray-500">{selectedIds.size} selected</span>
                        <button
                          onClick={bulkClose}
                          disabled={bulkLoading}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-500/20 text-gray-300 border border-gray-500/30 rounded-lg hover:bg-gray-500/30 transition-colors disabled:opacity-50"
                        >
                          <Lock size={13} />
                          Close Selected
                        </button>
                        {hasMinRoleLevel(4) && (
                          <>
                            <button
                              onClick={bulkUnpublish}
                              disabled={bulkLoading}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-colors disabled:opacity-50"
                            >
                              <EyeOff size={13} />
                              Unpublish Selected
                            </button>
                            <button
                              onClick={bulkDelete}
                              disabled={bulkLoading}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={13} />
                              Delete Selected
                            </button>
                          </>
                        )}
                      </>
                    )}

                    <button
                      onClick={bulkClosePast}
                      disabled={bulkLoading}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 transition-colors disabled:opacity-50 ml-auto"
                    >
                      <Clock size={13} />
                      Close All Past Events
                    </button>
                  </div>
                )}

                {filteredEvents.length === 0 ? (
                  <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-12 text-center">
                    <Calendar size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No events found</p>
                    <p className="text-gray-500 text-sm mt-1">Create your first event to get started</p>
                  </div>
                ) : (
                  filteredEvents.map(evt => (
                    <div key={evt.id} className={`bg-[#1c1c1c] border rounded-lg p-5 transition-colors ${selectedIds.has(evt.id) ? 'border-[#9113ff]/50' : 'border-gray-800'}`}>
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        {hasMinRoleLevel(3) && (
                          <button
                            onClick={() => toggleSelect(evt.id)}
                            className="mt-1 text-gray-500 hover:text-white transition-colors flex-shrink-0"
                          >
                            {selectedIds.has(evt.id) ? <CheckSquare size={18} className="text-[#9113ff]" /> : <Square size={18} />}
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-white font-semibold">{evt.title}</h3>
                                {evt.is_featured && (
                                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                    <Star size={11} className="fill-current" /> Featured
                                  </span>
                                )}
                                <span className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${statusBadge(evt.status)}`}>
                                  {evt.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                              {evt.description && (
                                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{evt.description}</p>
                              )}
                              {evt.poster_url && (
                                <img src={evt.poster_url} alt="Event poster" className="mt-2 w-32 h-20 object-cover rounded-md border border-gray-700" />
                              )}
                              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                                {evt.event_date && (
                                  <span className="flex items-center gap-1.5">
                                    <Clock size={14} />
                                    {formatDate(evt.event_date)}
                                  </span>
                                )}
                                {evt.venue && (
                                  <span className="flex items-center gap-1.5">
                                    <MapPin size={14} />
                                    {evt.venue}
                                  </span>
                                )}
                                {evt.max_participants && (
                                  <span className="flex items-center gap-1.5">
                                    <Users size={14} />
                                    Max {evt.max_participants}
                                  </span>
                                )}
                              </div>
                            </div>
                            {evt.status === 'DRAFT' && evt.created_by === user?.id && (
                              <button
                                onClick={() => setEditingEvent(evt)}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-gray-300 border border-gray-700 rounded-lg hover:bg-white/5 transition-colors"
                              >
                                <Pencil size={13} />
                                Edit
                              </button>
                            )}
                          </div>

                          {/* Approval Actions */}
                          <div className="mt-3 pt-3 border-t border-gray-800">
                            <EventApprovalActions
                              eventId={evt.id}
                              eventStatus={evt.status}
                              eventCreatedBy={evt.created_by}
                              approval={getApprovalForEvent(evt.id)}
                              onUpdated={fetchData}
                              onMarkAttendance={() => setAttendanceEvent(evt)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      <CreateEventModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchData}
      />

      <EditEventModal
        open={!!editingEvent}
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onUpdated={fetchData}
      />

      {attendanceEvent && (
        <AttendanceModal
          open={!!attendanceEvent}
          eventId={attendanceEvent.id}
          eventTitle={attendanceEvent.title}
          onClose={() => setAttendanceEvent(null)}
          onUpdated={fetchData}
        />
      )}
    </DashboardLayout>
  );
}
