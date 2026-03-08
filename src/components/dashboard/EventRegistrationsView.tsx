import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Search, FileImage, ExternalLink, Calendar, X, ChevronDown } from 'lucide-react';

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
  status: string;
  event_date: string | null;
}

export default function EventRegistrationsView() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) fetchRegistrations();
  }, [selectedEventId]);

  const fetchEvents = async () => {
    setEventsLoading(true);
    const { data } = await supabase
      .from('events')
      .select('id, title, status, event_date')
      .order('created_at', { ascending: false });
    setEvents((data as EventOption[]) || []);
    setEventsLoading(false);
  };

  const fetchRegistrations = async () => {
    if (!selectedEventId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('event_registrations')
      .select('id, user_id, event_id, status, registered_at, id_card_url')
      .eq('event_id', selectedEventId)
      .order('registered_at', { ascending: false });

    if (error) {
      toast.error('Failed to load registrations');
      setLoading(false);
      return;
    }

    // Fetch profiles for all user_ids
    const userIds = (data || []).map(r => r.user_id);
    let profiles: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, college, course, phone')
        .in('id', userIds);
      (profileData || []).forEach((p: any) => { profiles[p.id] = p; });
    }

    const enriched = (data || []).map(r => ({
      ...r,
      profile: profiles[r.user_id] || undefined,
    }));

    setRegistrations(enriched);
    setLoading(false);
  };

  const getSignedUrl = async (url: string) => {
    // Extract file path from the URL
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
    cancelled: registrations.filter(r => r.status === 'CANCELLED').length,
    attended: registrations.filter(r => r.status === 'ATTENDED').length,
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      REGISTERED: 'bg-green-500/20 text-green-400 border-green-500/30',
      CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
      ATTENDED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return map[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: counts.total, color: 'text-white' },
              { label: 'Registered', value: counts.registered, color: 'text-green-400' },
              { label: 'Attended', value: counts.attended, color: 'text-blue-400' },
              { label: 'Cancelled', value: counts.cancelled, color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold font-['Oxanium'] ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

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
            <div className="flex gap-1.5">
              {['ALL', 'REGISTERED', 'ATTENDED', 'CANCELLED'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                    statusFilter === s
                      ? 'bg-[#9113ff]/20 text-[#9113ff] border-[#9113ff]/40'
                      : 'text-gray-400 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {s === 'ALL' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>

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
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-white font-medium text-sm">
                          {reg.profile?.full_name || 'Unknown User'}
                        </h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBadge(reg.status)}`}>
                          {reg.status}
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

                    {/* ID Card Button */}
                    <div className="flex-shrink-0">
                      {reg.id_card_url ? (
                        <button
                          onClick={() => handleViewIdCard(reg.id_card_url!)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#9113ff]/20 text-[#9113ff] border border-[#9113ff]/30 rounded-lg hover:bg-[#9113ff]/30 transition-colors"
                        >
                          <FileImage size={13} />
                          View ID Card
                        </button>
                      ) : (
                        <span className="text-xs text-gray-600 italic">No ID card</span>
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
    </div>
  );
}
