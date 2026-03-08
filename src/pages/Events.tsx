import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Calendar, MapPin, Users, Mic, Trophy, Search } from "lucide-react";
import { LiveEventCard } from "@/components/LiveEventCard";
import { useUnifiedEvents, UnifiedEvent } from "@/hooks/useUnifiedEvents";

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    flagship: "#9113ff", coding: "#00d4ff", gaming: "#ff6b35",
    debate: "#ffc107", puzzle: "#10b981", fun: "#ec4899",
  };
  return colors[category] || "#9113ff";
};

const CATEGORIES = ["all", "coding", "gaming", "debate", "puzzle", "fun", "workshop", "hackathon", "seminar", "flagship"];

const Events = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { events: allEvents, pastEvents: pastDbEvents, loading } = useUnifiedEvents({ upcomingOnly: false });

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
