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

// Gallery images with correct paths and extensions based on actual files
const allImages: GalleryImage[] = [
  // Orientation (9 images, all .jpg)
  { src: "/Assets/orientation/1.jpg", category: "orientation" },
  { src: "/Assets/orientation/2.jpg", category: "orientation" },
  { src: "/Assets/orientation/3.jpg", category: "orientation" },
  { src: "/Assets/orientation/4.jpg", category: "orientation" },
  { src: "/Assets/orientation/5.jpg", category: "orientation" },
  { src: "/Assets/orientation/6.jpg", category: "orientation" },
  { src: "/Assets/orientation/7.jpg", category: "orientation" },
  { src: "/Assets/orientation/8.jpg", category: "orientation" },
  { src: "/Assets/orientation/9.jpg", category: "orientation" },
  
  // Bootcamp (11 images, all .jpg)
  { src: "/Assets/Bootcamp/1.jpg", category: "bootcamp" },
  { src: "/Assets/Bootcamp/2.jpg", category: "bootcamp" },
  { src: "/Assets/Bootcamp/3.jpg", category: "bootcamp" },
  { src: "/Assets/Bootcamp/4.jpg", category: "bootcamp" },
  { src: "/Assets/Bootcamp/5.jpg", category: "bootcamp" },
  { src: "/Assets/Bootcamp/6.jpg", category: "bootcamp" },
  { src: "/Assets/Bootcamp/7.jpg", category: "bootcamp" },
  { src: "/Assets/Bootcamp/8.jpg", category: "bootcamp" },
  { src: "/Assets/Bootcamp/9.jpg", category: "bootcamp" },
  { src: "/Assets/Bootcamp/10.jpg", category: "bootcamp" },
  { src: "/Assets/Bootcamp/11.jpg", category: "bootcamp" },
  
  // Real Time 3D (8 images, all .webp) - URL encode space
  { src: "/Assets/Real%20Time%203D/1.webp", category: "rtd" },
  { src: "/Assets/Real%20Time%203D/2.webp", category: "rtd" },
  { src: "/Assets/Real%20Time%203D/3.webp", category: "rtd" },
  { src: "/Assets/Real%20Time%203D/4.webp", category: "rtd" },
  { src: "/Assets/Real%20Time%203D/5.webp", category: "rtd" },
  { src: "/Assets/Real%20Time%203D/6.webp", category: "rtd" },
  { src: "/Assets/Real%20Time%203D/7.webp", category: "rtd" },
  { src: "/Assets/Real%20Time%203D/8.webp", category: "rtd" },
  
  // Farewell (8 images, all .webp)
  { src: "/Assets/farewell/1.webp", category: "farewell" },
  { src: "/Assets/farewell/2.webp", category: "farewell" },
  { src: "/Assets/farewell/3.webp", category: "farewell" },
  { src: "/Assets/farewell/4.webp", category: "farewell" },
  { src: "/Assets/farewell/5.webp", category: "farewell" },
  { src: "/Assets/farewell/6.webp", category: "farewell" },
  { src: "/Assets/farewell/7.webp", category: "farewell" },
  { src: "/Assets/farewell/8.webp", category: "farewell" },
  
  // Freshers (11 images, mixed extensions)
  { src: "/Assets/freshers/1.jpeg", category: "freshers" },
  { src: "/Assets/freshers/2.jpg", category: "freshers" },
  { src: "/Assets/freshers/3.jpeg", category: "freshers" },
  { src: "/Assets/freshers/4.jpg", category: "freshers" },
  { src: "/Assets/freshers/5.jpg", category: "freshers" },
  { src: "/Assets/freshers/6.jpg", category: "freshers" },
  { src: "/Assets/freshers/7.jpg", category: "freshers" },
  { src: "/Assets/freshers/8.jpg", category: "freshers" },
  { src: "/Assets/freshers/9.jpg", category: "freshers" },
  { src: "/Assets/freshers/10.jpg", category: "freshers" },
  { src: "/Assets/freshers/11.jpg", category: "freshers" },
];

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
