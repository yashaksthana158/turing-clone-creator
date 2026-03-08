import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft, Calendar, Clock, MapPin, Trophy, Phone, User,
  CheckCircle, XCircle, Loader2,
} from "lucide-react";
import { IdCardUpload } from "@/components/IdCardUpload";

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
  register_enabled: boolean;
}

const OverloadEventDetail = () => {
  const { year, eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<OverloadEventData | null>(null);
  const [edition, setEdition] = useState<Edition | null>(null);
  const [loading, setLoading] = useState(true);

  // Registration state
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [regCount, setRegCount] = useState(0);

  useEffect(() => {
    if (eventId) fetchData();
  }, [eventId]);

  useEffect(() => {
    if (eventId && user) fetchRegistration();
  }, [eventId, user]);

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
      .select("id, year, title, register_enabled")
      .eq("id", ev.edition_id)
      .single();

    if (edData) setEdition(edData as Edition);

    // Get registration count
    const { count } = await supabase
      .from("overload_event_registrations" as any)
      .select("id", { count: "exact", head: true })
      .eq("overload_event_id", eventId!)
      .in("status", ["REGISTERED", "APPROVED"]);
    setRegCount(count || 0);

    setLoading(false);
  };

  const fetchRegistration = async () => {
    const { data } = await supabase
      .from("overload_event_registrations" as any)
      .select("status")
      .eq("overload_event_id", eventId!)
      .eq("user_id", user!.id)
      .maybeSingle();
    setRegistrationStatus((data as any)?.status || null);
  };

  const handleIdCardChange = (file: File | null, preview: string | null) => {
    setIdCardFile(file);
    setIdCardPreview(preview);
  };

  const handleRegister = async () => {
    if (!user) {
      navigate(`/register?redirect=/overloadpp${year ? `/${year}` : ""}/event/${eventId}`);
      return;
    }
    if (!idCardFile) {
      toast.error("Please upload your ID card to verify your details");
      return;
    }
    setRegistering(true);

    const fileExt = idCardFile.name.split(".").pop();
    const filePath = `${user.id}/overload-${eventId}.${fileExt}`;
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

    if (registrationStatus === "CANCELLED" || registrationStatus === "REJECTED") {
      const { error } = await supabase
        .from("overload_event_registrations" as any)
        .update({ status: "REGISTERED", id_card_url: storagePath })
        .eq("overload_event_id", eventId!)
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
      const { error } = await supabase
        .from("overload_event_registrations" as any)
        .insert({
          overload_event_id: eventId!,
          user_id: user.id,
          id_card_url: storagePath,
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
        setIdCardFile(null);
        setIdCardPreview(null);
      }
    }
    setRegistering(false);
  };

  const handleCancel = async () => {
    setRegistering(true);
    const { error } = await supabase
      .from("overload_event_registrations" as any)
      .update({ status: "CANCELLED" })
      .eq("overload_event_id", eventId!)
      .eq("user_id", user!.id);
    if (!error) {
      setRegistrationStatus("CANCELLED");
      setRegCount((c) => Math.max(0, c - 1));
    }
    setRegistering(false);
  };

  const isRegistered = registrationStatus === "REGISTERED";
  const isCancelled = registrationStatus === "CANCELLED";
  const isRejected = registrationStatus === "REJECTED";
  const isApproved = registrationStatus === "APPROVED";
  const canRegister = !registrationStatus && edition?.register_enabled;

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

  const IdCardUpload = () => (
    <div style={{ marginBottom: "24px" }}>
      {!idCardFile ? (
        <label
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
            padding: "32px 24px", border: "2px dashed rgba(145, 19, 255, 0.4)",
            borderRadius: "12px", cursor: "pointer", background: "rgba(145, 19, 255, 0.05)",
            transition: "all 0.2s",
          }}
        >
          <Upload size={32} style={{ color: "#9113ff" }} />
          <span style={{ color: "#a1a1aa", fontSize: "0.9rem" }}>Upload your College ID Card</span>
          <span style={{ color: "#52525b", fontSize: "0.75rem" }}>Image or PDF, max 5MB</span>
          <input type="file" accept="image/*,.pdf" onChange={handleIdCardSelect} style={{ display: "none" }} />
        </label>
      ) : (
        <div
          style={{
            display: "flex", alignItems: "center", gap: "12px", padding: "16px",
            background: "rgba(145, 19, 255, 0.1)", borderRadius: "12px",
            border: "1px solid rgba(145, 19, 255, 0.3)",
          }}
        >
          {idCardPreview ? (
            <img src={idCardPreview} alt="ID Card" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />
          ) : (
            <FileImage size={40} style={{ color: "#9113ff" }} />
          )}
          <div style={{ flex: 1, textAlign: "left" }}>
            <p style={{ color: "white", fontSize: "0.85rem", margin: 0 }}>{idCardFile.name}</p>
            <p style={{ color: "#71717a", fontSize: "0.75rem", margin: 0 }}>{(idCardFile.size / 1024).toFixed(0)} KB</p>
          </div>
          <button onClick={() => { setIdCardFile(null); setIdCardPreview(null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} style={{ color: "#ef4444" }} />
          </button>
        </div>
      )}
    </div>
  );

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
          {edition && <p className="overload-hero-venue">{edition.title}</p>}
        </div>
      </section>

      <div className="overload-detail-container">
        <Link to={`/overloadpp${year ? `/${year}` : ""}`} className="overload-detail-back">
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
                style={{
                  padding: "10px 28px", background: "transparent", color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px",
                  cursor: "pointer", fontWeight: 600, fontSize: "0.9rem",
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
              {user && <IdCardUpload />}
              <button
                onClick={handleRegister}
                disabled={registering || !idCardFile}
                className="overload-register-btn"
                style={{ opacity: registering || !idCardFile ? 0.5 : 1 }}
              >
                {registering ? "Registering..." : "Register Again"}
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
              {user && <IdCardUpload />}
              <button
                onClick={handleRegister}
                disabled={registering || (user ? !idCardFile : false)}
                className="overload-register-btn"
                style={{ opacity: registering || (user && !idCardFile) ? 0.5 : 1 }}
              >
                {registering ? (
                  <><Loader2 size={16} className="animate-spin" style={{ display: "inline", marginRight: 8 }} />Registering...</>
                ) : user ? "Register Now" : "Sign Up to Register"}
              </button>
            </div>
          )}

          {!edition?.register_enabled && !registrationStatus && (
            <p style={{ color: "#71717a", textAlign: "center" }}>Registration is not open for this event.</p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OverloadEventDetail;
