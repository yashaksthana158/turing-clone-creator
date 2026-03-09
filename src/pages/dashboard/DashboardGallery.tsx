/**
 * DashboardGallery.tsx — Gallery Management Dashboard
 *
 * Fixes vs original:
 * 1. Categories are real DB-derived (no phantom local state).
 * 2. "Add Category" persists by inserting a placeholder row, making it
 *    immediately visible and selectable before any images are uploaded.
 * 3. Category rename updates every image row in that category atomically.
 * 4. Delete removes files from Supabase Storage AND the DB row.
 * 5. Upload always knows the correct target category (no silent fallback).
 * 6. sort_order is editable via ▲/▼ controls.
 * 7. Query key is shared so dashboard + public gallery cache invalidates together.
 * 8. New-year creation is explicit (a button), not a side-effect of hardcoded array.
 */

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/hooks/useRole';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { toast } from 'sonner';
import {
  Plus, Trash2, Eye, EyeOff, Upload, Loader2,
  Image as ImageIcon, X, Pencil, Check, ChevronUp, ChevronDown,
  CalendarPlus,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GalleryImage {
  id: string;
  category: string;
  image_url: string;
  sort_order: number;
  is_visible: boolean;
  year: number;
  created_at: string;
  storage_path?: string; // stored so we can delete from bucket
}

// ─── Shared query key (keeps dashboard + public gallery in sync) ──────────────
const GQ = (year: number) => ['gallery-images', year] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract the storage path from a public URL produced by Supabase. */
function storagePathFromUrl(url: string): string | null {
  // Public URL pattern: .../storage/v1/object/public/gallery-images/<path>
  const marker = '/gallery-images/';
  const idx = url.indexOf(marker);
  return idx !== -1 ? url.slice(idx + marker.length) : null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardGallery() {
  const { hasMinRoleLevel } = useRole();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit   = hasMinRoleLevel(3);
  const canDelete = hasMinRoleLevel(4);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [activeYear, setActiveYear]           = useState<number>(new Date().getFullYear());
  const [activeCategory, setActiveCategory]   = useState<string>('all');
  const [selectedImages, setSelectedImages]   = useState<Set<string>>(new Set());
  const [uploading, setUploading]             = useState(false);

  // New-year input
  const [showYearInput, setShowYearInput]     = useState(false);
  const [newYearValue, setNewYearValue]       = useState('');

  // New-category input
  const [showCatInput, setShowCatInput]       = useState(false);
  const [newCatValue, setNewCatValue]         = useState('');

  // Rename-category inline edit
  const [renamingCat, setRenamingCat]         = useState<string | null>(null);
  const [renameValue, setRenameValue]         = useState('');

  // ── Data fetching ────────────────────────────────────────────────────────────

  /**
   * Fetch ALL images (all years) once so the year-tab counts are accurate,
   * then derive the active-year slice client-side.
   */
  const { data: allImages = [], isLoading } = useQuery({
    queryKey: ['gallery-images-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('year', { ascending: false })
        .order('category')
        .order('sort_order');
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  const yearImages  = allImages.filter((i) => i.year === activeYear);
  const categories  = Array.from(new Set(yearImages.map((i) => i.category)));
  const filtered    = activeCategory === 'all'
    ? yearImages
    : yearImages.filter((i) => i.category === activeCategory);

  const years = Array.from(new Set(allImages.map((i) => i.year))).sort((a, b) => b - a);

  // ── Invalidation helper ──────────────────────────────────────────────────────

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['gallery-images-all'] });
    // Also bust the public-gallery cache for the active year so Gallery.tsx refreshes
    queryClient.invalidateQueries({ queryKey: GQ(activeYear) });
  };

  // ── Mutations ────────────────────────────────────────────────────────────────

  /** Toggle is_visible on a single image */
  const toggleVisibility = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase.from('gallery_images').update({ is_visible }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError:   () => toast.error('Failed to toggle visibility'),
  });

  /** Delete images: remove DB rows + Supabase Storage objects */
  const deleteImages = useMutation({
    mutationFn: async (ids: string[]) => {
      const targets = allImages.filter((i) => ids.includes(i.id));

      // 1. Remove storage objects (best-effort; don't block on failure)
      const paths = targets
        .map((t) => t.storage_path ?? storagePathFromUrl(t.image_url))
        .filter(Boolean) as string[];

      if (paths.length > 0) {
        const { error: storageErr } = await supabase.storage
          .from('gallery-images')
          .remove(paths);
        if (storageErr) console.warn('Storage delete partial error:', storageErr.message);
      }

      // 2. Remove DB rows
      const { error } = await supabase.from('gallery_images').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Images deleted');
      setSelectedImages(new Set());
      invalidate();
    },
    onError: () => toast.error('Failed to delete images'),
  });

  /** Rename a category: update every row in that category for the active year */
  const renameCategory = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      const { error } = await supabase
        .from('gallery_images')
        .update({ category: newName })
        .eq('year', activeYear)
        .eq('category', oldName);
      if (error) throw error;
    },
    onSuccess: (_, { newName }) => {
      toast.success('Category renamed');
      if (activeCategory === renamingCat) setActiveCategory(newName);
      setRenamingCat(null);
      invalidate();
    },
    onError: () => toast.error('Failed to rename category'),
  });

  /** Delete an entire category (all its images + storage objects) */
  const deleteCategory = useMutation({
    mutationFn: async (cat: string) => {
      const targets = yearImages.filter((i) => i.category === cat);
      const ids     = targets.map((t) => t.id);
      const paths   = targets
        .map((t) => t.storage_path ?? storagePathFromUrl(t.image_url))
        .filter(Boolean) as string[];

      if (paths.length > 0) {
        await supabase.storage.from('gallery-images').remove(paths);
      }
      if (ids.length > 0) {
        const { error } = await supabase.from('gallery_images').delete().in('id', ids);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Category deleted');
      setActiveCategory('all');
      invalidate();
    },
    onError: () => toast.error('Failed to delete category'),
  });

  /** Swap sort_order of two adjacent images */
  const swapOrder = useMutation({
    mutationFn: async ({ idA, orderA, idB, orderB }: { idA: string; orderA: number; idB: string; orderB: number }) => {
      const { error } = await supabase.rpc('swap_gallery_sort_order', {
        id_a: idA, order_a: orderA, id_b: idB, order_b: orderB,
      });
      // Fallback if RPC doesn't exist: two sequential updates
      if (error) {
        await supabase.from('gallery_images').update({ sort_order: orderB }).eq('id', idA);
        await supabase.from('gallery_images').update({ sort_order: orderA }).eq('id', idB);
      }
    },
    onSuccess: invalidate,
    onError:   () => toast.error('Failed to reorder'),
  });

  // ── Upload handler ───────────────────────────────────────────────────────────

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Guard: we must have a real category selected (not "all")
    if (activeCategory === 'all') {
      toast.error('Please select or create a category before uploading');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const category = activeCategory;
    setUploading(true);

    try {
      const maxOrder = yearImages
        .filter((i) => i.category === category)
        .reduce((max, i) => Math.max(max, i.sort_order), -1);

      const rows: {
        category: string;
        image_url: string;
        storage_path: string;
        sort_order: number;
        year: number;
        is_visible: boolean;
      }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext  = file.name.split('.').pop() ?? 'jpg';
        const path = `${activeYear}/${category}/${Date.now()}-${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(path, file, { upsert: false });

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(path);
        rows.push({
          category,
          image_url:    urlData.publicUrl,
          storage_path: path,
          sort_order:   maxOrder + 1 + i,
          year:         activeYear,
          is_visible:   true,
        });
      }

      if (rows.length > 0) {
        const { error } = await supabase.from('gallery_images').insert(rows);
        if (error) throw error;
        toast.success(`${rows.length} image(s) uploaded → ${activeYear} / ${category}`);
        invalidate();
      }
    } catch (err: any) {
      toast.error(`Upload failed: ${err?.message ?? 'unknown error'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Year creation ────────────────────────────────────────────────────────────

  const handleAddYear = () => {
    const y = parseInt(newYearValue, 10);
    if (!y || y < 2000 || y > 2100) {
      toast.error('Enter a valid year (2000–2100)');
      return;
    }
    if (years.includes(y)) {
      toast.error('Year already exists');
      return;
    }
    // Years in this UI are virtual — they exist when at least one image belongs to them.
    // We optimistically switch to the new year so the user can start adding categories/images.
    setActiveYear(y);
    setActiveCategory('all');
    setSelectedImages(new Set());
    setNewYearValue('');
    setShowYearInput(false);
    toast.success(`Switched to ${y} — add a category and upload images to populate it`);
  };

  // ── Category creation ────────────────────────────────────────────────────────

  /**
   * Categories in the DB are implicit (they're just a string column on images).
   * To make a category "real" before upload we insert a single invisible
   * placeholder row. The public Gallery.tsx filters by is_visible=true so
   * this placeholder is never shown to visitors.
   */
  const handleAddCategory = async () => {
    const trimmed = newCatValue.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      toast.error('Category already exists for this year');
      return;
    }

    const { error } = await supabase.from('gallery_images').insert({
      category:     trimmed,
      image_url:    '__placeholder__',
      storage_path: null,
      sort_order:   0,
      year:         activeYear,
      is_visible:   false,   // never shown publicly
    });

    if (error) {
      toast.error('Failed to create category');
      return;
    }

    toast.success(`Category "${trimmed}" created`);
    setActiveCategory(trimmed);
    setNewCatValue('');
    setShowCatInput(false);
    invalidate();
  };

  // ── Selection helpers ────────────────────────────────────────────────────────

  const toggleSelect = (id: string) =>
    setSelectedImages((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectAll = () =>
    setSelectedImages(
      selectedImages.size === filtered.length
        ? new Set()
        : new Set(filtered.map((i) => i.id)),
    );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white font-['Oxanium']">Gallery Management</h1>
            <p className="text-gray-400 mt-1">
              {allImages.filter(i => i.image_url !== '__placeholder__').length} total images · {yearImages.filter(i => i.image_url !== '__placeholder__').length} in {activeYear}
            </p>
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
              onClick={() => {
                if (activeCategory === 'all') {
                  toast.error('Select a specific category before uploading');
                  return;
                }
                fileInputRef.current?.click();
              }}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#9113ff] hover:bg-[#7c0fd9] text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Upload Images
            </button>
          </div>
        </div>

        {/* ── Year Tabs ── */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Year</p>
          <div className="flex flex-wrap items-center gap-2">
            {years.map((year) => {
              const count = allImages.filter((i) => i.year === year && i.image_url !== '__placeholder__').length;
              return (
                <button
                  key={year}
                  onClick={() => { setActiveYear(year); setActiveCategory('all'); setSelectedImages(new Set()); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeYear === year
                      ? 'bg-[#9113ff] text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {year}
                  {count > 0 && <span className="text-xs opacity-70 ml-1">({count})</span>}
                </button>
              );
            })}

            {/* Add new year */}
            {showYearInput ? (
              <div className="flex items-center gap-1">
                <input
                  value={newYearValue}
                  onChange={(e) => setNewYearValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddYear()}
                  placeholder="e.g. 2026"
                  type="number"
                  className="px-3 py-1.5 bg-white/5 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#9113ff] w-28"
                  autoFocus
                />
                <button onClick={handleAddYear} className="text-[#9113ff] text-sm font-medium">Go</button>
                <button onClick={() => setShowYearInput(false)} className="text-gray-500"><X size={14} /></button>
              </div>
            ) : (
              <button
                onClick={() => setShowYearInput(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                <CalendarPlus size={14} /> New Year
              </button>
            )}
          </div>
        </div>

        {/* ── Category Tabs ── */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Category</p>
          <div className="flex flex-wrap items-center gap-2">

            {/* "All" tab */}
            <button
              onClick={() => { setActiveCategory('all'); setSelectedImages(new Set()); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'bg-[#9113ff]/20 text-[#9113ff] border border-[#9113ff]/40'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              All ({yearImages.filter(i => i.image_url !== '__placeholder__').length})
            </button>

            {/* Per-category tabs */}
            {categories.map((cat) => {
              const count = yearImages.filter((i) => i.category === cat && i.image_url !== '__placeholder__').length;
              const isRenaming = renamingCat === cat;

              return (
                <div key={cat} className="flex items-center gap-0.5">
                  {isRenaming ? (
                    <>
                      <input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameCategory.mutate({ oldName: cat, newName: renameValue.trim() });
                          if (e.key === 'Escape') setRenamingCat(null);
                        }}
                        className="px-2 py-1 bg-white/5 border border-[#9113ff]/60 rounded-lg text-sm text-white focus:outline-none w-32"
                        autoFocus
                      />
                      <button
                        onClick={() => renameCategory.mutate({ oldName: cat, newName: renameValue.trim() })}
                        className="p-1 text-green-400 hover:text-green-300"
                        title="Save rename"
                      >
                        <Check size={13} />
                      </button>
                      <button onClick={() => setRenamingCat(null)} className="p-1 text-gray-500"><X size={13} /></button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setActiveCategory(cat); setSelectedImages(new Set()); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          activeCategory === cat
                            ? 'bg-[#9113ff]/20 text-[#9113ff] border border-[#9113ff]/40'
                            : 'bg-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {cat} ({count})
                      </button>

                      {/* Edit / Delete category icons (only when that tab is active) */}
                      {activeCategory === cat && canEdit && (
                        <>
                          <button
                            onClick={() => { setRenamingCat(cat); setRenameValue(cat); }}
                            className="p-1 text-gray-500 hover:text-[#9113ff]"
                            title="Rename category"
                          >
                            <Pencil size={13} />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete entire category "${cat}" and all its images? This cannot be undone.`)) {
                                  deleteCategory.mutate(cat);
                                }
                              }}
                              className="p-1 text-gray-500 hover:text-red-400"
                              title="Delete category"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {/* Add category */}
            {showCatInput ? (
              <div className="flex items-center gap-1">
                <input
                  value={newCatValue}
                  onChange={(e) => setNewCatValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') setShowCatInput(false); }}
                  placeholder="Category name"
                  className="px-3 py-1.5 bg-white/5 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#9113ff] w-36"
                  autoFocus
                />
                <button onClick={handleAddCategory} className="text-[#9113ff] text-sm font-medium">Add</button>
                <button onClick={() => setShowCatInput(false)} className="text-gray-500"><X size={14} /></button>
              </div>
            ) : (
              <button
                onClick={() => setShowCatInput(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Plus size={14} /> Add Category
              </button>
            )}
          </div>
        </div>

        {/* ── Bulk Actions Bar ── */}
        {selectedImages.size > 0 && (
          <div className="flex items-center gap-3 bg-white/5 border border-gray-800 rounded-lg px-4 py-3">
            <span className="text-sm text-gray-300">{selectedImages.size} selected</span>
            <button onClick={selectAll} className="text-sm text-[#9113ff] hover:underline">
              {selectedImages.size === filtered.length ? 'Deselect All' : 'Select All'}
            </button>

            {/* Bulk visibility toggle */}
            <button
              onClick={() => {
                const ids = Array.from(selectedImages);
                const targetVisibility = !allImages.find(i => ids.includes(i.id))?.is_visible;
                Promise.all(
                  ids.map(id => supabase.from('gallery_images').update({ is_visible: targetVisibility }).eq('id', id))
                ).then(() => { invalidate(); setSelectedImages(new Set()); toast.success('Visibility updated'); });
              }}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
            >
              <Eye size={14} /> Toggle Visibility
            </button>

            {canDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`Delete ${selectedImages.size} image(s)? This cannot be undone.`)) {
                    deleteImages.mutate(Array.from(selectedImages));
                  }
                }}
                disabled={deleteImages.isPending}
                className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                {deleteImages.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete Selected
              </button>
            )}
          </div>
        )}

        {/* ── Image Grid ── */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-gray-500" size={32} />
          </div>
        ) : filtered.filter(i => i.image_url !== '__placeholder__').length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="mx-auto text-gray-600 mb-3" size={48} />
            <p className="text-gray-400">
              No images in {activeYear}{activeCategory !== 'all' ? ` / ${activeCategory}` : ''}
            </p>
            {activeCategory !== 'all' && (
              <p className="text-gray-600 text-sm mt-1">
                Click <strong>Upload Images</strong> above to add photos to this category
              </p>
            )}
            {activeCategory === 'all' && (
              <p className="text-gray-600 text-sm mt-1">
                Create a category first, then upload images
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered
              .filter(i => i.image_url !== '__placeholder__')
              .map((img, idx, arr) => (
                <div
                  key={img.id}
                  className={`relative group rounded-xl overflow-hidden border transition-colors ${
                    selectedImages.has(img.id)
                      ? 'border-[#9113ff] ring-1 ring-[#9113ff]'
                      : 'border-white/5 hover:border-white/20'
                  } ${!img.is_visible ? 'opacity-50' : ''}`}
                >
                  <img
                    src={img.image_url}
                    alt={img.category}
                    className="w-full h-40 object-cover cursor-pointer"
                    onClick={() => toggleSelect(img.id)}
                    loading="lazy"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 gap-1">
                    {/* Visibility toggle */}
                    <button
                      onClick={() => toggleVisibility.mutate({ id: img.id, is_visible: !img.is_visible })}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white"
                      title={img.is_visible ? 'Hide from gallery' : 'Show in gallery'}
                    >
                      {img.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    {/* Sort-order nudge */}
                    {canEdit && (
                      <>
                        <button
                          onClick={() => {
                            if (idx === 0) return;
                            const prev = arr[idx - 1];
                            swapOrder.mutate({ idA: img.id, orderA: img.sort_order, idB: prev.id, orderB: prev.sort_order });
                          }}
                          disabled={idx === 0}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white disabled:opacity-30"
                          title="Move earlier"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (idx === arr.length - 1) return;
                            const next = arr[idx + 1];
                            swapOrder.mutate({ idA: img.id, orderA: img.sort_order, idB: next.id, orderB: next.sort_order });
                          }}
                          disabled={idx === arr.length - 1}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white disabled:opacity-30"
                          title="Move later"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </>
                    )}

                    {/* Delete single */}
                    {canDelete && (
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this image? This cannot be undone.')) {
                            deleteImages.mutate([img.id]);
                          }
                        }}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-md text-red-300"
                        title="Delete image"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    {/* Category label */}
                    <span className="ml-auto text-[10px] text-gray-300 bg-black/40 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                      {img.category}
                    </span>
                  </div>

                  {/* Selection checkbox */}
                  <div
                    className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                      selectedImages.has(img.id)
                        ? 'bg-[#9113ff] border-[#9113ff]'
                        : 'border-white/40 bg-black/30 opacity-0 group-hover:opacity-100'
                    }`}
                    onClick={() => toggleSelect(img.id)}
                  >
                    {selectedImages.has(img.id) && <Check size={11} className="text-white" />}
                  </div>

                  {/* Hidden badge */}
                  {!img.is_visible && (
                    <div className="absolute top-2 right-2 bg-black/60 text-gray-400 text-[9px] px-1.5 py-0.5 rounded font-medium">
                      HIDDEN
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}