import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Clock,
} from "lucide-react";

interface EventData {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  status: string;
  max_participants: number | null;
  poster_url: string | null;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [regCount, setRegCount] = useState(0);

  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  useEffect(() => {
    if (id && user) fetchRegistration();
  }, [id, user]);

  const fetchEvent = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("id, title, description, event_date, venue, status, max_participants, poster_url")
      .eq("id", id!)
      .single();

    if (error || !data) {
      toast.error("Event not found");
      navigate("/events");
      return;
    }
    setEvent(data);

    // Get registration count
    const { count } = await supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", id!)
      .eq("status", "REGISTERED");
    setRegCount(count || 0);

    setLoading(false);
  };

  const fetchRegistration = async () => {
    const { data } = await supabase
      .from("event_registrations")
      .select("status")
      .eq("event_id", id!)
      .eq("user_id", user!.id)
      .maybeSingle();
    setRegistrationStatus(data?.status || null);
  };

  const handleRegister = async () => {
    if (!user) {
      navigate(`/register?redirect=/events/${id}`);
      return;
    }

    setRegistering(true);
    const { error } = await supabase.from("event_registrations").insert({
      event_id: id!,
      user_id: user.id,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You are already registered for this event");
      } else {
        toast.error("Registration failed: " + error.message);
      }
    } else {
      toast.success("Successfully registered!");
      setRegistrationStatus("REGISTERED");
      setRegCount((c) => c + 1);
    }
    setRegistering(false);
  };

  const handleCancel = async () => {
    setRegistering(true);
    const { error } = await supabase
      .from("event_registrations")
      .update({ status: "CANCELLED" })
      .eq("event_id", id!)
      .eq("user_id", user!.id);

    if (error) {
      toast.error("Failed to cancel registration");
    } else {
      toast.success("Registration cancelled");
      setRegistrationStatus("CANCELLED");
      setRegCount((c) => Math.max(0, c - 1));
    }
    setRegistering(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isFull = event?.max_participants ? regCount >= event.max_participants : false;
  const canRegister =
    event?.status === "PUBLISHED" &&
    !registrationStatus &&
    !isFull;
  const isRegistered = registrationStatus === "REGISTERED";
  const isCancelled = registrationStatus === "CANCELLED";

  if (loading) {
    return (
      <div className="events-page">
        <Navigation />
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 size={40} className="animate-spin" style={{ color: "#9113ff" }} />
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="events-page">
      <Navigation />

      <section style={{ padding: "120px 20px 60px", maxWidth: "800px", margin: "0 auto" }}>
        <Link
          to="/events"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "#9113ff",
            textDecoration: "none",
            fontWeight: 600,
            marginBottom: "24px",
            fontSize: "14px",
          }}
        >
          <ArrowLeft size={16} />
          Back to Events
        </Link>

        {/* Event Header */}
        <div
          style={{
            background: "linear-gradient(135deg, hsl(270 80% 20%) 0%, hsl(270 60% 10%) 100%)",
            borderRadius: "16px",
            padding: "40px",
            marginBottom: "24px",
            border: "1px solid hsl(270 30% 25%)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              background: "#9113ff",
              color: "white",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "16px",
            }}
          >
            {event.status === "PUBLISHED" ? "Open for Registration" : event.status}
          </span>
          <h1
            style={{
              color: "white",
              fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
              fontWeight: 800,
              fontFamily: "'Oxanium', sans-serif",
              margin: "0 0 16px",
              lineHeight: 1.2,
            }}
          >
            {event.title}
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            {event.event_date && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ccc", fontSize: "15px" }}>
                <Clock size={16} />
                {formatDate(event.event_date)}
              </div>
            )}
            {event.venue && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ccc", fontSize: "15px" }}>
                <MapPin size={16} />
                {event.venue}
              </div>
            )}
            {event.max_participants && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ccc", fontSize: "15px" }}>
                <Users size={16} />
                {regCount}/{event.max_participants} registered
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div
            style={{
              background: "#1c1c1c",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
              border: "1px solid #333",
            }}
          >
            <h2 style={{ color: "white", fontSize: "18px", fontWeight: 700, margin: "0 0 12px", fontFamily: "'Oxanium', sans-serif" }}>
              About this Event
            </h2>
            <p style={{ color: "#aaa", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
              {event.description}
            </p>
          </div>
        )}

        {/* Registration Box */}
        <div
          style={{
            background: "#1c1c1c",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid #333",
            textAlign: "center",
          }}
        >
          {isRegistered && (
            <div>
              <CheckCircle size={40} style={{ color: "#10b981", margin: "0 auto 12px" }} />
              <h3 style={{ color: "white", margin: "0 0 8px", fontFamily: "'Oxanium', sans-serif" }}>
                You're Registered!
              </h3>
              <p style={{ color: "#888", fontSize: "14px", margin: "0 0 16px" }}>
                We'll see you at the event.
              </p>
              <button
                onClick={handleCancel}
                disabled={registering}
                style={{
                  padding: "10px 24px",
                  background: "transparent",
                  color: "#ef4444",
                  border: "1px solid #ef444450",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "14px",
                  opacity: registering ? 0.5 : 1,
                }}
              >
                {registering ? "Cancelling..." : "Cancel Registration"}
              </button>
            </div>
          )}

          {isCancelled && (
            <div>
              <p style={{ color: "#888", margin: "0 0 16px" }}>
                Your registration was cancelled. You can register again.
              </p>
              <button
                onClick={handleRegister}
                disabled={registering || isFull}
                style={{
                  padding: "12px 32px",
                  background: isFull ? "#555" : "linear-gradient(135deg, #9113ff, #6b0fd4)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: isFull ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: "16px",
                  opacity: registering ? 0.5 : 1,
                }}
              >
                {registering ? "Registering..." : isFull ? "Event Full" : "Register Again"}
              </button>
            </div>
          )}

          {canRegister && (
            <div>
              <h3 style={{ color: "white", margin: "0 0 8px", fontFamily: "'Oxanium', sans-serif" }}>
                Ready to join?
              </h3>
              <p style={{ color: "#888", fontSize: "14px", margin: "0 0 16px" }}>
                {user ? "Click below to secure your spot." : "Create an account to register for this event."}
              </p>
              <button
                onClick={handleRegister}
                disabled={registering}
                style={{
                  padding: "12px 32px",
                  background: "linear-gradient(135deg, #9113ff, #6b0fd4)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "16px",
                  opacity: registering ? 0.5 : 1,
                }}
              >
                {registering ? "Registering..." : user ? "Register Now" : "Sign Up to Register"}
              </button>
            </div>
          )}

          {isFull && !registrationStatus && (
            <div>
              <p style={{ color: "#ef4444", fontWeight: 600 }}>
                This event is full. Registration is closed.
              </p>
            </div>
          )}

          {event.status !== "PUBLISHED" && !registrationStatus && (
            <p style={{ color: "#888" }}>Registration is not open for this event.</p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
