import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Calendar, Clock, MapPin, Trophy, Phone, User } from "lucide-react";

interface OverloadEventData {
  id: string;
  name: string;
  type: string | null;
  image_url: string | null;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  venue: string | null;
  prizes: string | null;
  rules: string | null;
  event_format: string | null;
  winning_criteria: string | null;
  coordinators: string | null;
  hero_image_url: string | null;
  register_url: string | null;
  edition_id: string;
}

interface Edition {
  id: string;
  year: number;
  title: string;
}

const OverloadEventDetail = () => {
  const { year, eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<OverloadEventData | null>(null);
  const [edition, setEdition] = useState<Edition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("overload_events")
        .select("*")
        .eq("id", eventId!)
        .single();

      if (!data) {
        setLoading(false);
        return;
      }

      const ev = data as OverloadEventData;
      setEvent(ev);

      const { data: edData } = await supabase
        .from("overload_editions")
        .select("id, year, title")
        .eq("id", ev.edition_id)
        .single();

      if (edData) setEdition(edData as Edition);
      setLoading(false);
    };

    if (eventId) fetchData();
  }, [eventId]);

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

  if (!event) {
    return (
      <div>
        <Navigation />
        <div className="overload-not-found">
          <h1 className="overload-not-found-title">Event Not Found</h1>
          <p className="overload-not-found-text">This event doesn't exist or is no longer available.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const rulesList = event.rules?.split("\n").filter(Boolean) || [];
  const coordinatorsList = event.coordinators?.split("\n").filter(Boolean) || [];

  return (
    <div>
      <Navigation />

      {/* Hero */}
      <section
        className="overload-detail-hero"
        style={{
          backgroundImage: event.hero_image_url
            ? `url(${event.hero_image_url})`
            : event.image_url
            ? `url(${event.image_url})`
            : undefined,
        }}
      >
        <div className="overload-hero-overlay" />
        <div className="overload-detail-hero-content">
          {event.type && <span className="overload-detail-badge">{event.type}</span>}
          <h1 className="overload-hero-title">{event.name}</h1>
          {edition && (
            <p className="overload-hero-venue">{edition.title}</p>
          )}
        </div>
      </section>

      <div className="overload-detail-container">
        {/* Back link */}
        <Link
          to={`/overloadpp${year ? `/${year}` : ""}`}
          className="overload-detail-back"
        >
          <ArrowLeft size={16} /> Back to {edition?.title || "Overload++"}
        </Link>

        {/* About */}
        {event.description && (
          <section className="overload-detail-about">
            <h2>About the Event</h2>
            <p>{event.description}</p>
          </section>
        )}

        {/* Event Details Grid */}
        {(event.event_date || event.event_time || event.venue || event.prizes) && (
          <section className="overload-detail-info">
            <h2>Event Details</h2>
            <div className="overload-detail-grid">
              {event.event_date && (
                <div className="overload-detail-grid-item">
                  <Calendar size={20} />
                  <div>
                    <span className="overload-detail-label">Date</span>
                    <span className="overload-detail-value">{event.event_date}</span>
                  </div>
                </div>
              )}
              {event.event_time && (
                <div className="overload-detail-grid-item">
                  <Clock size={20} />
                  <div>
                    <span className="overload-detail-label">Time</span>
                    <span className="overload-detail-value">{event.event_time}</span>
                  </div>
                </div>
              )}
              {event.venue && (
                <div className="overload-detail-grid-item">
                  <MapPin size={20} />
                  <div>
                    <span className="overload-detail-label">Venue</span>
                    <span className="overload-detail-value">{event.venue}</span>
                  </div>
                </div>
              )}
              {event.prizes && (
                <div className="overload-detail-grid-item">
                  <Trophy size={20} />
                  <div>
                    <span className="overload-detail-label">Prizes</span>
                    <span className="overload-detail-value">{event.prizes}</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Rules */}
        {rulesList.length > 0 && (
          <section className="overload-detail-rules">
            <h2>Rules</h2>
            <ul>
              {rulesList.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Format & Winning Criteria */}
        {(event.event_format || event.winning_criteria) && (
          <section className="overload-detail-format">
            <div className="overload-detail-format-grid">
              {event.event_format && (
                <div>
                  <h2>Event Format</h2>
                  <p>{event.event_format}</p>
                </div>
              )}
              {event.winning_criteria && (
                <div>
                  <h2>Winning Criteria</h2>
                  <p>{event.winning_criteria}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Coordinators */}
        {coordinatorsList.length > 0 && (
          <section className="overload-detail-coordinators">
            <h2>Event Coordinators</h2>
            <div className="overload-detail-coord-grid">
              {coordinatorsList.map((c, i) => {
                const parts = c.split("|").map((s) => s.trim());
                return (
                  <div key={i} className="overload-detail-coord-card">
                    <User size={18} />
                    <span className="overload-detail-coord-name">{parts[0]}</span>
                    {parts[1] && (
                      <a href={`tel:${parts[1]}`} className="overload-detail-coord-phone">
                        <Phone size={14} /> {parts[1]}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Register Button */}
        <div className="overload-detail-register">
          <button
            onClick={() => {
              if (!user) {
                navigate(`/register?redirect=/overloadpp${year ? `/${year}` : ""}/event/${eventId}`);
              } else if (event.register_url) {
                window.open(event.register_url, "_blank");
              }
            }}
            className="overload-register-btn"
          >
            Register Now
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OverloadEventDetail;
