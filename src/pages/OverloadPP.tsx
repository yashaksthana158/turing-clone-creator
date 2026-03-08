import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const overloadEvents = [
  { name: "Tekken Showdown", type: "Console Gaming", image: "/img/performer/6.webp" },
  { name: "The Lost Artifact", type: "Treasure Hunt", image: "/img/performer/7.webp" },
  { name: "Bug Hunt", type: "Debugging Contest", image: "/img/performer/5.webp" },
  { name: "Campus Clash BGMI", type: "Mobile Game", image: "/img/performer/8.webp" },
  { name: "Techquest", type: "Quiz", image: "/img/performer/1.webp" },
  { name: "Coderush", type: "Coding Contest", image: "/img/performer/4.webp" },
  { name: "Hackzzle", type: "Puzzle Solve", image: "/img/performer/2.webp" },
  { name: "Sketchbytes", type: "Scribble", image: "/img/performer/9.webp" },
  { name: "TechWar", type: "Debate", image: "/img/performer/3.webp" },
];

const schedule = [
  { time: "9:20am - 10:00am", venue: "Seminar Hall", event: "Opening Ceremony" },
  { time: "10:00am - 11:30am", venue: "Room 9", event: "Techquest" },
  { time: "10:00am - 11:30am", venue: "Room 6", event: "Hackzzle" },
  { time: "10:00am - 11:30am", venue: "Seminar Hall", event: "TechWar" },
  { time: "11:30am - 1:00pm", venue: "Seminar Hall", event: "Coderush" },
  { time: "11:30am - 1:00pm", venue: "Room 9", event: "Bug Hunt" },
  { time: "1:30pm - 2:30pm", venue: "Room 9", event: "Tekken Showdown" },
  { time: "1:30pm - 2:30pm", venue: "Seminar Hall", event: "The Lost Artifact" },
  { time: "2:30pm - 4:00pm", venue: "Room 9", event: "Sketchbytes" },
  { time: "2:30pm - 4:00pm", venue: "Seminar Hall", event: "Campus Clash BGMI" },
];

const OverloadPP = () => {
  return (
    <div>
      <Navigation />

      {/* Hero */}
      <section
        style={{
          background: "url(/Assets/bg_overload.webp) no-repeat center center",
          backgroundSize: "cover",
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          paddingTop: "80px",
        }}
      >
        <div>
          <p style={{ color: "#ffc107", fontSize: "1.2rem", letterSpacing: "2px" }}>20 March, 2025</p>
          <h1 style={{ fontSize: "4rem", fontWeight: "bold", color: "#fff", margin: "10px 0" }}>
            Overload++ 2025
          </h1>
          <p style={{ color: "#d3d3d3", fontSize: "1.1rem" }}>
            Seminar Hall, Acharya Narendra Dev College
          </p>
        </div>
      </section>

      {/* About */}
      <section style={{ backgroundColor: "#000", padding: "60px 40px" }}>
        <div className="container" style={{ display: "flex", gap: "40px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 400px" }}>
            <img
              src="/img/about/overload++ Banner.webp"
              alt="Overload++ Banner"
              style={{ width: "100%", borderRadius: "10px" }}
            />
          </div>
          <div style={{ flex: "1 1 400px" }}>
            <h2 style={{ color: "#fff", fontSize: "2rem", marginBottom: "10px" }}>About Overload++</h2>
            <p style={{ color: "#d3d3d3", lineHeight: 1.8, marginBottom: "20px" }}>
              This annual tech extravaganza is set to be the biggest event of ANDC. We invite computer science students
              from all colleges and streams to dive into a world of learning and fun. Overload++ 2025 promises an
              electrifying blend of technology, creativity, and community spirit!
            </p>
            <a
              href="https://linktr.ee/Turing_Society"
              target="_blank"
              rel="noreferrer"
              className="btn-custom"
              style={{ display: "inline-block", width: "auto" }}
            >
              Register Now
            </a>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section style={{ backgroundColor: "#000", padding: "60px 40px" }}>
        <div className="container">
          <h2 style={{ fontSize: "2.5rem", color: "#fff", textAlign: "center", marginBottom: "40px" }}>Events</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
            maxWidth: "1000px",
            margin: "0 auto",
          }}>
            {overloadEvents.map((event, i) => (
              <div
                key={i}
                style={{
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid #333",
                  transition: "transform 0.3s",
                }}
                className="upcoming-event-card"
              >
                <img
                  src={event.image}
                  alt={event.name}
                  style={{ width: "100%", height: "220px", objectFit: "cover" }}
                />
                <div style={{ padding: "16px", textAlign: "center" }}>
                  <h4 style={{ color: "#fff", fontSize: "1.1rem" }}>{event.name}</h4>
                  <span style={{ color: "#9113ff", fontSize: "0.85rem" }}>{event.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section style={{ backgroundColor: "#0a0a0a", padding: "60px 40px" }}>
        <div className="container">
          <h2 style={{ fontSize: "2.5rem", color: "#fff", textAlign: "center", marginBottom: "40px" }}>
            Event Schedule
          </h2>
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            {schedule.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "20px",
                  padding: "16px 0",
                  borderBottom: "1px solid #222",
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: "160px" }}>
                  <div style={{ color: "#9113ff", fontWeight: "bold", fontSize: "0.9rem" }}>{item.time}</div>
                  <div style={{ color: "#888", fontSize: "0.8rem" }}>{item.venue}</div>
                </div>
                <h4 style={{ color: "#fff", fontSize: "1rem", margin: 0 }}>{item.event}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OverloadPP;
