import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Loader2 } from "lucide-react";

interface GalleryImage {
  id: string;
  category: string;
  image_url: string;
  sort_order: number;
  year: number;
}

// Hardcoded fallback for 2025 when DB is empty
const fallbackImages: GalleryImage[] = [
  { id: "o1", category: "Orientation", image_url: "/Assets/orientation/1.jpg", sort_order: 0, year: 2025 },
  { id: "o2", category: "Orientation", image_url: "/Assets/orientation/2.jpg", sort_order: 1, year: 2025 },
  { id: "o3", category: "Orientation", image_url: "/Assets/orientation/3.jpg", sort_order: 2, year: 2025 },
  { id: "o4", category: "Orientation", image_url: "/Assets/orientation/4.jpg", sort_order: 3, year: 2025 },
  { id: "o5", category: "Orientation", image_url: "/Assets/orientation/5.jpg", sort_order: 4, year: 2025 },
  { id: "o6", category: "Orientation", image_url: "/Assets/orientation/6.jpg", sort_order: 5, year: 2025 },
  { id: "o7", category: "Orientation", image_url: "/Assets/orientation/7.jpg", sort_order: 6, year: 2025 },
  { id: "o8", category: "Orientation", image_url: "/Assets/orientation/8.jpg", sort_order: 7, year: 2025 },
  { id: "o9", category: "Orientation", image_url: "/Assets/orientation/9.jpg", sort_order: 8, year: 2025 },
  { id: "b1", category: "Bootcamp", image_url: "/Assets/Bootcamp/1.jpg", sort_order: 0, year: 2025 },
  { id: "b2", category: "Bootcamp", image_url: "/Assets/Bootcamp/2.jpg", sort_order: 1, year: 2025 },
  { id: "b3", category: "Bootcamp", image_url: "/Assets/Bootcamp/3.jpg", sort_order: 2, year: 2025 },
  { id: "b4", category: "Bootcamp", image_url: "/Assets/Bootcamp/4.jpg", sort_order: 3, year: 2025 },
  { id: "b5", category: "Bootcamp", image_url: "/Assets/Bootcamp/5.jpg", sort_order: 4, year: 2025 },
  { id: "b6", category: "Bootcamp", image_url: "/Assets/Bootcamp/6.jpg", sort_order: 5, year: 2025 },
  { id: "b7", category: "Bootcamp", image_url: "/Assets/Bootcamp/7.jpg", sort_order: 6, year: 2025 },
  { id: "b8", category: "Bootcamp", image_url: "/Assets/Bootcamp/8.jpg", sort_order: 7, year: 2025 },
  { id: "b9", category: "Bootcamp", image_url: "/Assets/Bootcamp/9.jpg", sort_order: 8, year: 2025 },
  { id: "b10", category: "Bootcamp", image_url: "/Assets/Bootcamp/10.jpg", sort_order: 9, year: 2025 },
  { id: "b11", category: "Bootcamp", image_url: "/Assets/Bootcamp/11.jpg", sort_order: 10, year: 2025 },
  { id: "r1", category: "Real-Time 3D", image_url: "/Assets/Real%20Time%203D/1.webp", sort_order: 0, year: 2025 },
  { id: "r2", category: "Real-Time 3D", image_url: "/Assets/Real%20Time%203D/2.webp", sort_order: 1, year: 2025 },
  { id: "r3", category: "Real-Time 3D", image_url: "/Assets/Real%20Time%203D/3.webp", sort_order: 2, year: 2025 },
  { id: "r4", category: "Real-Time 3D", image_url: "/Assets/Real%20Time%203D/4.webp", sort_order: 3, year: 2025 },
  { id: "r5", category: "Real-Time 3D", image_url: "/Assets/Real%20Time%203D/5.webp", sort_order: 4, year: 2025 },
  { id: "r6", category: "Real-Time 3D", image_url: "/Assets/Real%20Time%203D/6.webp", sort_order: 5, year: 2025 },
  { id: "r7", category: "Real-Time 3D", image_url: "/Assets/Real%20Time%203D/7.webp", sort_order: 6, year: 2025 },
  { id: "r8", category: "Real-Time 3D", image_url: "/Assets/Real%20Time%203D/8.webp", sort_order: 7, year: 2025 },
  { id: "f1", category: "Farewell", image_url: "/Assets/farewell/1.webp", sort_order: 0, year: 2025 },
  { id: "f2", category: "Farewell", image_url: "/Assets/farewell/2.webp", sort_order: 1, year: 2025 },
  { id: "f3", category: "Farewell", image_url: "/Assets/farewell/3.webp", sort_order: 2, year: 2025 },
  { id: "f4", category: "Farewell", image_url: "/Assets/farewell/4.webp", sort_order: 3, year: 2025 },
  { id: "f5", category: "Farewell", image_url: "/Assets/farewell/5.webp", sort_order: 4, year: 2025 },
  { id: "f6", category: "Farewell", image_url: "/Assets/farewell/6.webp", sort_order: 5, year: 2025 },
  { id: "f7", category: "Farewell", image_url: "/Assets/farewell/7.webp", sort_order: 6, year: 2025 },
  { id: "f8", category: "Farewell", image_url: "/Assets/farewell/8.webp", sort_order: 7, year: 2025 },
  { id: "fr1", category: "Freshers", image_url: "/Assets/freshers/1.jpeg", sort_order: 0, year: 2025 },
  { id: "fr2", category: "Freshers", image_url: "/Assets/freshers/2.jpg", sort_order: 1, year: 2025 },
  { id: "fr3", category: "Freshers", image_url: "/Assets/freshers/3.jpeg", sort_order: 2, year: 2025 },
  { id: "fr4", category: "Freshers", image_url: "/Assets/freshers/4.jpg", sort_order: 3, year: 2025 },
  { id: "fr5", category: "Freshers", image_url: "/Assets/freshers/5.jpg", sort_order: 4, year: 2025 },
  { id: "fr6", category: "Freshers", image_url: "/Assets/freshers/6.jpg", sort_order: 5, year: 2025 },
  { id: "fr7", category: "Freshers", image_url: "/Assets/freshers/7.jpg", sort_order: 6, year: 2025 },
  { id: "fr8", category: "Freshers", image_url: "/Assets/freshers/8.jpg", sort_order: 7, year: 2025 },
  { id: "fr9", category: "Freshers", image_url: "/Assets/freshers/9.jpg", sort_order: 8, year: 2025 },
  { id: "fr10", category: "Freshers", image_url: "/Assets/freshers/10.jpg", sort_order: 9, year: 2025 },
  { id: "fr11", category: "Freshers", image_url: "/Assets/freshers/11.jpg", sort_order: 10, year: 2025 },
];

