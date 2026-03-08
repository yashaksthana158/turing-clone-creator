import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Calendar, MapPin, Users, Mic, Trophy, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LiveEventCard } from "@/components/LiveEventCard";

interface DbEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  status: string;
  max_participants: number | null;
  poster_url: string | null;
  category: string | null;
  is_featured: boolean;
}

const hardcodedEvents = [
  { title: "Overload++ 2025", category: "flagship", date: "March 20, 2025", description: "The annual tech fest of ANDC featuring coding, gaming, debates, and more.", image: "/Assets/overload_events/hackazzle.jpg" },
  { title: "Code Rush", category: "coding", date: "March 20, 2025", description: "A competitive coding challenge to test your programming skills under pressure.", image: "/Assets/overload_events/Code_Rush.jpg" },
  { title: "Bug Hunt", category: "coding", date: "March 20, 2025", description: "Find and fix bugs in the given code snippets within the time limit.", image: "/Assets/overload_events/bug_hunt.jpg" },
  { title: "Tech War", category: "debate", date: "March 20, 2025", description: "A debate competition on trending tech topics.", image: "/Assets/overload_events/tech_war.jpg" },
  { title: "Tekken Showdown", category: "gaming", date: "March 20, 2025", description: "Console gaming tournament featuring Tekken battles.", image: "/Assets/overload_events/tekken.jpg" },
  { title: "The Lost Artifact", category: "fun", date: "March 20, 2025", description: "An exciting treasure hunt across the campus with tech-based clues.", image: "/Assets/overload_events/artifact.jpg" },
  { title: "Hackzzle", category: "puzzle", date: "March 20, 2025", description: "Solve complex puzzles using logic and programming knowledge.", image: "/Assets/overload_events/hackazzle.jpg" },
  { title: "Sketch Bytes", category: "fun", date: "March 20, 2025", description: "A fun scribble and drawing game with a tech twist.", image: "/Assets/overload_events/sketch_bytes.jpg" },
  { title: "BGMI Campus Clash", category: "gaming", date: "March 20, 2025", description: "Mobile gaming tournament featuring BGMI squad battles.", image: "/Assets/overload_events/bgmi.jpg" },
];

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    flagship: "#9113ff", coding: "#00d4ff", gaming: "#ff6b35",
    debate: "#ffc107", puzzle: "#10b981", fun: "#ec4899",
  };
  return colors[category] || "#9113ff";
};

const CATEGORIES = ["all", "coding", "gaming", "debate", "puzzle", "fun", "workshop", "hackathon", "seminar"];

const Events = () => {
  const [dbEvents, setDbEvents] = useState<(DbEvent & { registration_count: number })[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, description, event_date, venue, status, max_participants, poster_url, category, is_featured")
        .eq("status", "PUBLISHED")
        .order("is_featured", { ascending: false })
        .order("event_date", { ascending: true });

      if (data && data.length > 0) {
        const counts = await Promise.all(
          data.map(async (evt: any) => {
            const { count } = await supabase
              .from("event_registrations")
              .select("id", { count: "exact", head: true })
              .eq("event_id", evt.id)
              .eq("status", "REGISTERED");
            return { ...evt, registration_count: count || 0 };
          })
        );
        setDbEvents(counts);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const filteredDbEvents = dbEvents.filter((e) => {
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

      {/* Live DB Events */}
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
        ) : filteredDbEvents.length > 0 ? (
          <div className="events-grid-pro">
            {filteredDbEvents.map((event) => (
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
              {dbEvents.length === 0
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
          {hardcodedEvents.map((event, index) => (
            <div className="event-card-pro" key={index}>
              <div className="event-card-image">
                <img src={event.image} alt={event.title} />
                <span className="event-badge" style={{ backgroundColor: getCategoryColor(event.category) }}>
                  {event.category}
                </span>
                <span className="event-status past">Past</span>
              </div>
              <div className="event-card-content">
                <h3>{event.title}</h3>
                <div className="event-meta">
                  <Calendar size={14} />
                  <span>{event.date}</span>
                </div>
                <p>{event.description}</p>
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
