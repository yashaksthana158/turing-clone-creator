import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateEventModal({ open, onClose, onCreated }: CreateEventModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);

    // Get user's team
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user!.id)
      .limit(1)
      .maybeSingle();

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        venue: venue.trim() || null,
        event_date: eventDate || null,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        created_by: user!.id,
        team_id: membership?.team_id || null,
        status: 'DRAFT',
      })
      .select('id')
      .single();

    if (error) {
      toast.error('Failed to create event: ' + error.message);
      setSaving(false);
      return;
    }

    // Create approval record for team lead
    await supabase.from('approvals').insert({
      item_id: event.id,
      item_type: 'EVENT',
      level: 1,
      status: 'PENDING',
    });

    toast.success('Event created! It will be reviewed by your Team Lead.');
    setSaving(false);
    setTitle('');
    setDescription('');
    setVenue('');
    setEventDate('');
    setMaxParticipants('');
    onCreated();
    onClose();
  };

  const inputClass =
    'w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#9113ff] transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#141414] border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white font-['Oxanium']">Create New Event</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Event Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputClass}
              placeholder="e.g. Overload++ 2025 Hackathon"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={inputClass}
              placeholder="Describe the event, its goals, and what participants can expect..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Date & Time</label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Max Participants</label>
              <input
                type="number"
                min="1"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className={inputClass}
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Venue</label>
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className={inputClass}
              placeholder="e.g. Seminar Hall, ANDC"
            />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300">
            After creation, this event will be sent for <strong>Team Lead approval</strong>, then <strong>President approval</strong> before publishing.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-gray-700 text-gray-300 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 bg-[#9113ff] hover:bg-[#7c0fd9] text-white rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
