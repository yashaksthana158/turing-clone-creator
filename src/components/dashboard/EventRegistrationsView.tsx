import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Search, FileImage, ExternalLink, Calendar, X, ChevronDown, CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface RegistrationRow {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  registered_at: string;
  id_card_url: string | null;
  profile?: {
    full_name: string | null;
    college: string | null;
    course: string | null;
    phone: string | null;
  };
}

interface EventOption {
  id: string;
  title: string;
  status?: string;
  event_date: string | null;
}

interface EventRegistrationsViewProps {
  source?: 'events' | 'overload';
}

export default function EventRegistrationsView({ source = 'events' }: EventRegistrationsViewProps) {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventOption | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'APPROVED' | 'REJECTED' } | null>(null);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isOverload = source === 'overload';
  const regTable = isOverload ? 'overload_event_registrations' : 'event_registrations';
  const eventIdCol = isOverload ? 'overload_event_id' : 'event_id';

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchRegistrations();
      setSelectedEvent(events.find(e => e.id === selectedEventId) || null);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    setEventsLoading(true);
    if (isOverload) {
      const { data } = await supabase
        .from('overload_events')
        .select('id, name, edition_id')
        .order('sort_order', { ascending: true });
      setEvents((data || []).map((e: any) => ({ id: e.id, title: e.name, event_date: null })));
    } else {
      const { data } = await supabase
        .from('events')
        .select('id, title, status, event_date')
        .order('created_at', { ascending: false });
      setEvents((data as EventOption[]) || []);
    }
    setEventsLoading(false);
  };

  const fetchRegistrations = async () => {
    if (!selectedEventId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from(regTable as any)
      .select('id, user_id, status, registered_at, id_card_url')
      .eq(eventIdCol, selectedEventId)
      .order('registered_at', { ascending: false });

    if (error) {
      toast.error('Failed to load registrations');
      setLoading(false);
      return;
    }

    const rows = (data || []) as any[];
    const userIds = rows.map((r: any) => r.user_id);
    let profiles: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, college, course, phone')
        .in('id', userIds);
      (profileData || []).forEach((p: any) => { profiles[p.id] = p; });
    }

    const enriched = rows.map((r: any) => ({
      ...r,
      event_id: isOverload ? r.overload_event_id : r.event_id,
      profile: profiles[r.user_id] || undefined,
    }));

    setRegistrations(enriched);
    setSelectedIds(new Set());
    setLoading(false);
  };

  const getSignedUrl = async (url: string) => {
    const match = url.match(/id-cards\/(.+)$/);
    if (!match) return url;
    const filePath = match[1];
    const { data } = await supabase.storage.from('id-cards').createSignedUrl(filePath, 300);
    return data?.signedUrl || url;
  };

  const handleViewIdCard = async (url: string) => {
    const signed = await getSignedUrl(url);
    setPreviewUrl(signed);
  };

  const handleUpdateStatus = async (registrationId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setActionLoading(prev => ({ ...prev, [registrationId]: true }));

    const { error } = await supabase
      .from(regTable as any)
      .update({ status: newStatus })
      .eq('id', registrationId);

    if (error) {
      toast.error(`Failed to ${newStatus.toLowerCase()} registration`);
    } else {
      toast.success(`Registration ${newStatus.toLowerCase()}`);

      // If approved, trigger confirmation email
      if (newStatus === 'APPROVED' && selectedEvent) {
        await sendConfirmationEmail([registrationId], selectedEvent.title);
      }

      fetchRegistrations();
    }

    setActionLoading(prev => ({ ...prev, [registrationId]: false }));
    setConfirmAction(null);
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setBulkApproving(true);

    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from('event_registrations')
      .update({ status: 'APPROVED' as any })
      .in('id', ids);

    if (error) {
      toast.error('Failed to approve selected registrations');
    } else {
      toast.success(`${ids.length} registration(s) approved`);
      if (selectedEvent) {
        await sendConfirmationEmail(ids, selectedEvent.title);
      }
      fetchRegistrations();
    }

    setBulkApproving(false);
  };

  const sendConfirmationEmail = async (registrationIds: string[], eventTitle: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-registration-email', {
        body: { registrationIds, eventTitle },
      });

      if (error) {
        console.error('Email notification error:', error);
        toast.info('Registration updated, but confirmation email could not be sent.');
      } else if (data?.approvedUsers?.length) {
        toast.success(`Confirmation sent to ${data.approvedUsers.length} participant(s)`);
      }
    } catch {
      console.error('Failed to invoke email function');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const registeredIds = filtered.filter(r => r.status === 'REGISTERED').map(r => r.id);
    if (registeredIds.every(id => selectedIds.has(id))) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        registeredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        registeredIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const filtered = registrations.filter(r => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch = !searchQuery ||
      (r.profile?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.profile?.college || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    total: registrations.length,
    registered: registrations.filter(r => r.status === 'REGISTERED').length,
    approved: registrations.filter(r => r.status === 'APPROVED').length,
    attended: registrations.filter(r => r.status === 'ATTENDED').length,
    rejected: registrations.filter(r => r.status === 'REJECTED').length,
    cancelled: registrations.filter(r => r.status === 'CANCELLED').length,
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      REGISTERED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      APPROVED: 'bg-green-500/20 text-green-400 border-green-500/30',
      REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
      CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      ATTENDED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return map[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  const pendingCount = filtered.filter(r => r.status === 'REGISTERED').length;
  const selectedRegisteredCount = Array.from(selectedIds).filter(id =>
    registrations.find(r => r.id === id && r.status === 'REGISTERED')
  ).length;

  return (
    <div className="space-y-4">
      {/* Event Selector */}
      <div className="relative">
        <label className="block text-sm text-gray-400 mb-1.5">Select Event</label>
        <div className="relative">
          <select
            value={selectedEventId || ''}
            onChange={(e) => setSelectedEventId(e.target.value || null)}
            className="w-full bg-[#1c1c1c] border border-gray-700 text-white rounded-lg px-4 py-2.5 pr-10 appearance-none focus:outline-none focus:border-[#9113ff]/50 text-sm"
          >
            <option value="">Choose an event...</option>
            {events.map(evt => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({evt.status.replace(/_/g, ' ')})
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {selectedEventId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: 'Total', value: counts.total, color: 'text-white' },
              { label: 'Pending', value: counts.registered, color: 'text-amber-400' },
              { label: 'Approved', value: counts.approved, color: 'text-green-400' },
              { label: 'Rejected', value: counts.rejected, color: 'text-red-400' },
              { label: 'Attended', value: counts.attended, color: 'text-blue-400' },
              { label: 'Cancelled', value: counts.cancelled, color: 'text-gray-400' },
            ].map(s => (
              <div key={s.label} className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-3 text-center">
                <p className={`text-xl font-bold font-['Oxanium'] ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Bulk Actions */}
          {pendingCount > 0 && (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5">
              <span className="text-xs text-amber-300">
                {pendingCount} pending registration(s) awaiting review
              </span>
              <div className="flex-1" />
              {selectedRegisteredCount > 0 && (
                <button
                  onClick={handleBulkApprove}
                  disabled={bulkApproving}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                >
                  {bulkApproving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                  Approve Selected ({selectedRegisteredCount})
                </button>
              )}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-[#9113ff]/50"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {['ALL', 'REGISTERED', 'APPROVED', 'REJECTED', 'ATTENDED', 'CANCELLED'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                    statusFilter === s
                      ? 'bg-[#9113ff]/20 text-[#9113ff] border-[#9113ff]/40'
                      : 'text-gray-400 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {s === 'ALL' ? 'All' : s === 'REGISTERED' ? 'Pending' : s}
                </button>
              ))}
            </div>
          </div>

          {/* Select All for pending */}
          {pendingCount > 0 && statusFilter !== 'APPROVED' && statusFilter !== 'REJECTED' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filtered.filter(r => r.status === 'REGISTERED').every(r => selectedIds.has(r.id)) && pendingCount > 0}
                onChange={toggleSelectAll}
                className="w-3.5 h-3.5 rounded border-gray-600 text-[#9113ff] focus:ring-[#9113ff]/30"
              />
              <span className="text-xs text-gray-400">Select all pending</span>
            </div>
          )}

          {/* Registrations List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9113ff]"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-12 text-center">
              <Users size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No registrations found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(reg => (
                <div key={reg.id} className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox for pending */}
                    {reg.status === 'REGISTERED' && (
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(reg.id)}
                          onChange={() => toggleSelect(reg.id)}
                          className="w-3.5 h-3.5 rounded border-gray-600 text-[#9113ff] focus:ring-[#9113ff]/30"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-white font-medium text-sm">
                          {reg.profile?.full_name || 'Unknown User'}
                        </h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBadge(reg.status)}`}>
                          {reg.status === 'REGISTERED' ? 'PENDING' : reg.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                        {reg.profile?.college && <span>{reg.profile.college}</span>}
                        {reg.profile?.course && <span>{reg.profile.course}</span>}
                        {reg.profile?.phone && <span>{reg.profile.phone}</span>}
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(reg.registered_at)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {reg.id_card_url ? (
                        <button
                          onClick={() => handleViewIdCard(reg.id_card_url!)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#9113ff]/20 text-[#9113ff] border border-[#9113ff]/30 rounded-lg hover:bg-[#9113ff]/30 transition-colors"
                        >
                          <FileImage size={13} />
                          ID Card
                        </button>
                      ) : (
                        <span className="text-xs text-gray-600 italic">No ID</span>
                      )}

                      {reg.status === 'REGISTERED' && (
                        <>
                          {actionLoading[reg.id] ? (
                            <Loader2 size={14} className="animate-spin text-gray-400" />
                          ) : (
                            <>
                              <button
                                onClick={() => setConfirmAction({ id: reg.id, action: 'APPROVED' })}
                                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
                                title="Approve registration"
                              >
                                <CheckCircle size={13} />
                                Approve
                              </button>
                              <button
                                onClick={() => setConfirmAction({ id: reg.id, action: 'REJECTED' })}
                                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                                title="Reject registration"
                              >
                                <XCircle size={13} />
                                Reject
                              </button>
                            </>
                          )}
                        </>
                      )}

                      {reg.status === 'APPROVED' && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <Mail size={11} />
                          Confirmed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ID Card Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-w-2xl w-full mx-4 bg-[#1c1c1c] border border-gray-700 rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-white font-semibold text-sm">ID Card Preview</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[#9113ff] hover:text-[#a840ff] transition-colors"
                >
                  <ExternalLink size={13} />
                  Open Full
                </a>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-4 flex justify-center max-h-[70vh] overflow-auto">
              <img
                src={previewUrl}
                alt="ID Card"
                className="max-w-full rounded-lg"
                onError={() => {
                  toast.error('Could not load ID card image');
                  setPreviewUrl(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.action === 'APPROVED' ? 'Approve Registration' : 'Reject Registration'}
        description={
          confirmAction?.action === 'APPROVED'
            ? 'This will approve the registration and send a confirmation email to the participant.'
            : 'This will reject the registration. The participant will not be able to attend.'
        }
        confirmLabel={confirmAction?.action === 'APPROVED' ? 'Approve' : 'Reject'}
        variant={confirmAction?.action === 'APPROVED' ? 'warning' : 'danger'}
        onConfirm={() => confirmAction && handleUpdateStatus(confirmAction.id, confirmAction.action)}
        loading={confirmAction ? actionLoading[confirmAction.id] : false}
      />
    </div>
  );
}
