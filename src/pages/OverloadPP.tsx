import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
}

interface OverloadEvent {
  id: string;
  name: string;
  type: string | null;
  image_url: string | null;
  link_url: string | null;
  sort_order: number;
}

interface ScheduleItem {
  id: string;
  time_label: string;
  venue: string | null;
  event_name: string;
  image_url: string | null;
  sort_order: number;
}

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
}

interface GalleryImage {
  id: string;
  image_url: string;
  sort_order: number;
}

const OverloadPP = () => {
  const { year } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [edition, setEdition] = useState<Edition | null>(null);
  const [events, setEvents] = useState<OverloadEvent[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const sponsorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEdition = async () => {
      setLoading(true);
      setNotFound(false);

      let query = supabase.from("overload_editions").select("*");
      if (year) {
        query = query.eq("year", parseInt(year));
      } else {
        query = query.eq("is_published", true).order("year", { ascending: false }).limit(1);
      }

      const { data } = await query;
      if (!data || data.length === 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const ed = data[0] as Edition;
      setEdition(ed);

      const [evRes, schRes, spRes, galRes] = await Promise.all([
        supabase.from("overload_events").select("*").eq("edition_id", ed.id).order("sort_order"),
        supabase.from("overload_schedule").select("*").eq("edition_id", ed.id).order("sort_order"),
        supabase.from("overload_sponsors").select("*").eq("edition_id", ed.id).order("sort_order"),
        supabase.from("overload_gallery").select("*").eq("edition_id", ed.id).order("sort_order"),
      ]);

      setEvents((evRes.data as OverloadEvent[]) || []);
      setSchedule((schRes.data as ScheduleItem[]) || []);
      setSponsors((spRes.data as Sponsor[]) || []);
      setGallery((galRes.data as GalleryImage[]) || []);
      setLoading(false);
    };

    fetchEdition();
  }, [year]);

  // Auto-scroll sponsors
  useEffect(() => {
    const el = sponsorRef.current;
    if (!el || sponsors.length === 0) return;
    let frame: number;
    let pos = 0;
    const speed = 0.5;
    const animate = () => {
      pos += speed;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [sponsors]);

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="overload-loading">
          <div className="overload-spinner" />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !edition) {
    return (
      <div>
        <Navigation />
        <div className="overload-not-found">
          <h1 className="overload-not-found-title">
            {year ? `Overload++ ${year}` : "Overload++"}
          </h1>
          <p className="overload-not-found-text">
            {year === "2026"
              ? "Coming Soon! Stay tuned for updates."
              : "This edition is not available yet. Check back later!"}
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navigation />

      {/* Hero */}
      <section
        className="overload-hero"
        style={{
          backgroundImage: edition.hero_image_url
            ? `url(${edition.hero_image_url})`
            : undefined,
        }}
      >
        <div className="overload-hero-overlay" />
        <div className="overload-hero-content">
          {edition.date_label && (
            <p className="overload-hero-date">{edition.date_label}</p>
          )}
          <h1 className="overload-hero-title">{edition.title}</h1>
          {edition.venue && (
            <p className="overload-hero-venue">{edition.venue}</p>
          )}
        </div>
      </section>

      {/* About */}
      <section className="overload-about">
        <div className="overload-about-inner">
          {edition.banner_image_url && (
            <div className="overload-about-image">
              <img src={edition.banner_image_url} alt={`${edition.title} Banner`} />
            </div>
          )}
          <div className="overload-about-text">
            <h2>About {edition.title}</h2>
            {edition.description && <p>{edition.description}</p>}
            <button
              onClick={() => {
                if (!user) {
                  navigate(`/register?redirect=/overloadpp${year ? `/${year}` : ""}`);
                } else if (edition.register_enabled && edition.register_url) {
                  window.open(edition.register_url, "_blank");
                } else {
                  document.getElementById("overload-schedule")?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="overload-register-btn"
            >
              Register Now
            </button>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      {events.length > 0 && (
        <section className="overload-events-section">
          <h2 className="overload-section-title">Events</h2>
          <div className="overload-events-grid">
            {events.map((event) => (
              <div key={event.id} className="overload-event-card">
                {event.link_url ? (
                  <a href={event.link_url}>
                    <img
                      src={event.image_url || "/img/performer/1.webp"}
                      alt={event.name}
                      className="overload-event-img"
                    />
                  </a>
                ) : (
                  <img
                    src={event.image_url || "/img/performer/1.webp"}
                    alt={event.name}
                    className="overload-event-img"
                  />
                )}
                <div className="overload-event-info">
                  <h4>{event.name}</h4>
                  {event.type && <span className="overload-event-type">{event.type}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Schedule Timeline */}
      {schedule.length > 0 && (
        <section id="overload-schedule" className="overload-schedule-section">
          <h2 className="overload-section-title">Event Schedule</h2>
          <div className="overload-timeline">
            <div className="overload-timeline-line" />
            {schedule.map((item, i) => (
              <div
                key={item.id}
                className={`overload-timeline-item ${i % 2 === 0 ? "overload-timeline-left" : "overload-timeline-right"}`}
              >
                <div className="overload-timeline-dot" />
                <div className="overload-timeline-card">
                  <div className="overload-timeline-meta">
                    <span className="overload-timeline-time">{item.time_label}</span>
                    {item.venue && <span className="overload-timeline-venue">{item.venue}</span>}
                  </div>
                  {item.image_url && (
                    <img src={item.image_url} alt={item.event_name} className="overload-timeline-img" />
                  )}
                  <h4 className="overload-timeline-event">{item.event_name}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Collaborations */}
      {sponsors.length > 0 && (
        <section className="overload-sponsors-section">
          <h3 className="overload-sponsors-title">Our Collaborations</h3>
          <div className="overload-sponsors-track" ref={sponsorRef}>
            {/* Duplicate for infinite scroll */}
            {[...sponsors, ...sponsors].map((sp, i) => (
              <a
                key={`${sp.id}-${i}`}
                href={sp.website_url || "#"}
                target="_blank"
                rel="noreferrer"
                className="overload-sponsor-item"
              >
                <img src={sp.logo_url || ""} alt={sp.name} />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="overload-gallery-section">
          <h2 className="overload-section-title">Glimpses</h2>
          <p className="overload-gallery-subtitle">
            {edition.title} in Stunning Visual Highlights
          </p>
          <div className="overload-gallery-grid">
            {gallery.map((img) => (
              <div key={img.id} className="overload-gallery-item">
                <img src={img.image_url} alt="Gallery" />
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default OverloadPP;
