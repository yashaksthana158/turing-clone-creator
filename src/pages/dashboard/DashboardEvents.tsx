import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Calendar, Ticket, MapPin, Clock, Users, CheckCircle, XCircle } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  status: string;
  max_participants: number | null;
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

export default function DashboardEvents() {
  const { user } = useAuth();
  const { hasMinRoleLevel } = useRole();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'my' | 'manage'>('my');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);

    // All users: fetch their registrations
    const { data: regs } = await supabase
      .from('event_registrations')
      .select('id, status, registered_at, event_id, events(title, event_date, venue, status)')
      .eq('user_id', user!.id)
      .order('registered_at', { ascending: false });

    setRegistrations((regs as unknown as Registration[]) || []);

    // Team members+: fetch events for management
    if (hasMinRoleLevel(2)) {
      const { data: evts } = await supabase
        .from('events')
        .select('id, title, description, event_date, venue, status, max_participants')
        .order('created_at', { ascending: false });
      setEvents((evts as Event[]) || []);
    }

    setLoading(false);
  };

  const handleCancelRegistration = async (regId: string) => {
    const { error } = await supabase
      .from('event_registrations')
      .update({ status: 'CANCELLED' })
      .eq('id', regId);
    if (error) toast.error('Failed to cancel');
    else { toast.success('Registration cancelled'); fetchData(); }
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
    ...(hasMinRoleLevel(2) ? [{ id: 'manage' as const, label: 'All Events', icon: Calendar }] : []),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Oxanium']">Events</h1>
          <p className="text-gray-400 mt-1">
            {hasMinRoleLevel(2) ? 'View your registrations and manage events' : 'View events you\'ve registered for'}
          </p>
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

            {/* All Events Management Tab */}
            {activeView === 'manage' && hasMinRoleLevel(2) && (
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-12 text-center">
                    <Calendar size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No events yet</p>
                  </div>
                ) : (
                  events.map(evt => (
                    <div key={evt.id} className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{evt.title}</h3>
                          {evt.description && (
                            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{evt.description}</p>
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
                        <span className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${statusBadge(evt.status)}`}>
                          {evt.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
