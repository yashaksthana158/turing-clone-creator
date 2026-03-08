import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  /** Current image URL */
  value: string;
  /** Called with the new public URL after upload, or manual text input */
  onChange: (url: string) => void;
  /** Subfolder inside overload-assets bucket */
  folder?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Extra className for the wrapper */
  className?: string;
  /** Size variant */
  size?: "sm" | "md";
}

export function ImageUpload({
  value,
  onChange,
  folder = "general",
  placeholder = "Image URL",
  className = "",
  size = "sm",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() || "webp";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from("overload-assets")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("overload-assets")
      .getPublicUrl(path);

    onChange(urlData.publicUrl);
    setUploading(false);
    toast.success("Image uploaded");
  }

  const inputCls = size === "sm"
    ? "flex-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm min-w-0"
    : "flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm min-w-0";

  const btnCls = size === "sm"
    ? "flex-shrink-0 px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs flex items-center gap-1"
    : "flex-shrink-0 px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm flex items-center gap-1";

  return (
    <div className={`flex gap-1.5 items-center ${className}`}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={btnCls}
      >
        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
        {size === "md" && (uploading ? "Uploading…" : "Upload")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
