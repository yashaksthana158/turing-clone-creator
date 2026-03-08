import { useState } from "react";
import { Upload, X, FileImage } from "lucide-react";
import { toast } from "sonner";

interface IdCardUploadProps {
  onFileChange: (file: File | null, preview: string | null) => void;
  file: File | null;
  preview: string | null;
}

export function IdCardUpload({ onFileChange, file, preview }: IdCardUploadProps) {
  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
      toast.error("Please upload an image or PDF file");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File must be less than 5MB");
      return;
    }
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => onFileChange(f, ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      onFileChange(f, null);
    }
  };

  const handleClear = () => onFileChange(null, null);

  if (!file) {
    return (
      <div style={{ marginBottom: "24px" }}>
        <label
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
            padding: "32px 24px", border: "2px dashed rgba(145, 19, 255, 0.4)",
            borderRadius: "12px", cursor: "pointer", background: "rgba(145, 19, 255, 0.05)",
            transition: "all 0.2s",
          }}
        >
          <Upload size={32} style={{ color: "#9113ff" }} />
          <span style={{ color: "#a1a1aa", fontSize: "0.9rem" }}>Upload your College ID Card</span>
          <span style={{ color: "#52525b", fontSize: "0.75rem" }}>Image or PDF, max 5MB</span>
          <input type="file" accept="image/*,.pdf" onChange={handleSelect} style={{ display: "none" }} />
        </label>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "24px" }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: "12px", padding: "16px",
          background: "rgba(145, 19, 255, 0.1)", borderRadius: "12px",
          border: "1px solid rgba(145, 19, 255, 0.3)",
        }}
      >
        {preview ? (
          <img src={preview} alt="ID Card" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />
        ) : (
          <FileImage size={40} style={{ color: "#9113ff" }} />
        )}
        <div style={{ flex: 1, textAlign: "left" }}>
          <p style={{ color: "white", fontSize: "0.85rem", margin: 0 }}>{file.name}</p>
          <p style={{ color: "#71717a", fontSize: "0.75rem", margin: 0 }}>{(file.size / 1024).toFixed(0)} KB</p>
        </div>
        <button onClick={handleClear} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <X size={20} style={{ color: "#ef4444" }} />
        </button>
      </div>
    </div>
  );
}
