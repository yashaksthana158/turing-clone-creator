import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

type Category = "all" | "orientation" | "bootcamp" | "rtd" | "farewell" | "freshers";

interface GalleryImage {
  src: string;
  category: Category;
}

const categories: { key: Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "orientation", label: "Orientation" },
  { key: "bootcamp", label: "Bootcamp" },
  { key: "rtd", label: "Real-Time 3D" },
  { key: "farewell", label: "Farewell 2023-24" },
  { key: "freshers", label: "Freshers 2024-25" },
];

// Build gallery images from known assets
const buildImages = (): GalleryImage[] => {
  const images: GalleryImage[] = [];
  const folders: { cat: Category; path: string; count: number; ext: string }[] = [
    { cat: "orientation", path: "/Assets/orientation", count: 7, ext: "jpg" },
    { cat: "bootcamp", path: "/Assets/Bootcamp", count: 7, ext: "jpg" },
    { cat: "rtd", path: "/Assets/Real Time 3D", count: 7, ext: "webp" },
    { cat: "farewell", path: "/Assets/farewell", count: 7, ext: "webp" },
    { cat: "freshers", path: "/Assets/freshers", count: 7, ext: "jpg" },
  ];
  for (const f of folders) {
    for (let i = 1; i <= f.count; i++) {
      images.push({ src: `${f.path}/${i}.${f.ext}`, category: f.cat });
    }
  }
  return images;
};

const allImages = buildImages();

const Gallery = () => {
  const [filter, setFilter] = useState<Category>("all");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered = filter === "all" ? allImages : allImages.filter((img) => img.category === filter);

  return (
    <div>
      <Navigation />

      <section style={{ backgroundColor: "#000", paddingTop: "140px", paddingBottom: "60px", minHeight: "100vh" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "3rem", color: "#fff", marginBottom: "6px" }}>Gallery</h1>
          <p style={{ color: "#d3d3d3", marginBottom: "30px" }}>Images from our events</p>

          {/* Filter Buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginBottom: "30px" }}>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setFilter(cat.key)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "6px",
                  border: "1px solid #555",
                  backgroundColor: filter === cat.key ? "#9113ff" : "transparent",
                  color: "#fff",
                  cursor: "pointer",
                  fontFamily: "'Oxanium', sans-serif",
                  fontSize: "0.9rem",
                  transition: "all 0.3s",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Image Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "10px",
          }}>
            {filtered.map((img, i) => (
              <img
                key={`${img.src}-${i}`}
                src={img.src}
                alt={`Gallery ${img.category}`}
                onClick={() => setLightbox(img.src)}
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "transform 0.3s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300,
            cursor: "pointer",
          }}
        >
          <img
            src={lightbox}
            alt="Lightbox"
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "8px" }}
          />
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Gallery;
