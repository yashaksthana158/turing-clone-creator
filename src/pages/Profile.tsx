import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  full_name: string;
  phone: string;
  avatar_url: string;
  college: string;
  course: string;
  roll_no: string;
  admission_year: number | null;
}

export default function Profile() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { roles, getHighestRole } = useRole();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile>({ full_name: '', phone: '', avatar_url: '', college: '', course: '', roll_no: '', admission_year: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) fetchProfile();
  }, [user, authLoading]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone, avatar_url, college, course, roll_no, admission_year')
      .eq('id', user!.id)
      .single();

    if (!error && data) {
      setProfile({
        full_name: data.full_name || '',
        phone: data.phone || '',
        avatar_url: data.avatar_url || '',
        college: data.college || '',
        course: data.course || '',
        roll_no: data.roll_no || '',
        admission_year: data.admission_year || null,
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = profile.full_name.trim();
    const trimmedPhone = profile.phone.trim();

    if (trimmedName.length > 100) {
      toast.error('Name must be less than 100 characters');
      return;
    }
    if (trimmedPhone && !/^[+\d\s()-]{0,20}$/.test(trimmedPhone)) {
      toast.error('Invalid phone number format');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: trimmedName,
        phone: trimmedPhone || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user!.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated!');
      setEditing(false);
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9113ff]"></div>
      </div>
    );
  }

  const highestRole = getHighestRole();

  const roleBadgeColor: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
    PRESIDENT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    TEAM_LEAD: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    TEAM_MEMBER: 'bg-green-500/20 text-green-400 border-green-500/30',
    PARTICIPANT: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 font-['Oxanium']"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>

        {/* Profile Card */}
        <div className="bg-[#1c1c1c] border border-[#d3d3d3] rounded-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white font-['Oxanium']">My Profile</h1>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="py-2 px-4 bg-[#9113ff] hover:bg-[#7c0fd9] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Avatar & Role */}
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-[#9113ff]/20 border-2 border-[#9113ff] flex items-center justify-center text-3xl font-bold text-[#9113ff] font-['Oxanium'] uppercase">
              {profile.full_name?.[0] || user?.email?.[0] || '?'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{profile.full_name || 'No name set'}</h2>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {roles.map((role) => (
                  <span
                    key={role}
                    className={`text-xs px-2.5 py-1 rounded-full border ${roleBadgeColor[role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
                  >
                    {role.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          {editing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  maxLength={100}
                  className="w-full px-4 py-3 bg-black border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#9113ff] transition-colors"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  maxLength={20}
                  className="w-full px-4 py-3 bg-black border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#9113ff] transition-colors"
                  placeholder="+91 1234567890"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="py-3 px-6 bg-[#9113ff] hover:bg-[#7c0fd9] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); fetchProfile(); }}
                  className="py-3 px-6 bg-transparent border border-gray-600 text-gray-300 hover:bg-white/5 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                  <p className="text-white">{profile.full_name || '—'}</p>
                </div>
                <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                  <p className="text-white">{user?.email}</p>
                </div>
                <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                  <p className="text-white">{profile.phone || '—'}</p>
                </div>
                <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">College</p>
                  <p className="text-white">{profile.college || '—'}</p>
                </div>
                <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Course</p>
                  <p className="text-white">{profile.course || '—'}</p>
                </div>
                <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Roll Number</p>
                  <p className="text-white">{profile.roll_no || '—'}</p>
                </div>
                <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Year of Admission</p>
                  <p className="text-white">{profile.admission_year || '—'}</p>
                </div>
                <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Role</p>
                  <p className="text-white">{highestRole?.replace('_', ' ') || 'None'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <div className="bg-[#1c1c1c] border border-[#d3d3d3] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Sign Out</h3>
              <p className="text-gray-400 text-sm">End your current session</p>
            </div>
            <button
              onClick={handleSignOut}
              className="py-2 px-4 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-semibold rounded-lg transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
