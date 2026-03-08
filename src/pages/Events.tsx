import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Calendar, MapPin, Users, Mic, Trophy, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DbEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  status: string;
  max_participants: number | null;
  poster_url: string | null;
}

const hardcodedEvents = [
  {
    title: "Overload++ 2025",
    category: "flagship",
    date: "March 20, 2025",
    description: "The annual tech fest of ANDC featuring coding, gaming, debates, and more.",
    image: "/Assets/overload_events/hackazzle.jpg",
    status: "upcoming",
  },
  {
    title: "Code Rush",
    category: "coding",
    date: "March 20, 2025",
    description: "A competitive coding challenge to test your programming skills under pressure.",
    image: "/Assets/overload_events/Code_Rush.jpg",
    status: "upcoming",
  },
  {
    title: "Bug Hunt",
    category: "coding",
    date: "March 20, 2025",
    description: "Find and fix bugs in the given code snippets within the time limit.",
    image: "/Assets/overload_events/bug_hunt.jpg",
    status: "upcoming",
  },
  {
    title: "Tech War",
    category: "debate",
    date: "March 20, 2025",
    description: "A debate competition on trending tech topics.",
    image: "/Assets/overload_events/tech_war.jpg",
    status: "upcoming",
  },
  {
    title: "Tekken Showdown",
    category: "gaming",
    date: "March 20, 2025",
    description: "Console gaming tournament featuring Tekken battles.",
    image: "/Assets/overload_events/tekken.jpg",
    status: "upcoming",
  },
  {
    title: "The Lost Artifact",
    category: "fun",
    date: "March 20, 2025",
    description: "An exciting treasure hunt across the campus with tech-based clues.",
    image: "/Assets/overload_events/artifact.jpg",
    status: "upcoming",
  },
  {
    title: "Hackzzle",
    category: "puzzle",
    date: "March 20, 2025",
    description: "Solve complex puzzles using logic and programming knowledge.",
    image: "/Assets/overload_events/hackazzle.jpg",
    status: "upcoming",
  },
  {
    title: "Sketch Bytes",
    category: "fun",
    date: "March 20, 2025",
    description: "A fun scribble and drawing game with a tech twist.",
    image: "/Assets/overload_events/sketch_bytes.jpg",
    status: "upcoming",
  },
  {
    title: "BGMI Campus Clash",
    category: "gaming",
    date: "March 20, 2025",
    description: "Mobile gaming tournament featuring BGMI squad battles.",
    image: "/Assets/overload_events/bgmi.jpg",
    status: "upcoming",
  },
];

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    flagship: "#9113ff",
    coding: "#00d4ff",
    gaming: "#ff6b35",
    debate: "#ffc107",
    puzzle: "#10b981",
    fun: "#ec4899",
  };
  return colors[category] || "#9113ff";
};

const formatDate = (date: string | null) => {
  if (!date) return "TBD";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Events = () => {
  const [dbEvents, setDbEvents] = useState<DbEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, description, event_date, venue, status, max_participants, poster_url")
        .eq("status", "PUBLISHED")
        .order("event_date", { ascending: true });
      if (data) setDbEvents(data);
    };
    fetchEvents();
  }, []);

  return (
    <div className="events-page">
      <Navigation />

      {/* Hero Section */}
      <section className="events-hero-section">
        <div className="events-hero-overlay" />
        <div className="events-hero-content">
          <span className="events-hero-badge">🎯 Registration Open</span>
          <h1 className="events-hero-title">
            <span className="text-gradient">Overload++</span> is live
          </h1>
          <p className="events-hero-subtitle">
            Join us for exciting workshops, hackathons, and coding competitions
          </p>
          <a
            href="https://tr.ee/B20RjB"
            target="_blank"
            rel="noreferrer"
            className="events-hero-cta"
          >
            Register Now
          </a>
        </div>
      </section>

      {/* DB Events - Live Registration */}
      {dbEvents.length > 0 && (
        <section className="events-grid-section">
          <div className="section-header-pro">
            <h2>
              Live <span className="text-gradient">Registrations</span>
            </h2>
            <p>Register now for upcoming events</p>
          </div>
          <div className="events-grid-pro">
            {dbEvents.map((event) => (
              <Link
                to={`/events/${event.id}`}
                key={event.id}
                className="event-card-pro"
                style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
              >
                <div className="event-card-image">
                  {event.poster_url ? (
                    <img src={event.poster_url} alt={event.title} />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(270 80% 30%) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Calendar size={48} style={{ color: "white", opacity: 0.5 }} />
                    </div>
                  )}
                  <span className="event-badge" style={{ backgroundColor: "#9113ff" }}>
                    Open
                  </span>
                  <span className="event-status upcoming">Register</span>
                </div>
                <div className="event-card-content">
                  <h3>{event.title}</h3>
                  <div className="event-meta">
                    <Calendar size={14} />
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                  {event.venue && (
                    <div className="event-meta" style={{ marginTop: "4px" }}>
                      <MapPin size={14} />
                      <span>{event.venue}</span>
                    </div>
                  )}
                  <p>{event.description || "Click to view details and register"}</p>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "8px",
                    color: "#9113ff",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}>
                    View Details & Register <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hardcoded Events Grid */}
      <section className="events-grid-section">
        <div className="section-header-pro">
          <h2>
            Browse <span className="text-gradient">Events</span>
          </h2>
          <p>Explore our lineup of exciting tech events and competitions</p>
        </div>
        <div className="events-grid-pro">
          {hardcodedEvents.map((event, index) => (
            <div className="event-card-pro" key={index}>
              <div className="event-card-image">
                <img src={event.image} alt={event.title} />
                <span
                  className="event-badge"
                  style={{ backgroundColor: getCategoryColor(event.category) }}
                >
                  {event.category}
                </span>
                <span className={`event-status ${event.status}`}>
                  {event.status === "upcoming" ? "Upcoming" : "Past"}
                </span>
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
          <h2>
            Turing <span className="text-gradient">ANDC Events</span>
          </h2>
          <p>
            Welcome to the Turing Society's Events section! Here, you will find
            a curated list of engaging activities designed to enrich your
            learning experience in computer science.
          </p>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Trophy size={32} />
            </div>
            <div className="stat-number">55+</div>
            <div className="stat-label">Events Hosted</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={32} />
            </div>
            <div className="stat-number">1200+</div>
            <div className="stat-label">Participants</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Mic size={32} />
            </div>
            <div className="stat-number">85+</div>
            <div className="stat-label">Speakers</div>
          </div>
        </div>
      </section>

      {/* Live Updates Section */}
      <section className="events-updates-section">
        <div className="section-header-pro">
          <h2>
            Live <span className="text-gradient">Updates</span>
          </h2>
        </div>
        <div className="updates-timeline">
          {[
            {
              time: "2 hours ago",
              text: "Registration for the Annual TechFest is now open! Secure your spot and be part of an exciting technological experience.",
            },
            {
              time: "1 day ago",
              text: "Congratulations to Team CodeNinjas for winning the Web Development Challenge!",
            },
            {
              time: "3 days ago",
              text: "New workshop on Blockchain Technology added to our events calendar.",
            },
          ].map((update, i) => (
            <div className="update-item" key={i}>
              <div className="update-dot" />
              <div className="update-content">
                <span className="update-time">{update.time}</span>
                <p>{update.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Events;
