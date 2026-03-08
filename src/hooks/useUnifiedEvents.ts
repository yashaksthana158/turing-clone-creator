import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UnifiedEvent {
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

interface UseUnifiedEventsOptions {
  /** Only return upcoming events (skip past). Default true */
  upcomingOnly?: boolean;
  /** Max number of results. 0 = no limit */
  limit?: number;
}

function parseEditionDate(dateLabel: string | null): Date | null {
  if (!dateLabel) return null;
  const d = new Date(Date.parse(dateLabel.replace(/(\d+)\s+(\w+),?\s+(\d+)/, "$2 $1, $3")));
  return isNaN(d.getTime()) ? null : d;
}

function sortEvents(events: UnifiedEvent[]) {
  events.sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
    const dateA = a.event_date ? new Date(a.event_date).getTime() : Infinity;
    const dateB = b.event_date ? new Date(b.event_date).getTime() : Infinity;
    return dateA - dateB;
  });
}

export function useUnifiedEvents(options: UseUnifiedEventsOptions = {}) {
  const { upcomingOnly = true, limit = 0 } = options;
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const now = new Date().toISOString();
      let upcoming: UnifiedEvent[] = [];
      let past: UnifiedEvent[] = [];

      // --- Regular events ---
      const query = supabase
        .from("events")
        .select("id, title, description, event_date, venue, max_participants, poster_url, category, is_featured")
        .eq("status", "PUBLISHED");

      if (upcomingOnly) {
        query.order("is_featured", { ascending: false }).order("event_date", { ascending: true });
        if (limit > 0) query.limit(limit * 2); // fetch extra to account for past filtering
      }

      const { data } = await query;

      if (data && data.length > 0) {
        const upcomingRaw = data.filter((e: any) => !e.event_date || e.event_date >= now);
        const pastRaw = data.filter((e: any) => e.event_date && e.event_date < now);

        const counted = await Promise.all(
          upcomingRaw.map(async (evt: any) => {
            const { count } = await supabase
              .from("event_registrations")
              .select("id", { count: "exact", head: true })
              .eq("event_id", evt.id)
              .in("status", ["REGISTERED", "APPROVED"]);
            return { ...evt, registration_count: count || 0, external_url: null } as UnifiedEvent;
          })
        );
        upcoming = counted;
        past = pastRaw.map((evt: any) => ({ ...evt, registration_count: 0, external_url: null }));
      }

      // --- Overload events ---
      const { data: editions } = await supabase
        .from("overload_editions")
        .select("id, date_label, venue, register_url, title, year")
        .eq("is_published", true);

      if (editions && editions.length > 0) {
        for (const edition of editions) {
          const { data: oEvents } = await supabase
            .from("overload_events")
            .select("id, name, type, image_url, link_url")
            .eq("edition_id", edition.id)
            .order("sort_order", { ascending: true });

          if (!oEvents) continue;

          const editionDate = parseEditionDate(edition.date_label);
          const isPast = editionDate ? editionDate.getTime() < Date.now() : false;

          for (const oe of oEvents) {
            const mapped: UnifiedEvent = {
              id: `overload-${edition.year}-${oe.id}`,
              title: oe.name,
              description: `Part of ${edition.title}`,
              event_date: editionDate ? editionDate.toISOString() : null,
              venue: edition.venue || null,
              poster_url: oe.image_url || null,
              category: oe.type || "flagship",
              max_participants: null,
              registration_count: 0,
              is_featured: false,
              external_url: `/overloadpp/${edition.year}/event/${oe.id}`,
            };

            if (isPast) {
              past.push(mapped);
            } else {
              upcoming.push(mapped);
            }
          }
        }
      }

      sortEvents(upcoming);
      sortEvents(past);

      setEvents(limit > 0 ? upcoming.slice(0, limit) : upcoming);
      setPastEvents(past);
      setLoading(false);
    };

    fetch();
  }, [upcomingOnly, limit]);

  return { events, pastEvents, loading };
}