const Gallery = () => {
  const { year: yearParam } = useParams<{ year?: string }>();
  const displayYear = yearParam ? parseInt(yearParam, 10) : 2025;

  const [filter, setFilter] = useState<string>("all");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data: dbImages, isLoading } = useQuery({
    queryKey: ["gallery-images", displayYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("id, category, image_url, sort_order, year")
        .eq("is_visible", true)
        .eq("year", displayYear)
        .order("category")
        .order("sort_order");
      if (error) throw error;
      return data as GalleryImage[];
    },
    staleTime: 60000,
  });

  // Use DB images if available, fallback only for 2025
  const images = dbImages && dbImages.length > 0 ? dbImages : (displayYear === 2025 ? fallbackImages : []);
  const categories = Array.from(new Set(images.map((i) => i.category)));
  const filtered = filter === "all" ? images : images.filter((i) => i.category === filter);

  return (
    <div className="bg-black min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-6 text-center mb-12">
          <p className="text-[#9113ff] font-['Oxanium'] tracking-[6px] uppercase text-sm mb-4 font-semibold">
            Our Moments
          </p>
          <h1 className="text-5xl md:text-7xl font-bold text-white font-['Anton'] uppercase tracking-wider">
            Gallery {displayYear}
          </h1>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            Relive the memories from our events, workshops, and celebrations.
          </p>
        </div>

        {/* Category Filter Buttons */}
        {categories.length > 0 && (
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-2 mb-10">
            <button
              onClick={() => setFilter("all")}
              className={`px-5 py-2 rounded-full text-sm font-medium font-['Oxanium'] transition-all ${
                filter === "all"
                  ? "bg-[#9113ff] text-white shadow-lg shadow-[#9113ff]/25"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium font-['Oxanium'] transition-all ${
                  filter === cat
                    ? "bg-[#9113ff] text-white shadow-lg shadow-[#9113ff]/25"
                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-6">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-gray-500" size={32} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No gallery images for {displayYear} yet.</p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 md:columns-4 gap-3 space-y-3">
              {filtered.map((img) => (
                <div
                  key={img.id}
                  className="break-inside-avoid overflow-hidden rounded-xl border border-white/5 group cursor-pointer"
                  onClick={() => setLightbox(img.image_url)}
                >
                  <img
                    src={img.image_url}
                    alt={img.category}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center cursor-pointer backdrop-blur-sm"
        >
          <img
            src={lightbox}
            alt="Gallery preview"
            className="max-w-[90vw] max-h-[90vh] rounded-lg object-contain"
          />
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Gallery;
