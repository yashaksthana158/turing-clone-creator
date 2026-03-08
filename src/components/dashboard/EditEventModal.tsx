import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EditEventModalProps {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  event: {
    id: string;
    title: string;
    description: string | null;
    venue: string | null;
    event_date: string | null;
    max_participants: number | null;
    poster_url: string | null;
    category?: string | null;
  } | null;
}

export default function EditEventModal({ open, event, onClose, onUpdated }: EditEventModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [category, setCategory] = useState('');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setVenue(event.venue || '');
      setEventDate(event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '');
      setMaxParticipants(event.max_participants?.toString() || '');
      setCategory(event.category || '');
      setPosterPreview(event.poster_url || null);
      setPosterFile(null);
    }
  }, [event]);

  if (!open || !event) return null;

  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const uploadPoster = async (): Promise<string | null> => {
    if (!posterFile || !user) return event.poster_url;
    const ext = posterFile.name.split('.').pop();
    const path = `${user.id}/${event.id}.${ext}`;
    const { error } = await supabase.storage.from('event-posters').upload(path, posterFile, { upsert: true });
    if (error) {
      console.error('Poster upload error:', error);
      return event.poster_url;
    }
    const { data } = supabase.storage.from('event-posters').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);

    let posterUrl = posterPreview;
    if (posterFile) {
      posterUrl = await uploadPoster();
    } else if (!posterPreview) {
      posterUrl = null;
    }

    const { error } = await supabase
      .from('events')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        venue: venue.trim() || null,
        event_date: eventDate || null,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        poster_url: posterUrl,
      })
      .eq('id', event.id);

    if (error) {
      toast.error('Failed to update event: ' + error.message);
      setSaving(false);
      return;
    }

    toast.success('Event updated successfully!');
    setSaving(false);
    onUpdated();
    onClose();
  };

  const handleResubmit = async () => {
    setSaving(true);

    let posterUrl = posterPreview;
    if (posterFile) {
      posterUrl = await uploadPoster();
    } else if (!posterPreview) {
      posterUrl = null;
    }

    // Update event and set status to PENDING_LEAD
    const { error } = await supabase
      .from('events')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        venue: venue.trim() || null,
        event_date: eventDate || null,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        poster_url: posterUrl,
        status: 'PENDING_LEAD',
      })
      .eq('id', event.id);

    if (error) {
      toast.error('Failed to resubmit: ' + error.message);
      setSaving(false);
      return;
    }

    // Create new approval record
    await supabase.from('approvals').insert({
      item_id: event.id,
      item_type: 'EVENT',
      level: 1,
      status: 'PENDING',
    });

    toast.success('Event updated and resubmitted for review!');
    setSaving(false);
    onUpdated();
    onClose();
  };

  const inputClass =
    'w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#9113ff] transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#141414] border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white font-['Oxanium']">Edit Event</h2>
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
              placeholder="Describe the event..."
            />
          </div>

          {/* Poster Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Event Poster</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePosterSelect}
              className="hidden"
            />
            {posterPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-700">
                <img src={posterPreview} alt="Poster preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => { setPosterFile(null); setPosterPreview(null); }}
                  className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-black transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center gap-2 text-gray-500 hover:border-[#9113ff]/50 hover:text-gray-400 transition-colors"
              >
                <Upload size={24} />
                <span className="text-sm">Click to upload poster (max 5MB)</span>
              </button>
            )}
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
                placeholder="Unlimited"
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
              className="py-2.5 px-4 border border-gray-700 text-gray-300 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Draft'}
            </button>
            <button
              type="button"
              disabled={saving || !title.trim()}
              onClick={handleResubmit}
              className="py-2.5 px-4 bg-[#9113ff] hover:bg-[#7c0fd9] text-white rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save & Resubmit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
