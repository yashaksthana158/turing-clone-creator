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
  Trophy,
  Upload,
  X,
  XCircle,
  FileImage,
} from "lucide-react";
import { EventCountdown } from "@/components/EventCountdown";

interface EventData {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  status: string;
  max_participants: number | null;
  poster_url: string | null;
  category: string | null;
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
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [uploadingCard, setUploadingCard] = useState(false);

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
      .select("id, title, description, event_date, venue, status, max_participants, poster_url, category")
      .eq("id", id!)
      .single();

    if (error || !data) {
      toast.error("Event not found");
      navigate("/events");
      return;
    }
    setEvent(data);

    // Count both REGISTERED and APPROVED for capacity
    const { count } = await supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", id!)
      .in("status", ["REGISTERED", "APPROVED"]);
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
    if (!idCardFile) {
      toast.error("Please upload your ID card to verify your details");
      return;
    }
    setRegistering(true);

    // Upload ID card
    const fileExt = idCardFile.name.split(".").pop();
    const filePath = `${user.id}/${id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("id-cards")
      .upload(filePath, idCardFile, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      toast.error("Failed to upload ID card: " + uploadError.message);
      setRegistering(false);
      return;
    }

    // Store the storage path (not a public/signed URL)
    const storagePath = filePath;

    // If re-registering after cancellation or rejection, update existing row
    if (registrationStatus === "CANCELLED" || registrationStatus === "REJECTED") {
      const { error } = await supabase
        .from("event_registrations")
        .update({ status: "REGISTERED" as any, id_card_url: storagePath })
        .eq("event_id", id!)
        .eq("user_id", user.id);
      if (error) {
        toast.error("Re-registration failed: " + error.message);
      } else {
        toast.success("Successfully re-registered!");
        setRegistrationStatus("REGISTERED");
        setRegCount((c) => c + 1);
        setIdCardFile(null);
        setIdCardPreview(null);
      }
    } else {
      const { error } = await supabase.from("event_registrations").insert({
        event_id: id!,
        user_id: user.id,
        id_card_url: storagePath,
      } as any);
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
        setIdCardFile(null);
        setIdCardPreview(null);
      }
    }
    setRegistering(false);
  };

  const handleIdCardSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Please upload an image or PDF file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be less than 5MB");
      return;
    }
    setIdCardFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setIdCardPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setIdCardPreview(null);
    }
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
    });
  };

  const formatTime = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isFull = event?.max_participants ? regCount >= event.max_participants : false;
  const canRegister = event?.status === "PUBLISHED" && !registrationStatus && !isFull;
  const isRegistered = registrationStatus === "REGISTERED";
  const isCancelled = registrationStatus === "CANCELLED";
  const isRejected = registrationStatus === "REJECTED";
  const isApproved = registrationStatus === "APPROVED";

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

      {/* Hero Section */}
      <div
        className="overload-detail-hero"
        style={{
          backgroundImage: event.poster_url ? `url(${event.poster_url})` : undefined,
        }}
      >
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(10,10,20,0.7) 0%, rgba(10,10,20,0.95) 100%)",
          zIndex: 1,
        }} />
        <div className="overload-detail-hero-content">
          {event.category && (
            <span className="overload-detail-badge">{event.category}</span>
          )}
          <h1 style={{
            color: "white",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 800,
            fontFamily: "'Oxanium', sans-serif",
            margin: "0 0 8px",
          }}>
            {event.title}
          </h1>
          <p style={{ color: "#a1a1aa", fontSize: "1rem" }}>
            {event.status === "PUBLISHED" ? "Open for Registration" : event.status}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="overload-detail-container">
        <Link to="/events" className="overload-detail-back">
          <ArrowLeft size={16} />
          Back to Events
        </Link>

        {/* Countdown */}
        {event.event_date && event.status === "PUBLISHED" && (
          <div style={{ marginBottom: "32px" }}>
            <EventCountdown targetDate={event.event_date} />
          </div>
        )}

        {/* About */}
        {event.description && (
          <div className="overload-detail-about">
            <h2>About this Event</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{event.description}</p>
          </div>
        )}

        {/* Event Details Grid */}
        <div className="overload-detail-info">
          <h2>Event Details</h2>
          <div className="overload-detail-grid">
            {event.event_date && (
              <div className="overload-detail-grid-item">
                <Calendar size={20} />
                <div>
                  <span className="overload-detail-label">Date</span>
                  <span className="overload-detail-value">{formatDate(event.event_date)}</span>
                </div>
              </div>
            )}
            {event.event_date && (
              <div className="overload-detail-grid-item">
                <Clock size={20} />
                <div>
                  <span className="overload-detail-label">Time</span>
                  <span className="overload-detail-value">{formatTime(event.event_date)}</span>
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
            {event.max_participants && (
              <div className="overload-detail-grid-item">
                <Users size={20} />
                <div>
                  <span className="overload-detail-label">Capacity</span>
                  <span className="overload-detail-value">{regCount}/{event.max_participants} registered</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Registration Section */}
        <div className="overload-detail-register">
          {isApproved && (
            <div style={{ textAlign: "center" }}>
              <CheckCircle size={48} style={{ color: "#10b981", margin: "0 auto 16px" }} />
              <h3 style={{ color: "white", fontFamily: "'Oxanium', sans-serif", margin: "0 0 8px", fontSize: "1.3rem" }}>
                Registration Approved!
              </h3>
              <p style={{ color: "#71717a", fontSize: "0.9rem", marginBottom: "8px" }}>
                Your ID card has been verified. A confirmation email has been sent.
              </p>
              <p style={{ color: "#10b981", fontSize: "0.85rem", fontWeight: 600 }}>
                We'll see you at the event! 🎉
              </p>
            </div>
          )}

          {isRegistered && (
            <div style={{ textAlign: "center" }}>
              <Clock size={48} style={{ color: "#f59e0b", margin: "0 auto 16px" }} />
              <h3 style={{ color: "white", fontFamily: "'Oxanium', sans-serif", margin: "0 0 8px", fontSize: "1.3rem" }}>
                Registration Pending Review
              </h3>
              <p style={{ color: "#71717a", fontSize: "0.9rem", marginBottom: "20px" }}>
                Your ID card is being verified. You'll receive a confirmation once approved.
              </p>
              <button
                onClick={handleCancel}
                disabled={registering}
                className="overload-detail-cancel-btn"
                style={{
                  padding: "10px 28px",
                  background: "transparent",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  opacity: registering ? 0.5 : 1,
                }}
              >
                {registering ? "Cancelling..." : "Cancel Registration"}
              </button>
            </div>
          )}

          {(isCancelled || isRejected) && (
            <div style={{ textAlign: "center" }}>
              {isRejected ? (
                <>
                  <XCircle size={48} style={{ color: "#ef4444", margin: "0 auto 16px" }} />
                  <h3 style={{ color: "white", fontFamily: "'Oxanium', sans-serif", margin: "0 0 8px", fontSize: "1.3rem" }}>
                    Registration Rejected
                  </h3>
                  <p style={{ color: "#71717a", marginBottom: "16px" }}>
                    Your ID card could not be verified. Please upload a valid ID card and try again.
                  </p>
                </>
              ) : (
                <p style={{ color: "#71717a", marginBottom: "16px" }}>
                  Your registration was cancelled. You can register again.
                </p>
              )}

              {user && (
                <div style={{ marginBottom: "24px" }}>
                  {!idCardFile ? (
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                        padding: "32px 24px",
                        border: "2px dashed rgba(145, 19, 255, 0.4)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        background: "rgba(145, 19, 255, 0.05)",
                        transition: "all 0.2s",
                      }}
                    >
                      <Upload size={32} style={{ color: "#9113ff" }} />
                      <span style={{ color: "#a1a1aa", fontSize: "0.9rem" }}>
                        Upload your College ID Card
                      </span>
                      <span style={{ color: "#52525b", fontSize: "0.75rem" }}>
                        Image or PDF, max 5MB
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleIdCardSelect}
                        style={{ display: "none" }}
                      />
                    </label>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "16px",
                        background: "rgba(145, 19, 255, 0.1)",
                        borderRadius: "12px",
                        border: "1px solid rgba(145, 19, 255, 0.3)",
                      }}
                    >
                      {idCardPreview ? (
                        <img
                          src={idCardPreview}
                          alt="ID Card"
                          style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }}
                        />
                      ) : (
                        <FileImage size={40} style={{ color: "#9113ff" }} />
                      )}
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <p style={{ color: "white", fontSize: "0.85rem", margin: 0 }}>{idCardFile.name}</p>
                        <p style={{ color: "#71717a", fontSize: "0.75rem", margin: 0 }}>
                          {(idCardFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => { setIdCardFile(null); setIdCardPreview(null); }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                      >
                        <X size={20} style={{ color: "#ef4444" }} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleRegister}
                disabled={registering || isFull}
                className="overload-register-btn"
              >
                {registering ? "Registering..." : isFull ? "Event Full" : "Register Again"}
              </button>
            </div>
          )}

          {canRegister && (
            <div style={{ textAlign: "center" }}>
              <h3 style={{ color: "white", fontFamily: "'Oxanium', sans-serif", margin: "0 0 8px", fontSize: "1.3rem" }}>
                Ready to join?
              </h3>
              <p style={{ color: "#71717a", fontSize: "0.9rem", marginBottom: "20px" }}>
                {user ? "Upload your ID card and register." : "Create an account to register for this event."}
              </p>

              {user && (
                <div style={{ marginBottom: "24px" }}>
                  {!idCardFile ? (
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                        padding: "32px 24px",
                        border: "2px dashed rgba(145, 19, 255, 0.4)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        background: "rgba(145, 19, 255, 0.05)",
                        transition: "all 0.2s",
                      }}
                    >
                      <Upload size={32} style={{ color: "#9113ff" }} />
                      <span style={{ color: "#a1a1aa", fontSize: "0.9rem" }}>
                        Upload your College ID Card
                      </span>
                      <span style={{ color: "#52525b", fontSize: "0.75rem" }}>
                        Image or PDF, max 5MB
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleIdCardSelect}
                        style={{ display: "none" }}
                      />
                    </label>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "16px",
                        background: "rgba(145, 19, 255, 0.1)",
                        borderRadius: "12px",
                        border: "1px solid rgba(145, 19, 255, 0.3)",
                      }}
                    >
                      {idCardPreview ? (
                        <img
                          src={idCardPreview}
                          alt="ID Card"
                          style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }}
                        />
                      ) : (
                        <FileImage size={40} style={{ color: "#9113ff" }} />
                      )}
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <p style={{ color: "white", fontSize: "0.85rem", margin: 0 }}>{idCardFile.name}</p>
                        <p style={{ color: "#71717a", fontSize: "0.75rem", margin: 0 }}>
                          {(idCardFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => { setIdCardFile(null); setIdCardPreview(null); }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                      >
                        <X size={20} style={{ color: "#ef4444" }} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleRegister}
                disabled={registering}
                className="overload-register-btn"
              >
                {registering ? "Registering..." : user ? "Register Now" : "Sign Up to Register"}
              </button>
            </div>
          )}

          {isFull && !registrationStatus && (
            <p style={{ color: "#ef4444", fontWeight: 600, textAlign: "center" }}>
              This event is full. Registration is closed.
            </p>
          )}

          {event.status !== "PUBLISHED" && !registrationStatus && (
            <p style={{ color: "#71717a", textAlign: "center" }}>Registration is not open for this event.</p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
