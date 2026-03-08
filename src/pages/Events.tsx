import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Calendar, MapPin, Users, Mic, Trophy, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LiveEventCard } from "@/components/LiveEventCard";

interface UnifiedEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  max_participants: number | null;
  poster_url: string | null;
  category: string | null;
  is_featured: boolean;
  registration_count: number;
  external_url?: string | null;
}


const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    flagship: "#9113ff", coding: "#00d4ff", gaming: "#ff6b35",
    debate: "#ffc107", puzzle: "#10b981", fun: "#ec4899",
  };
  return colors[category] || "#9113ff";
};

const CATEGORIES = ["all", "coding", "gaming", "debate", "puzzle", "fun", "workshop", "hackathon", "seminar", "flagship"];

const Events = () => {
  const [allEvents, setAllEvents] = useState<UnifiedEvent[]>([]);
  const [pastDbEvents, setPastDbEvents] = useState<UnifiedEvent[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      let unified: UnifiedEvent[] = [];
      let pastOverloadEvents: UnifiedEvent[] = [];
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("events")
        .select("id, title, description, event_date, venue, max_participants, poster_url, category, is_featured")
        .eq("status", "PUBLISHED");

      if (data && data.length > 0) {
        const upcoming = data.filter((evt: any) => !evt.event_date || evt.event_date >= now);
        const past = data.filter((evt: any) => evt.event_date && evt.event_date < now);

        const counts = await Promise.all(
          upcoming.map(async (evt: any) => {
            const { count } = await supabase
              .from("event_registrations")
              .select("id", { count: "exact", head: true })
              .eq("event_id", evt.id)
              .eq("status", "REGISTERED");
            return { ...evt, registration_count: count || 0, external_url: null };
          })
        );
        unified = counts;

        setPastDbEvents(past.map((evt: any) => ({
          ...evt, registration_count: 0, external_url: null,
        })));
      }

      // Fetch overload events from published editions
      const { data: editions } = await supabase
        .from("overload_editions")
        .select("id, date_label, venue, register_url, title")
        .eq("is_published", true);

      if (editions && editions.length > 0) {
        for (const edition of editions) {
          const { data: oEvents } = await supabase
            .from("overload_events")
            .select("id, name, type, image_url, link_url")
            .eq("edition_id", edition.id)
            .order("sort_order", { ascending: true });

          if (oEvents) {
            // Try to parse the date_label to determine if the edition is past
            const editionDate = edition.date_label ? new Date(edition.date_label) : null;
            const isPastEdition = editionDate && !isNaN(editionDate.getTime()) && editionDate.toISOString() < now;

            for (const oe of oEvents) {
              const mappedEvent: UnifiedEvent = {
                id: `overload-${oe.id}`,
                title: oe.name,
                description: `Part of ${edition.title}`,
                event_date: editionDate && !isNaN(editionDate.getTime()) ? editionDate.toISOString() : null,
                venue: edition.venue || null,
                poster_url: oe.image_url || null,
                category: oe.type || "flagship",
                max_participants: null,
                registration_count: 0,
                is_featured: false,
                external_url: oe.link_url || edition.register_url || null,
              };

              if (isPastEdition) {
                pastOverloadEvents.push(mappedEvent);
              } else {
                unified.push(mappedEvent);
              }
            }
          }
        }
      }

      // Sort: featured first, then by event_date ascending (upcoming first)
      unified.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        const dateA = a.event_date ? new Date(a.event_date).getTime() : Infinity;
        const dateB = b.event_date ? new Date(b.event_date).getTime() : Infinity;
        return dateA - dateB;
      });

      setPastDbEvents(prev => [...prev, ...pastOverloadEvents]);
      setAllEvents(unified);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const filteredEvents = allEvents.filter((e) => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || (e.category?.toLowerCase() === categoryFilter);
    return matchSearch && matchCat;
  });

  return (
    <div className="events-page">
      <Navigation />

      {/* Hero Section */}
      <section className="events-hero-section">
        <div className="events-hero-overlay" />
        <div className="events-hero-content">
          <span className="events-hero-badge">🎯 Events</span>
          <h1 className="events-hero-title">
            <span className="text-gradient">Explore</span> Our Events
          </h1>
          <p className="events-hero-subtitle">
            Join us for exciting workshops, hackathons, and coding competitions
          </p>
        </div>
      </section>

      {/* Live Events */}
      <section className="events-grid-section">
        <div className="section-header-pro">
          <h2>
            Upcoming <span className="text-gradient">Events</span>
          </h2>
          <p>Register now for upcoming events managed by the Turing Society</p>
        </div>

        {/* Search + Category Filter */}
        <div className="events-filter-bar">
          <div className="events-search-wrapper">
            <Search size={16} className="events-search-icon" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="events-search-input"
            />
          </div>
          <div className="events-cat-filters">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`events-cat-btn ${categoryFilter === cat ? "active" : ""}`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
            <div className="animate-spin" style={{ width: 40, height: 40, border: "3px solid transparent", borderTopColor: "#9113ff", borderRadius: "50%" }} />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="events-grid-pro">
            {filteredEvents.map((event) => (
              <LiveEventCard
                key={event.id}
                {...event}
                showCountdown
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <Calendar size={48} style={{ color: "#555", margin: "0 auto 1rem" }} />
            <p style={{ color: "#888" }}>
              {allEvents.length === 0
                ? "No upcoming events right now. Check back soon!"
                : "No events match your search."}
            </p>
          </div>
        )}
      </section>

      {/* Past Events Archive */}
      <section className="events-grid-section">
        <div className="section-header-pro">
          <h2>
            Past <span className="text-gradient">Events Archive</span>
          </h2>
          <p>A look back at our exciting past events and competitions</p>
        </div>
        <div className="events-grid-pro">
          {pastDbEvents.map((event) => (
            <div className="event-card-pro" key={event.id}>
              <div className="event-card-image">
                {event.poster_url ? (
                  <img src={event.poster_url} alt={event.title} />
                ) : (
                  <div style={{ background: "#1a1a2e", height: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Calendar size={48} style={{ color: "white", opacity: 0.3 }} />
                  </div>
                )}
                {event.category && (
                  <span className="event-badge" style={{ backgroundColor: getCategoryColor(event.category) }}>
                    {event.category}
                  </span>
                )}
                <span className="event-status past">Past</span>
              </div>
              <div className="event-card-content">
                <h3>{event.title}</h3>
                {event.event_date && (
                  <div className="event-meta">
                    <Calendar size={14} />
                    <span>{new Date(event.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                )}
                {event.description && <p>{event.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="events-stats-section">
        <div className="section-header-pro">
          <h2>Turing <span className="text-gradient">ANDC Events</span></h2>
          <p>
            Welcome to the Turing Society's Events section! Here, you will find
            a curated list of engaging activities designed to enrich your
            learning experience in computer science.
          </p>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><Trophy size={32} /></div>
            <div className="stat-number">55+</div>
            <div className="stat-label">Events Hosted</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Users size={32} /></div>
            <div className="stat-number">1200+</div>
            <div className="stat-label">Participants</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Mic size={32} /></div>
            <div className="stat-number">85+</div>
            <div className="stat-label">Speakers</div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Events;
