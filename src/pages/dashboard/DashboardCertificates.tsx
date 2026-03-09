import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Award, Download, Search, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { generateCertificatePdf } from '@/utils/generateCertificatePdf';
import { useCertificates, useDeleteCertificate, useIssueCertificates } from '@/hooks/queries';
import { useQuery } from '@tanstack/react-query';

interface UserProfile { id: string; full_name: string | null; }
interface EventOption { id: string; title: string; }

export default function DashboardCertificates() {
  const { user } = useAuth();
  const { hasMinRoleLevel } = useRole();
  const isAdmin = hasMinRoleLevel(4);

  const { data: certificates = [], isLoading } = useCertificates();
  const deleteCert = useDeleteCertificate();
  const issueCerts = useIssueCertificates();

  const [tab, setTab] = useState<'my' | 'issue'>('my');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [certTitle, setCertTitle] = useState('');
  const [certDescription, setCertDescription] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState<number | null>(null);

  // Fetch users & events only for admins on the issue tab
  const { data: users = [] } = useQuery<UserProfile[]>({
    queryKey: ['profiles-for-certs'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, full_name').order('full_name');
      return data || [];
    },
    enabled: isAdmin,
    staleTime: 60000,
  });

  const { data: events = [] } = useQuery<EventOption[]>({
    queryKey: ['events-for-certs'],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('id, title').order('title');
      return data || [];
    },
    enabled: isAdmin,
    staleTime: 60000,
  });

  const handleIssueCertificates = async () => {
    if (!certTitle.trim()) { toast.error('Certificate title is required'); return; }
    if (selectedUsers.length === 0) { toast.error('Select at least one user'); return; }
    const rows = selectedUsers.map((uid) => ({
      user_id: uid,
      title: certTitle.trim(),
      description: certDescription.trim() || null,
      event_id: selectedEvent || null,
      issued_by: user!.id,
    }));
    await issueCerts.mutateAsync(rows);
    setCertTitle(''); setCertDescription(''); setSelectedUsers([]); setSelectedEvent('');
  };

  const handleLoadEventAttendees = async () => {
    if (!selectedEvent) return;
    setLoadingAttendees(true);
    setAttendeeCount(null);
    const { data, error } = await supabase
      .from('event_registrations').select('user_id').eq('event_id', selectedEvent).eq('status', 'ATTENDED');
    if (error) {
      toast.error('Failed to load attendees');
    } else if (data && data.length > 0) {
      setSelectedUsers(data.map(r => r.user_id));
      setAttendeeCount(data.length);
      toast.success(`Selected ${data.length} attendee(s)`);
    } else {
      const { data: regData } = await supabase
        .from('event_registrations').select('user_id').eq('event_id', selectedEvent).eq('status', 'REGISTERED');
      if (regData && regData.length > 0) {
        setSelectedUsers(regData.map(r => r.user_id));
        setAttendeeCount(regData.length);
        toast.success(`Selected ${regData.length} registered user(s)`);
      } else {
        setAttendeeCount(0);
        toast.info('No attendees found for this event');
      }
    }
    setLoadingAttendees(false);
  };

  const handleDownload = async (cert: typeof certificates[0]) => {
    try {
      await generateCertificatePdf({
        title: cert.title,
        recipientName: cert.profiles?.full_name || 'Participant',
        description: cert.description,
        eventTitle: cert.events?.title || null,
        certificateNumber: cert.certificate_number,
        issuedAt: cert.issued_at,
      });
      toast.success('Certificate PDF downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  const filteredUsers = users.filter(u => !userSearch || u.full_name?.toLowerCase().includes(userSearch.toLowerCase()));
  const toggleUser = (uid: string) => setSelectedUsers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9113ff]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-['Oxanium']">Certificates</h1>
            <p className="text-gray-400 mt-1">{isAdmin ? 'Issue and manage certificates' : 'View your certificates'}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-2 border-b border-gray-800">
            {(['my', 'issue'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t ? 'border-[#9113ff] text-[#9113ff]' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {t === 'my' ? 'All Certificates' : <span className="flex items-center gap-1.5"><Plus size={16} />Issue Certificates</span>}
              </button>
            ))}
          </div>
        )}

        {isAdmin && tab === 'issue' && (
          <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Certificate Title *</label>
                <input
                  value={certTitle}
                  onChange={e => setCertTitle(e.target.value)}
                  placeholder="e.g., Certificate of Participation"
                  className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-600 focus:border-[#9113ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Event (optional)</label>
                <select
                  value={selectedEvent}
                  onChange={e => setSelectedEvent(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#9113ff] focus:outline-none"
                >
                  <option value="">No event</option>
                  {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
            </div>

            {selectedEvent && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLoadEventAttendees}
                  disabled={loadingAttendees}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5"
                >
                  <Users size={15} />
                  {loadingAttendees ? 'Loading...' : 'Auto-select event attendees'}
                </button>
                {attendeeCount !== null && (
                  <span className="text-xs text-gray-400">{attendeeCount} attendee{attendeeCount !== 1 ? 's' : ''} found</span>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Description (optional)</label>
              <textarea
                value={certDescription}
                onChange={e => setCertDescription(e.target.value)}
                rows={2}
                placeholder="Additional details..."
                className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-600 focus:border-[#9113ff] focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                <Users size={14} className="inline mr-1" />
                Select Recipients ({selectedUsers.length} selected)
              </label>
              <div className="relative mb-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-black border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder:text-gray-600 focus:border-[#9113ff] focus:outline-none"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border border-gray-800 rounded-lg bg-black">
                {filteredUsers.map(u => (
                  <label key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 cursor-pointer text-sm">
                    <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleUser(u.id)} className="accent-[#9113ff]" />
                    <span className="text-white">{u.full_name || 'Unnamed User'}</span>
                  </label>
                ))}
                {filteredUsers.length === 0 && <p className="text-gray-500 text-sm p-3">No users found</p>}
              </div>
            </div>

            <button
              onClick={handleIssueCertificates}
              disabled={issueCerts.isPending}
              className="px-5 py-2.5 bg-[#9113ff] hover:bg-[#7c0fd9] disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {issueCerts.isPending ? 'Issuing...' : `Issue Certificate${selectedUsers.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {(tab === 'my' || !isAdmin) && (
          <div className="space-y-3">
            {certificates.length === 0 ? (
              <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-12 text-center">
                <Award size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400">No certificates yet</p>
              </div>
            ) : (
              certificates.map(cert => (
                <div key={cert.id} className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <Award size={20} className="text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{cert.title}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                        {isAdmin && cert.profiles?.full_name && <span>To: {cert.profiles.full_name}</span>}
                        {cert.events?.title && <span>Event: {cert.events.title}</span>}
                        <span>#{cert.certificate_number}</span>
                        <span>{new Date(cert.issued_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleDownload(cert)} className="p-2 text-gray-400 hover:text-[#9113ff] transition-colors" title="Download">
                      <Download size={18} />
                    </button>
                    {isAdmin && (
                      <button onClick={() => setDeleteId(cert.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Delete Certificate"
        description="This will permanently remove this certificate. Are you sure?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { if (deleteId) { deleteCert.mutate(deleteId); setDeleteId(null); } }}
        loading={deleteCert.isPending}
      />
    </DashboardLayout>
  );
}
