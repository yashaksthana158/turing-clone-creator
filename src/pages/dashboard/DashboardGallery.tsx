import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { toast } from 'sonner';
import { Plus, Trash2, Eye, EyeOff, Upload, Loader2, Image as ImageIcon, X } from 'lucide-react';

interface GalleryImage {
  id: string;
  category: string;
  image_url: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
}

const DEFAULT_CATEGORIES = ['Orientation', 'Bootcamp', 'Real-Time 3D', 'Farewell', 'Freshers'];

export default function DashboardGallery() {
  const { user } = useAuth();
  const { hasMinRoleLevel } = useRole();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const canDelete = hasMinRoleLevel(4);

  // Fetch images
  const { data: images = [], isLoading } = useQuery({
    queryKey: ['gallery-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('category')
        .order('sort_order');
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  // Get unique categories
  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...images.map((i) => i.category)]));

  const filtered = activeCategory === 'all' ? images : images.filter((i) => i.category === activeCategory);

  // Toggle visibility
  const toggleVisibility = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase.from('gallery_images').update({ is_visible }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gallery-images'] }),
    onError: () => toast.error('Failed to toggle visibility'),
  });

  // Delete images
  const deleteImages = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('gallery_images').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Images deleted');
      setSelectedImages(new Set());
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  // Bulk upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const category = activeCategory === 'all' ? 'Uncategorized' : activeCategory;
    setUploading(true);

    try {
      const maxOrder = images.filter((i) => i.category === category).reduce((max, i) => Math.max(max, i.sort_order), -1);
      const rows: { category: string; image_url: string; sort_order: number }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const path = `${category}/${Date.now()}-${i}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('gallery-images').upload(path, file);
        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }
        const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(path);
        rows.push({ category, image_url: urlData.publicUrl, sort_order: maxOrder + 1 + i });
      }

      if (rows.length > 0) {
        const { error } = await supabase.from('gallery_images').insert(rows);
        if (error) throw error;
        toast.success(`${rows.length} image(s) uploaded`);
        queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      toast.error('Category already exists');
      return;
    }
    setActiveCategory(trimmed);
    setNewCategory('');
    setShowAddCategory(false);
    toast.success(`Category "${trimmed}" created — upload images to save it`);
  };

  const toggleSelect = (id: string) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedImages.size === filtered.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(filtered.map((i) => i.id)));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white font-['Oxanium']">Gallery Management</h1>
            <p className="text-gray-400 mt-1">{images.length} images across {categories.length} categories</p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#9113ff] hover:bg-[#7c0fd9] text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Upload Images
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === 'all' ? 'bg-[#9113ff] text-white' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            All ({images.length})
          </button>
          {categories.map((cat) => {
            const count = images.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat ? 'bg-[#9113ff] text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
          {showAddCategory ? (
            <div className="flex items-center gap-1">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                placeholder="Category name"
                className="px-3 py-1.5 bg-white/5 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#9113ff] w-36"
                autoFocus
              />
              <button onClick={handleAddCategory} className="text-[#9113ff] text-sm font-medium">Add</button>
              <button onClick={() => setShowAddCategory(false)} className="text-gray-500"><X size={14} /></button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddCategory(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Plus size={14} /> Category
            </button>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedImages.size > 0 && (
          <div className="flex items-center gap-3 bg-white/5 border border-gray-800 rounded-lg px-4 py-3">
            <span className="text-sm text-gray-300">{selectedImages.size} selected</span>
            <button
              onClick={selectAll}
              className="text-sm text-[#9113ff] hover:underline"
            >
              {selectedImages.size === filtered.length ? 'Deselect All' : 'Select All'}
            </button>
            {canDelete && (
              <button
                onClick={() => deleteImages.mutate(Array.from(selectedImages))}
                className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
              >
                <Trash2 size={14} /> Delete Selected
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-gray-500" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="mx-auto text-gray-600 mb-3" size={48} />
            <p className="text-gray-400">No images in this category</p>
            <p className="text-gray-600 text-sm mt-1">Upload images to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((img) => (
              <div
                key={img.id}
                className={`relative group rounded-xl overflow-hidden border transition-colors ${
                  selectedImages.has(img.id) ? 'border-[#9113ff] ring-1 ring-[#9113ff]' : 'border-white/5 hover:border-white/20'
                } ${!img.is_visible ? 'opacity-50' : ''}`}
              >
                <img
                  src={img.image_url}
                  alt={img.category}
                  className="w-full h-40 object-cover cursor-pointer"
                  onClick={() => toggleSelect(img.id)}
                  loading="lazy"
                />
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 gap-1">
                  <button
                    onClick={() => toggleVisibility.mutate({ id: img.id, is_visible: !img.is_visible })}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white"
                    title={img.is_visible ? 'Hide' : 'Show'}
                  >
                    {img.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => deleteImages.mutate([img.id])}
                      className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-md text-red-300"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <span className="ml-auto text-[10px] text-gray-300 bg-black/40 px-1.5 py-0.5 rounded">{img.category}</span>
                </div>

                {/* Selection checkbox */}
                <div
                  className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                    selectedImages.has(img.id) ? 'bg-[#9113ff] border-[#9113ff]' : 'border-white/40 bg-black/30 opacity-0 group-hover:opacity-100'
                  }`}
                  onClick={() => toggleSelect(img.id)}
                >
                  {selectedImages.has(img.id) && <span className="text-white text-xs">✓</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
