import { Link } from "react-router-dom";
import { LiveEventCard } from "@/components/LiveEventCard";
import { ArrowRight } from "lucide-react";
import { useUnifiedEvents } from "@/hooks/useUnifiedEvents";

export const RegistrationsSection = () => {
  const { events, loading } = useUnifiedEvents({ upcomingOnly: true, limit: 3 });

  if (loading) return null;
  if (events.length === 0) return null;

  return (
    <section className="upcoming-events">
      <h2>
        <span className="red">Live</span>&nbsp;Registrations
      </h2>
      <div className="container">
        <div className="events-grid-pro" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {events.map((event) => (
            <LiveEventCard
              key={event.id}
              {...event}
              showCountdown
            />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Link to="/events" className="btn-custom" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            View All Events <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};
