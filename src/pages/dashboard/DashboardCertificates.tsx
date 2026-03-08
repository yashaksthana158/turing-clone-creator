import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Award, Download, Search, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Certificate {
  id: string;
  title: string;
  description: string | null;
  certificate_number: string;
  issued_at: string;
  user_id: string;
  event_id: string | null;
  issued_by: string;
  profiles?: { full_name: string | null };
  events?: { title: string } | null;
}

interface UserProfile {
  id: string;
  full_name: string | null;
}

interface EventOption {
  id: string;
  title: string;
}

export default function DashboardCertificates() {
  const { user } = useAuth();
  const { hasMinRoleLevel } = useRole();
  const isAdmin = hasMinRoleLevel(4);

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'my' | 'issue'>('my');

  // Issue form state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [certTitle, setCertTitle] = useState('');
  const [certDescription, setCertDescription] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCertificates();
    if (isAdmin) {
      fetchUsersAndEvents();
    }
  }, [user, isAdmin]);

  const fetchCertificates = async () => {
    setLoading(true);
    let query = supabase
      .from('certificates')
      .select('*, events:event_id(title)')
      .order('issued_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('user_id', user!.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching certificates:', error);
    } else {
      const certs = (data as unknown as Certificate[]) || [];
      // Fetch profile names for certificate user_ids
      if (certs.length > 0 && isAdmin) {
        const userIds = [...new Set(certs.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
        certs.forEach(c => {
          c.profiles = { full_name: profileMap.get(c.user_id) || null };
        });
      }
      setCertificates(certs);
    }
    setLoading(false);
  };

  const fetchUsersAndEvents = async () => {
    const [usersRes, eventsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name').order('full_name'),
      supabase.from('events').select('id, title').order('title'),
    ]);
    if (usersRes.data) setUsers(usersRes.data);
    if (eventsRes.data) setEvents(eventsRes.data);
  };

  const handleIssueCertificates = async () => {
    if (!certTitle.trim()) {
      toast.error('Certificate title is required');
      return;
    }
    if (selectedUsers.length === 0) {
      toast.error('Select at least one user');
      return;
    }

    setIssuing(true);
    const rows = selectedUsers.map((uid) => ({
      user_id: uid,
      title: certTitle.trim(),
      description: certDescription.trim() || null,
      event_id: selectedEvent || null,
      issued_by: user!.id,
    }));

    const { error } = await supabase.from('certificates').insert(rows);
    if (error) {
      toast.error('Failed to issue certificates: ' + error.message);
    } else {
      toast.success(`Issued ${selectedUsers.length} certificate(s)`);
      setCertTitle('');
      setCertDescription('');
      setSelectedUsers([]);
      setSelectedEvent('');
      fetchCertificates();
    }
    setIssuing(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('certificates').delete().eq('id', deleteId);
    if (error) {
      toast.error('Failed to delete certificate');
    } else {
      toast.success('Certificate deleted');
      setCertificates((prev) => prev.filter((c) => c.id !== deleteId));
    }
    setDeleteId(null);
    setDeleting(false);
  };

  const handleDownload = (cert: Certificate) => {
    // Generate a simple certificate as downloadable HTML
    const html = `
<!DOCTYPE html>
<html>
<head><title>Certificate</title>
<style>
  body { font-family: 'Georgia', serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f8f8f8; }
  .cert { background: white; border: 3px double #9113ff; padding: 60px 80px; max-width: 800px; text-align: center; box-shadow: 0 4px 30px rgba(0,0,0,0.1); }
  h1 { color: #9113ff; font-size: 2.5em; margin-bottom: 0.2em; }
  .subtitle { color: #666; font-size: 1.2em; margin-bottom: 2em; }
  .name { font-size: 2em; color: #222; font-weight: bold; border-bottom: 2px solid #9113ff; display: inline-block; padding-bottom: 4px; margin: 0.5em 0; }
  .desc { color: #555; font-size: 1.1em; margin: 1.5em 0; }
  .meta { color: #999; font-size: 0.9em; margin-top: 2em; }
</style></head>
<body>
<div class="cert">
  <h1>Certificate of Achievement</h1>
  <p class="subtitle">${cert.title}</p>
  <p>This is awarded to</p>
  <p class="name">${cert.profiles?.full_name || 'Participant'}</p>
  ${cert.description ? `<p class="desc">${cert.description}</p>` : ''}
  ${cert.events?.title ? `<p class="desc">For participation in: ${cert.events.title}</p>` : ''}
  <p class="meta">Certificate #${cert.certificate_number} | Issued: ${new Date(cert.issued_at).toLocaleDateString()}</p>
</div>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${cert.certificate_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter(
    (u) => !userSearch || u.full_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const toggleUser = (uid: string) => {
    setSelectedUsers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9113ff]"></div>
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
            <p className="text-gray-400 mt-1">
              {isAdmin ? 'Issue and manage certificates' : 'View your certificates'}
            </p>
          </div>
        </div>

        {/* Tabs for admin */}
        {isAdmin && (
          <div className="flex gap-2 border-b border-gray-800 pb-0">
            <button
              onClick={() => setTab('my')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'my'
                  ? 'border-[#9113ff] text-[#9113ff]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              All Certificates
            </button>
            <button
              onClick={() => setTab('issue')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'issue'
                  ? 'border-[#9113ff] text-[#9113ff]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5"><Plus size={16} /> Issue Certificates</span>
            </button>
          </div>
        )}

        {/* Issue Tab */}
        {isAdmin && tab === 'issue' && (
          <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Certificate Title *</label>
                <input
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  placeholder="e.g., Certificate of Participation"
                  className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-600 focus:border-[#9113ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Event (optional)</label>
                <select
                  value={selectedEvent}
                  onChange={(e) => {
                    setSelectedEvent(e.target.value);
                    // Clear auto-populated users when event changes
                  }}
                  className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#9113ff] focus:outline-none"
                >
                  <option value="">No event</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulk issue from event attendees */}
            {selectedEvent && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLoadEventAttendees}
                  disabled={loadingAttendees}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5"
                >
                  <Users size={15} />
                  {loadingAttendees ? 'Loading...' : 'Auto-select all event attendees'}
                </button>
                {attendeeCount !== null && (
                  <span className="text-xs text-gray-400">
                    {attendeeCount} attendee{attendeeCount !== 1 ? 's' : ''} found
                  </span>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Description (optional)</label>
              <textarea
                value={certDescription}
                onChange={(e) => setCertDescription(e.target.value)}
                rows={2}
                placeholder="Additional details about the certificate..."
                className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-600 focus:border-[#9113ff] focus:outline-none resize-none"
              />
            </div>

            {/* User selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                <Users size={14} className="inline mr-1" />
                Select Recipients ({selectedUsers.length} selected)
              </label>
              <div className="relative mb-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-black border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder:text-gray-600 focus:border-[#9113ff] focus:outline-none"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border border-gray-800 rounded-lg bg-black">
                {filteredUsers.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => toggleUser(u.id)}
                      className="accent-[#9113ff]"
                    />
                    <span className="text-white">{u.full_name || 'Unnamed User'}</span>
                  </label>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-gray-500 text-sm p-3">No users found</p>
                )}
              </div>
            </div>

            <button
              onClick={handleIssueCertificates}
              disabled={issuing}
              className="px-5 py-2.5 bg-[#9113ff] hover:bg-[#7c0fd9] disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {issuing ? 'Issuing...' : `Issue Certificate${selectedUsers.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {/* Certificates List */}
        {(tab === 'my' || !isAdmin) && (
          <div className="space-y-3">
            {certificates.length === 0 ? (
              <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-12 text-center">
                <Award size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400">No certificates yet</p>
              </div>
            ) : (
              certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <Award size={20} className="text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{cert.title}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                        {isAdmin && cert.profiles?.full_name && (
                          <span>To: {cert.profiles.full_name}</span>
                        )}
                        {cert.events?.title && <span>Event: {cert.events.title}</span>}
                        <span>#{cert.certificate_number}</span>
                        <span>{new Date(cert.issued_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDownload(cert)}
                      className="p-2 text-gray-400 hover:text-[#9113ff] transition-colors"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteId(cert.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
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
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Certificate"
        description="This will permanently remove this certificate. Are you sure?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </DashboardLayout>
  );
}
