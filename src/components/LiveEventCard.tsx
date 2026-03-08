import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { EventCountdown } from "@/components/EventCountdown";

const CATEGORY_COLORS: Record<string, string> = {
  coding: "#00d4ff",
  gaming: "#ff6b35",
  debate: "#ffc107",
  puzzle: "#10b981",
  fun: "#ec4899",
  workshop: "#6366f1",
  hackathon: "#9113ff",
  seminar: "#14b8a6",
};

interface LiveEventCardProps {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  poster_url: string | null;
  category: string | null;
  max_participants: number | null;
  registration_count?: number;
  showCountdown?: boolean;
  is_featured?: boolean;
}

export function LiveEventCard({
  id,
  title,
  description,
  event_date,
  venue,
  poster_url,
  category,
  max_participants,
  registration_count = 0,
  showCountdown = true,
  is_featured = false,
}: LiveEventCardProps) {
  const catColor = category ? CATEGORY_COLORS[category.toLowerCase()] || "#9113ff" : "#9113ff";
  const isFull = max_participants ? registration_count >= max_participants : false;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <Link
      to={`/events/${id}`}
      className="event-card-live group"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      {/* Image */}
      <div className="event-card-live-image">
        {poster_url ? (
          <img src={poster_url} alt={title} />
        ) : (
          <div className="event-card-live-placeholder">
            <Calendar size={48} style={{ color: "white", opacity: 0.3 }} />
          </div>
        )}
        {category && (
          <span className="event-card-live-badge" style={{ backgroundColor: catColor }}>
            {category}
          </span>
        )}
        {isFull ? (
          <span className="event-card-live-status full">Full</span>
        ) : (
          <span className="event-card-live-status open">Open</span>
        )}
      </div>

      {/* Content */}
      <div className="event-card-live-content">
        <h3>{title}</h3>

        {event_date && showCountdown && (
          <div style={{ margin: "8px 0" }}>
            <EventCountdown targetDate={event_date} compact />
          </div>
        )}

        <div className="event-card-live-meta">
          {event_date && (
            <span>
              <Calendar size={13} />
              {formatDate(event_date)}
            </span>
          )}
          {venue && (
            <span>
              <MapPin size={13} />
              {venue}
            </span>
          )}
          {max_participants && (
            <span>
              <Users size={13} />
              {registration_count}/{max_participants}
            </span>
          )}
        </div>

        {description && <p className="event-card-live-desc">{description}</p>}

        <div className="event-card-live-cta">
          View Details & Register <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
}
