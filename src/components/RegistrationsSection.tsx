import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LiveEventCard } from "@/components/LiveEventCard";
import { ArrowRight } from "lucide-react";

interface UnifiedEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  poster_url: string | null;
  category: string | null;
  max_participants: number | null;
  registration_count: number;
  is_featured: boolean;
  external_url?: string | null;
}

export const RegistrationsSection = () => {
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      // Fetch regular events
      const { data: regularData } = await supabase
        .from("events")
        .select("id, title, description, event_date, venue, poster_url, category, max_participants, is_featured")
        .eq("status", "PUBLISHED")
        .order("is_featured", { ascending: false })
        .order("event_date", { ascending: true })
        .limit(6);

      let allEvents: UnifiedEvent[] = [];

      if (regularData && regularData.length > 0) {
        const now = new Date().toISOString();
        const upcoming = regularData.filter((evt: any) => !evt.event_date || evt.event_date >= now);
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
        allEvents = counts;
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
            // Parse date_label like "20 March, 2025" reliably
            const editionDate = edition.date_label ? new Date(Date.parse(edition.date_label.replace(/(\d+)\s+(\w+),?\s+(\d+)/, '$2 $1, $3'))) : null;
            const isPastEdition = editionDate && !isNaN(editionDate.getTime()) && editionDate.getTime() < Date.now();
            
            // Only show upcoming overload events on the home page
            if (isPastEdition) continue;
            
            for (const oe of oEvents) {
              allEvents.push({
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
              });
            }
          }
        }
      }

      // Sort: featured first, then by date ascending
      allEvents.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        const dateA = a.event_date ? new Date(a.event_date).getTime() : Infinity;
        const dateB = b.event_date ? new Date(b.event_date).getTime() : Infinity;
        return dateA - dateB;
      });

      setEvents(allEvents.slice(0, 3));
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
