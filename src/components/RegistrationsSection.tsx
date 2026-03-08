import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LiveEventCard } from "@/components/LiveEventCard";
import { ArrowRight } from "lucide-react";

interface DbEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  poster_url: string | null;
  category: string | null;
  max_participants: number | null;
}

export const RegistrationsSection = () => {
  const [events, setEvents] = useState<(DbEvent & { registration_count: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, description, event_date, venue, poster_url, category, max_participants, is_featured")
        .eq("status", "PUBLISHED")
        .order("is_featured", { ascending: false })
        .order("event_date", { ascending: true })
        .limit(3);

      if (data && data.length > 0) {
        // Fetch registration counts
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
        setEvents(counts);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

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
