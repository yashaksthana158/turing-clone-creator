import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, Users, Search, Download, FileText } from "lucide-react";
import jsPDF from "jspdf";

interface Registration {
  id: string;
  user_id: string;
  status: string;
  profiles: {
    full_name: string | null;
    college: string | null;
    course: string | null;
  } | null;
}

interface AttendanceModalProps {
  open: boolean;
  eventId: string;
  eventTitle: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function AttendanceModal({ open, eventId, eventTitle, onClose, onUpdated }: AttendanceModalProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open && eventId) fetchRegistrations();
  }, [open, eventId]);

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("event_registrations")
      .select("id, user_id, status, profiles:user_id(full_name, college, course)")
      .eq("event_id", eventId)
      .in("status", ["REGISTERED", "ATTENDED"])
      .order("registered_at", { ascending: true });

    if (error) {
      toast.error("Failed to load registrations");
    } else {
      setRegistrations((data as unknown as Registration[]) || []);
    }
    setLoading(false);
  };

  const toggleAttendance = async (reg: Registration) => {
    const newStatus = reg.status === "ATTENDED" ? "REGISTERED" : "ATTENDED";
    setSaving(reg.id);
    const { error } = await supabase
      .from("event_registrations")
      .update({ status: newStatus })
      .eq("id", reg.id);

    if (error) {
      toast.error("Failed to update attendance");
    } else {
      setRegistrations(prev =>
        prev.map(r => r.id === reg.id ? { ...r, status: newStatus } : r)
      );
    }
    setSaving(null);
  };

  const markAllAttended = async () => {
    const unattended = registrations.filter(r => r.status === "REGISTERED");
    if (unattended.length === 0) return;

    setSaving("all");
    const { error } = await supabase
      .from("event_registrations")
      .update({ status: "ATTENDED" })
      .eq("event_id", eventId)
      .eq("status", "REGISTERED");

    if (error) {
      toast.error("Failed to mark all attended");
    } else {
      setRegistrations(prev => prev.map(r => ({ ...r, status: "ATTENDED" })));
      toast.success("All participants marked as attended");
    }
    setSaving(null);
  };

  const filtered = registrations.filter(r => {
    const name = r.profiles?.full_name?.toLowerCase() || "";
    const college = r.profiles?.college?.toLowerCase() || "";
    return name.includes(search.toLowerCase()) || college.includes(search.toLowerCase());
  });

  const attendedCount = registrations.filter(r => r.status === "ATTENDED").length;

  const exportCSV = () => {
    const header = "S.No,Name,College,Course,Status\n";
    const rows = registrations.map((r, i) =>
      `${i + 1},"${r.profiles?.full_name || "Unknown"}","${r.profiles?.college || ""}","${r.profiles?.course || ""}",${r.status}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventTitle.replace(/\s+/g, "_")}_attendance.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(eventTitle, pageWidth / 2, 20, { align: "center" });

    // Summary
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Attendance Report — ${attendedCount}/${registrations.length} attended`, pageWidth / 2, 28, { align: "center" });
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, pageWidth / 2, 34, { align: "center" });

    // Table header
    let y = 46;
    doc.setFillColor(40, 40, 40);
    doc.rect(14, y - 5, pageWidth - 28, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("S.No", 16, y);
    doc.text("Name", 30, y);
    doc.text("College", 90, y);
    doc.text("Course", 140, y);
    doc.text("Status", 180, y);

    // Rows
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    registrations.forEach((r, i) => {
      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(9);
      doc.text(`${i + 1}`, 16, y);
      doc.text(r.profiles?.full_name || "Unknown", 30, y);
      doc.text((r.profiles?.college || "").substring(0, 30), 90, y);
      doc.text((r.profiles?.course || "").substring(0, 22), 140, y);
      doc.setTextColor(r.status === "ATTENDED" ? 34 : 150, r.status === "ATTENDED" ? 197 : 150, r.status === "ATTENDED" ? 94 : 150);
      doc.text(r.status, 180, y);
      doc.setTextColor(0, 0, 0);
    });

    doc.save(`${eventTitle.replace(/\s+/g, "_")}_attendance.pdf`);
    toast.success("PDF downloaded");
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1c1c1c] border border-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white font-['Oxanium']">Mark Attendance</h2>
          <p className="text-gray-400 text-sm mt-1">{eventTitle}</p>
          <div className="flex items-center justify-between mt-4 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users size={16} />
              <span>{attendedCount}/{registrations.length} attended</span>
            </div>
            <button
              onClick={markAllAttended}
              disabled={saving === "all" || attendedCount === registrations.length}
              className="text-xs px-3 py-1.5 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
            >
              {saving === "all" ? "Marking..." : "Mark All Present"}
            </button>
          </div>
          <div className="relative mt-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or college..."
              className="w-full pl-9 pr-4 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#9113ff] transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No participants found</p>
          ) : (
            filtered.map(reg => (
              <div
                key={reg.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  reg.status === "ATTENDED"
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-black/30 border-gray-800"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {reg.profiles?.full_name || "Unknown User"}
                  </p>
                  <p className="text-gray-500 text-xs truncate">
                    {[reg.profiles?.college, reg.profiles?.course].filter(Boolean).join(" · ") || "No details"}
                  </p>
                </div>
                <button
                  onClick={() => toggleAttendance(reg)}
                  disabled={saving === reg.id}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                    reg.status === "ATTENDED"
                      ? "bg-green-500/20 text-green-300 border-green-500/30 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30"
                      : "text-gray-400 border-gray-700 hover:bg-green-500/20 hover:text-green-300 hover:border-green-500/30"
                  }`}
                >
                  {saving === reg.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : reg.status === "ATTENDED" ? (
                    <CheckCircle size={13} />
                  ) : (
                    <XCircle size={13} />
                  )}
                  {reg.status === "ATTENDED" ? "Present" : "Absent"}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-end gap-3">
          <button
            onClick={() => { onUpdated(); onClose(); }}
            className="px-4 py-2 bg-[#9113ff] hover:bg-[#7c0fd9] text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
