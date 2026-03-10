import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ImageUpload } from "@/components/dashboard/ImageUpload";
import { Plus, Trash2, Save, X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import EventRegistrationsView from "@/components/dashboard/EventRegistrationsView";

// Debounce helper
function useDebouncedCallback<T extends (...args: any[]) => any>(fn: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]) as T;
}

/** Bulk upload button for gallery images */
function GalleryUploadButton({ folder, editionId, nextOrder, onUploaded }: { folder: string; editionId: string; nextOrder: number; onUploaded: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList) {
    setUploading(true);
    let order = nextOrder;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const ext = file.name.split(".").pop() || "webp";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("overload-assets").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) { toast.error(`Failed: ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("overload-assets").getPublicUrl(path);
      await (supabase.from as any)("overload_gallery").insert({ edition_id: editionId, image_url: urlData.publicUrl, sort_order: order++ });
    }
    setUploading(false);
    toast.success("Images uploaded");
    onUploaded();
  }

  return (
    <>
      <button onClick={() => ref.current?.click()} disabled={uploading} className="flex items-center gap-2 px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm">
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {uploading ? "Uploading…" : "Upload Images"}
      </button>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }} />
    </>
  );
}

interface Edition {
  id: string;
  year: number;
  title: string;
  date_label: string | null;
  venue: string | null;
  description: string | null;
  hero_image_url: string | null;
  banner_image_url: string | null;
  register_url: string | null;
  register_enabled: boolean;
  is_published: boolean;
}

interface SubEvent {
  id: string;
  edition_id: string;
  name: string;
  type: string | null;
  image_url: string | null;
  link_url: string | null;
  sort_order: number;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  venue: string | null;
  prizes: string | null;
  rules: string | null;
  event_format: string | null;
  winning_criteria: string | null;
  coordinators: string | null;
  hero_image_url: string | null;
  register_url: string | null;
}

interface ScheduleItem {
  id: string;
  edition_id: string;
  time_label: string;
  venue: string | null;
  event_name: string;
  image_url: string | null;
  sort_order: number;
}

interface Sponsor {
  id: string;
  edition_id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
}

interface GalleryImg {
  id: string;
  edition_id: string;
  image_url: string;
  sort_order: number;
}

type Tab = "details" | "events" | "schedule" | "sponsors" | "gallery" | "registrations";

export default function DashboardOverload() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [editEdition, setEditEdition] = useState<Partial<Edition>>({});
  const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [sponsorsList, setSponsorsList] = useState<Sponsor[]>([]);
  const [galleryList, setGalleryList] = useState<GalleryImg[]>([]);
  const [showNewEdition, setShowNewEdition] = useState(false);
  const [newYear, setNewYear] = useState("");

  const selected = editions.find((e) => e.id === selectedId);

  useEffect(() => {
    fetchEditions();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchSubData(selectedId);
      const ed = editions.find((e) => e.id === selectedId);
      if (ed) setEditEdition({ ...ed });
    }
  }, [selectedId, editions]);

  async function fetchEditions() {
    const { data } = await supabase.from("overload_editions").select("*").order("year", { ascending: false });
    if (data) {
      setEditions(data as Edition[]);
      if (!selectedId && data.length > 0) setSelectedId(data[0].id);
    }
  }

  async function fetchSubData(edId: string) {
    const [ev, sch, sp, gal] = await Promise.all([
      supabase.from("overload_events").select("*").eq("edition_id", edId).order("sort_order"),
      supabase.from("overload_schedule").select("*").eq("edition_id", edId).order("sort_order"),
      supabase.from("overload_sponsors").select("*").eq("edition_id", edId).order("sort_order"),
      supabase.from("overload_gallery").select("*").eq("edition_id", edId).order("sort_order"),
    ]);
    setSubEvents((ev.data as SubEvent[]) || []);
    setScheduleItems((sch.data as ScheduleItem[]) || []);
    setSponsorsList((sp.data as Sponsor[]) || []);
    setGalleryList((gal.data as GalleryImg[]) || []);
  }

  async function createEdition() {
    const y = parseInt(newYear);
    if (!y || y < 2020 || y > 2100) { toast.error("Invalid year"); return; }
    const { error } = await supabase.from("overload_editions").insert({ year: y, title: `Overload++ ${y}` });
    if (error) { toast.error(error.message); return; }
    toast.success("Edition created");
    setShowNewEdition(false);
    setNewYear("");
    fetchEditions();
  }

  async function saveEdition() {
    if (!selectedId) return;
    const { id, ...rest } = editEdition;
    const { error } = await supabase.from("overload_editions").update(rest).eq("id", selectedId);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    fetchEditions();
  }

  async function deleteEdition() {
    if (!selectedId || !confirm("Delete this entire edition?")) return;
    const { error } = await supabase.from("overload_editions").delete().eq("id", selectedId);
    if (error) { toast.error(error.message); return; }
    setSelectedId(null);
    toast.success("Deleted");
    fetchEditions();
  }

  async function togglePublish() {
    if (!selectedId || !selected) return;
    const { error } = await supabase.from("overload_editions").update({ is_published: !selected.is_published }).eq("id", selectedId);
    if (error) { toast.error(error.message); return; }
    toast.success(selected.is_published ? "Unpublished" : "Published");
    fetchEditions();
  }

  // Generic CRUD helpers for sub-tables
  async function addRow(table: string, defaults: Record<string, unknown>) {
    if (!selectedId) return;
    const { error } = await (supabase.from as any)(table).insert({ edition_id: selectedId, ...defaults });
    if (error) { toast.error(error.message); return; }
    fetchSubData(selectedId);
  }

  async function updateRow(table: string, id: string, data: Record<string, unknown>) {
    const { error } = await (supabase.from as any)(table).update(data).eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (selectedId) fetchSubData(selectedId);
  }

  async function deleteRow(table: string, id: string) {
    const { error } = await (supabase.from as any)(table).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (selectedId) fetchSubData(selectedId);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "details", label: "Details" },
    { key: "events", label: "Events" },
    { key: "schedule", label: "Schedule" },
    { key: "sponsors", label: "Sponsors" },
    { key: "gallery", label: "Gallery" },
    { key: "registrations", label: "Registrations" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Manage Overload++</h1>
          <button onClick={() => setShowNewEdition(!showNewEdition)} className="flex items-center gap-2 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm">
            <Plus size={16} /> New Edition
          </button>
        </div>

        {showNewEdition && (
          <div className="mb-4 flex gap-2 items-center">
            <input type="number" value={newYear} onChange={(e) => setNewYear(e.target.value)} placeholder="Year e.g. 2026" className="px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white text-sm w-40" />
            <button onClick={createEdition} className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm">Create</button>
            <button onClick={() => setShowNewEdition(false)} className="px-3 py-2 text-zinc-400 hover:text-white"><X size={16} /></button>
          </div>
        )}

        {/* Edition selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {editions.map((ed) => (
            <button
              key={ed.id}
              onClick={() => setSelectedId(ed.id)}
              className={`px-4 py-2 rounded text-sm font-medium transition ${ed.id === selectedId ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
            >
              {ed.year} {ed.is_published ? "✓" : ""}
            </button>
          ))}
        </div>

        {selected && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-zinc-800 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === t.key ? "border-purple-500 text-purple-400" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Details tab */}
            {activeTab === "details" && (
              <div className="space-y-4 max-w-xl">
                {(["title", "date_label", "venue"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-xs text-zinc-400 mb-1 capitalize">{field.replace(/_/g, " ")}</label>
                    <input
                      value={(editEdition as any)[field] || ""}
                      onChange={(e) => setEditEdition({ ...editEdition, [field]: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white text-sm"
                    />
                  </div>
                ))}
                {/* Registration toggle + URL */}
                <div>
                  <label className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                    <input
                      type="checkbox"
                      checked={editEdition.register_enabled}
                      onChange={(e) => setEditEdition({ ...editEdition, register_enabled: e.target.checked })}
                      className="accent-purple-500"
                    />
                    Enable Registration URL
                  </label>
                  {editEdition.register_enabled && (
                    <input
                      value={editEdition.register_url || ""}
                      onChange={(e) => setEditEdition({ ...editEdition, register_url: e.target.value })}
                      placeholder="https://forms.google.com/..."
                      className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white text-sm mt-1"
                    />
                  )}
                </div>
                {(["hero_image_url", "banner_image_url"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-xs text-zinc-400 mb-1 capitalize">{field.replace(/_/g, " ")}</label>
                    <ImageUpload
                      value={(editEdition as any)[field] || ""}
                      onChange={(url) => setEditEdition({ ...editEdition, [field]: url })}
                      folder={`editions/${selected.year}`}
                      size="md"
                    />
                    {(editEdition as any)[field] && (
                      <img src={(editEdition as any)[field]} alt="" className="mt-2 h-20 rounded object-cover" />
                    )}
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Description</label>
                  <textarea
                    value={editEdition.description || ""}
                    onChange={(e) => setEditEdition({ ...editEdition, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={saveEdition} className="flex items-center gap-2 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm">
                    <Save size={14} /> Save
                  </button>
                  <button onClick={togglePublish} className={`px-4 py-2 rounded text-sm text-white ${selected.is_published ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}`}>
                    {selected.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={deleteEdition} className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            )}

            {/* Events tab */}
            {activeTab === "events" && (
              <div className="space-y-3">
                <button onClick={() => addRow("overload_events", { name: "New Event", sort_order: subEvents.length + 1 })} className="flex items-center gap-2 px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300">
                  <Plus size={14} /> Add Event
                </button>
                {subEvents.map((ev) => (
                  <details key={ev.id} className="bg-zinc-900 rounded border border-zinc-800">
                    <summary className="p-3 cursor-pointer text-white text-sm font-medium flex items-center gap-2">
                      {ev.name || "Untitled"} {ev.type ? `(${ev.type})` : ""}
                    </summary>
                    <div className="p-3 pt-0 space-y-2 border-t border-zinc-800">
                      <div className="flex gap-2 items-center">
                        <input value={ev.name} onChange={(e) => updateRow("overload_events", ev.id, { name: e.target.value })} className="flex-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="Name" />
                        <input value={ev.type || ""} onChange={(e) => updateRow("overload_events", ev.id, { type: e.target.value })} className="w-32 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="Type" />
                        <input type="number" value={ev.sort_order} onChange={(e) => updateRow("overload_events", ev.id, { sort_order: parseInt(e.target.value) || 0 })} className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" />
                        <button onClick={() => deleteRow("overload_events", ev.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                      </div>
                      <div className="flex gap-2 items-center">
                        <ImageUpload value={ev.image_url || ""} onChange={(url) => updateRow("overload_events", ev.id, { image_url: url })} folder={`events/${selected.year}`} placeholder="Card image" className="flex-1" />
                        {ev.image_url && <img src={ev.image_url} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Event Date</label>
                          <input value={ev.event_date || ""} onChange={(e) => updateRow("overload_events", ev.id, { event_date: e.target.value })} className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="e.g. 20 March 2025" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Event Time</label>
                          <input value={ev.event_time || ""} onChange={(e) => updateRow("overload_events", ev.id, { event_time: e.target.value })} className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="e.g. 1:30 PM - 2:30 PM" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Venue</label>
                          <input value={ev.venue || ""} onChange={(e) => updateRow("overload_events", ev.id, { venue: e.target.value })} className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="e.g. Seminar Hall" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Prizes</label>
                          <input value={ev.prizes || ""} onChange={(e) => updateRow("overload_events", ev.id, { prizes: e.target.value })} className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="e.g. Cash prizes worth ₹5000" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Description</label>
                        <textarea value={ev.description || ""} onChange={(e) => updateRow("overload_events", ev.id, { description: e.target.value })} rows={3} className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="About the event..." />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Rules (one per line)</label>
                        <textarea value={ev.rules || ""} onChange={(e) => updateRow("overload_events", ev.id, { rules: e.target.value })} rows={4} className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="Rule 1&#10;Rule 2&#10;Rule 3" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Event Format</label>
                          <textarea value={ev.event_format || ""} onChange={(e) => updateRow("overload_events", ev.id, { event_format: e.target.value })} rows={3} className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="Format description..." />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Winning Criteria</label>
                          <textarea value={ev.winning_criteria || ""} onChange={(e) => updateRow("overload_events", ev.id, { winning_criteria: e.target.value })} rows={3} className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="Winning criteria..." />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Coordinators (one per line: Name | Phone)</label>
                        <textarea value={ev.coordinators || ""} onChange={(e) => updateRow("overload_events", ev.id, { coordinators: e.target.value })} rows={3} className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="John Doe | 9876543210&#10;Jane Doe | 9876543211" />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Hero Image</label>
                        <ImageUpload value={ev.hero_image_url || ""} onChange={(url) => updateRow("overload_events", ev.id, { hero_image_url: url })} folder={`events/${selected.year}`} placeholder="Hero background image" />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Register URL</label>
                        <input value={ev.register_url || ""} onChange={(e) => updateRow("overload_events", ev.id, { register_url: e.target.value })} className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="https://forms.google.com/..." />
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}

            {/* Schedule tab */}
            {activeTab === "schedule" && (
              <div className="space-y-3">
                <button onClick={() => addRow("overload_schedule", { time_label: "TBD", event_name: "New Event", sort_order: scheduleItems.length + 1 })} className="flex items-center gap-2 px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300">
                  <Plus size={14} /> Add Schedule Item
                </button>
                {scheduleItems.map((item) => (
                  <div key={item.id} className="bg-zinc-900 rounded p-3 border border-zinc-800 space-y-2">
                    <div className="flex gap-2 items-center flex-wrap">
                      <input value={item.time_label} onChange={(e) => updateRow("overload_schedule", item.id, { time_label: e.target.value })} className="w-40 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="Time" />
                      <input value={item.venue || ""} onChange={(e) => updateRow("overload_schedule", item.id, { venue: e.target.value })} className="w-32 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="Venue" />
                      <input value={item.event_name} onChange={(e) => updateRow("overload_schedule", item.id, { event_name: e.target.value })} className="flex-1 min-w-[120px] px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="Event" />
                      <input type="number" value={item.sort_order} onChange={(e) => updateRow("overload_schedule", item.id, { sort_order: parseInt(e.target.value) || 0 })} className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" />
                      <button onClick={() => deleteRow("overload_schedule", item.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                    </div>
                    <div className="flex gap-2 items-center">
                      <ImageUpload value={item.image_url || ""} onChange={(url) => updateRow("overload_schedule", item.id, { image_url: url })} folder={`schedule/${selected.year}`} placeholder="Schedule image" className="flex-1" />
                      {item.image_url && <img src={item.image_url} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sponsors tab */}
            {activeTab === "sponsors" && (
              <div className="space-y-3">
                <button onClick={() => addRow("overload_sponsors", { name: "New Sponsor", sort_order: sponsorsList.length + 1 })} className="flex items-center gap-2 px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300">
                  <Plus size={14} /> Add Sponsor
                </button>
                {sponsorsList.map((sp) => (
                  <div key={sp.id} className="bg-zinc-900 rounded p-3 border border-zinc-800 space-y-2">
                    <div className="flex gap-2 items-center">
                      <input value={sp.name} onChange={(e) => updateRow("overload_sponsors", sp.id, { name: e.target.value })} className="flex-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="Name" />
                      <input value={sp.website_url || ""} onChange={(e) => updateRow("overload_sponsors", sp.id, { website_url: e.target.value })} className="w-48 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" placeholder="Website" />
                      <input type="number" value={sp.sort_order} onChange={(e) => updateRow("overload_sponsors", sp.id, { sort_order: parseInt(e.target.value) || 0 })} className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" />
                      <button onClick={() => deleteRow("overload_sponsors", sp.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                    </div>
                    <div className="flex gap-2 items-center">
                      <ImageUpload value={sp.logo_url || ""} onChange={(url) => updateRow("overload_sponsors", sp.id, { logo_url: url })} folder={`sponsors/${selected.year}`} placeholder="Logo image" className="flex-1" />
                      {sp.logo_url && <img src={sp.logo_url} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Gallery tab */}
            {activeTab === "gallery" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button onClick={() => addRow("overload_gallery", { image_url: "/img/gallery/1.webp", sort_order: galleryList.length + 1 })} className="flex items-center gap-2 px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300">
                    <Plus size={14} /> Add by URL
                  </button>
                  <GalleryUploadButton folder={`gallery/${selected.year}`} editionId={selectedId!} nextOrder={galleryList.length + 1} onUploaded={() => selectedId && fetchSubData(selectedId)} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {galleryList.map((img) => (
                    <div key={img.id} className="relative group bg-zinc-900 rounded border border-zinc-800 overflow-hidden">
                      <img src={img.image_url} alt="" className="w-full h-32 object-cover" />
                      <div className="p-2 space-y-1">
                        <ImageUpload value={img.image_url} onChange={(url) => updateRow("overload_gallery", img.id, { image_url: url })} folder={`gallery/${selected.year}`} placeholder="URL" />
                        <div className="flex items-center gap-1">
                          <input type="number" value={img.sort_order} onChange={(e) => updateRow("overload_gallery", img.id, { sort_order: parseInt(e.target.value) || 0 })} className="w-14 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-xs" />
                          <button onClick={() => deleteRow("overload_gallery", img.id)} className="text-red-400 hover:text-red-300 ml-auto"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registrations tab */}
            {activeTab === "registrations" && (
              <EventRegistrationsView source="overload" />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
