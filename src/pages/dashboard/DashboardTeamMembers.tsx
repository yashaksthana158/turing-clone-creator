import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Plus, Trash2, Pencil, X, Upload, Eye, EyeOff, GripVertical } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface PublicTeamMember {
  id: string;
  name: string;
  role: string;
  section: string;
  image_url: string | null;
  linkedin: string | null;
  instagram: string | null;
  github: string | null;
  sort_order: number;
  is_visible: boolean;
}

const SECTIONS = [
  { value: 'faculty', label: 'Faculty Mentors' },
  { value: 'council', label: 'Student Council' },
  { value: 'technical', label: 'Technical Team' },
  { value: 'executive', label: 'Executive Team' },
  { value: 'media', label: 'Media Team' },
  { value: 'pr', label: 'PR Team' },
];

const emptyForm = {
  name: '',
  role: '',
  section: 'council',
  linkedin: '',
  instagram: '',
  github: '',
  sort_order: 0,
  is_visible: true,
};

export default function DashboardTeamMembers() {
  const { user, loading: authLoading } = useAuth();
  const { hasMinRoleLevel } = useRole();
  const navigate = useNavigate();

  const [members, setMembers] = useState<PublicTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('council');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canDelete = hasMinRoleLevel(4);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('public_team_members')
      .select('*')
      .order('section')
      .order('sort_order');
    if (error) {
      toast.error('Failed to load team members');
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth/login'); return; }
    if (!authLoading && !hasMinRoleLevel(3)) { navigate('/unauthorized'); return; }
    fetchMembers();
  }, [authLoading, user, navigate, hasMinRoleLevel, fetchMembers]);

  const filteredMembers = members.filter(m => m.section === activeSection);

  const openCreateForm = () => {
    setEditingId(null);
    const maxOrder = filteredMembers.reduce((max, m) => Math.max(max, m.sort_order), 0);
    setForm({ ...emptyForm, section: activeSection, sort_order: maxOrder + 1 });
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  };

  const openEditForm = (member: PublicTeamMember) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      role: member.role,
      section: member.section,
      linkedin: member.linkedin || '',
      instagram: member.instagram || '',
      github: member.github || '',
      sort_order: member.sort_order,
      is_visible: member.is_visible,
    });
    setImageFile(null);
    setImagePreview(member.image_url);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('team-photos').upload(path, file);
    if (error) {
      toast.error('Failed to upload image');
      return null;
    }
    const { data } = supabase.storage.from('team-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.role.trim()) {
      toast.error('Name and role are required');
      return;
    }
    setSaving(true);

    let image_url = editingId ? (members.find(m => m.id === editingId)?.image_url || null) : null;
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) image_url = uploaded;
    }

    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      section: form.section,
      image_url,
      linkedin: form.linkedin.trim() || null,
      instagram: form.instagram.trim() || null,
      github: form.github.trim() || null,
      sort_order: form.sort_order,
      is_visible: form.is_visible,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase.from('public_team_members').update(payload).eq('id', editingId);
      if (error) toast.error('Failed to update member');
      else toast.success('Member updated');
    } else {
      const { error } = await supabase.from('public_team_members').insert(payload);
      if (error) toast.error('Failed to add member');
      else toast.success('Member added');
    }

    setSaving(false);
    setShowForm(false);
    fetchMembers();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('public_team_members').delete().eq('id', deleteId);
    if (error) toast.error('Failed to delete member');
    else toast.success('Member deleted');
    setDeleteId(null);
    setConfirmOpen(false);
    fetchMembers();
  };

  const toggleVisibility = async (member: PublicTeamMember) => {
    const { error } = await supabase
      .from('public_team_members')
      .update({ is_visible: !member.is_visible, updated_at: new Date().toISOString() })
      .eq('id', member.id);
    if (error) toast.error('Failed to update visibility');
    else fetchMembers();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white font-['Oxanium']">Manage Team Members</h1>
          <button onClick={openCreateForm} className="flex items-center gap-2 px-4 py-2 bg-[#9113ff] text-white rounded-lg hover:bg-[#7a0ed6] transition-colors text-sm font-medium">
            <Plus size={16} /> Add Member
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map(s => (
            <button
              key={s.value}
              onClick={() => setActiveSection(s.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === s.value
                  ? 'bg-[#9113ff] text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {s.label} ({members.filter(m => m.section === s.value).length})
            </button>
          ))}
        </div>

        {/* Members Grid */}
        {loading ? (
          <div className="text-gray-400 text-center py-12">Loading...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No members in this section yet</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMembers.sort((a, b) => a.sort_order - b.sort_order).map(member => (
              <div key={member.id} className={`bg-[#111] border border-gray-800 rounded-xl p-4 space-y-3 ${!member.is_visible ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 shrink-0">
                    {member.image_url ? (
                      <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl font-bold">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleVisibility(member)} className="p-1.5 text-gray-500 hover:text-white transition-colors" title={member.is_visible ? 'Hide' : 'Show'}>
                      {member.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => openEditForm(member)} className="p-1.5 text-gray-500 hover:text-[#9113ff] transition-colors">
                      <Pencil size={14} />
                    </button>
                    {canDelete && (
                      <button onClick={() => { setDeleteId(member.id); setConfirmOpen(true); }} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{member.name}</p>
                  <p className="text-gray-400 text-xs">{member.role}</p>
                </div>
                {(member.linkedin || member.instagram || member.github) && (
                  <div className="flex gap-2 text-xs text-gray-500">
                    {member.linkedin && <span>Li</span>}
                    {member.instagram && <span>Ig</span>}
                    {member.github && <span>Gh</span>}
                  </div>
                )}
                <p className="text-gray-600 text-xs">Order: {member.sort_order}</p>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#111] border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">{editingId ? 'Edit' : 'Add'} Team Member</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>

              {/* Image Upload */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-800 shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500"><Upload size={24} /></div>
                  )}
                </div>
                <label className="cursor-pointer px-3 py-1.5 bg-white/5 text-gray-300 rounded-lg text-sm hover:bg-white/10 transition-colors">
                  Choose Photo
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#9113ff] outline-none" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Role *</label>
                  <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#9113ff] outline-none" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Section</label>
                  <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#9113ff] outline-none">
                    {SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">LinkedIn URL</label>
                  <input value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#9113ff] outline-none" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Instagram URL</label>
                  <input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                    placeholder="https://instagram.com/..."
                    className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#9113ff] outline-none" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">GitHub URL</label>
                  <input value={form.github} onChange={e => setForm(f => ({ ...f, github: e.target.value }))}
                    placeholder="https://github.com/..."
                    className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#9113ff] outline-none" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-gray-400 text-xs block mb-1">Sort Order</label>
                    <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#9113ff] outline-none" />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.is_visible} onChange={e => setForm(f => ({ ...f, is_visible: e.target.checked }))}
                        className="accent-[#9113ff]" />
                      Visible
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 bg-white/5 text-gray-300 rounded-lg text-sm hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-[#9113ff] text-white rounded-lg text-sm hover:bg-[#7a0ed6] transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Delete Team Member"
          description="Are you sure you want to delete this team member? This cannot be undone."
          onConfirm={handleDelete}
          confirmText="Delete"
          variant="danger"
        />
      </div>
    </DashboardLayout>
  );
}
