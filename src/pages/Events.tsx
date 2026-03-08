import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const eventsData = [
  {
    title: "Overload++ 2025",
    category: "overload",
    date: "March 20, 2025",
    description: "The annual tech fest of ANDC featuring coding, gaming, debates, and more.",
    image: "/Assets/overload_events/hackazzle.jpg",
    status: "upcoming",
  },
  {
    title: "Code Rush",
    category: "overload",
    date: "March 20, 2025",
    description: "A competitive coding challenge to test your programming skills under pressure.",
    image: "/Assets/overload_events/Code_Rush.jpg",
    status: "upcoming",
  },
  {
    title: "Bug Hunt",
    category: "overload",
    date: "March 20, 2025",
    description: "Find and fix bugs in the given code snippets within the time limit.",
    image: "/Assets/overload_events/bug_hunt.jpg",
    status: "upcoming",
  },
  {
    title: "Tech War",
    category: "overload",
    date: "March 20, 2025",
    description: "A debate competition on trending tech topics.",
    image: "/Assets/overload_events/tech_war.jpg",
    status: "upcoming",
  },
  {
    title: "Tekken Showdown",
    category: "overload",
    date: "March 20, 2025",
    description: "Console gaming tournament featuring Tekken battles.",
    image: "/Assets/overload_events/tekken.jpg",
    status: "upcoming",
  },
  {
    title: "The Lost Artifact",
    category: "overload",
    date: "March 20, 2025",
    description: "An exciting treasure hunt across the campus with tech-based clues.",
    image: "/Assets/overload_events/artifact.jpg",
    status: "upcoming",
  },
  {
    title: "Hackzzle",
    category: "overload",
    date: "March 20, 2025",
    description: "Solve complex puzzles using logic and programming knowledge.",
    image: "/Assets/overload_events/hackazzle.jpg",
    status: "upcoming",
  },
  {
    title: "Sketch Bytes",
    category: "overload",
    date: "March 20, 2025",
    description: "A fun scribble and drawing game with a tech twist.",
    image: "/Assets/overload_events/sketch_bytes.jpg",
    status: "upcoming",
  },
  {
    title: "BGMI Campus Clash",
    category: "overload",
    date: "March 20, 2025",
    description: "Mobile gaming tournament featuring BGMI squad battles.",
    image: "/Assets/overload_events/bgmi.jpg",
    status: "upcoming",
  },
];

const Events = () => {
  return (
    <div>
      <Navigation />

      {/* Hero */}
      <section
        className="events-hero"
        style={{
          background: "url(/img/Eventsbg.webp) no-repeat center bottom",
          backgroundSize: "cover",
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          paddingTop: "100px",
        }}
      >
        <div className="container">
          <h1 style={{ fontSize: "3rem", fontWeight: "bold", color: "#fff" }}>
            <span style={{ color: "#9113ff" }}>Overload++</span> is live
          </h1>
          <p style={{ fontSize: "1.2rem", color: "#d3d3d3", marginTop: "10px" }}>
            Join us for exciting workshops, hackathons, and coding competitions
          </p>
        </div>
      </section>

      {/* Events Grid */}
      <section className="upcoming-events" style={{ paddingTop: "60px" }}>
        <h2>Browse <span style={{ color: "#9113ff" }}>Events</span></h2>
        <div className="events-grid">
          {eventsData.map((event, index) => (
            <div className="upcoming-event-card" key={index}>
              <div
                className="upcoming-event-img"
                style={{
                  backgroundImage: `url(${event.image})`,
                  backgroundSize: "cover",
                  height: "250px",
                }}
              />
              <div style={{ padding: "16px", textAlign: "left" }}>
                <h3 style={{ color: "#4869df", fontSize: "1.2rem", marginBottom: "4px" }}>
                  {event.title}
                </h3>
                <p style={{ color: "#ffc107", fontSize: "0.85rem", marginBottom: "8px" }}>
                  {event.date}
                </p>
                <p style={{ color: "#dcdcdc", fontSize: "0.9rem", lineHeight: 1.5 }}>
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Events */}
      <section style={{ backgroundColor: "#000", padding: "60px 40px", textAlign: "center" }}>
        <div className="container">
          <h2 style={{ fontSize: "2.5rem", color: "#fff", marginBottom: "20px" }}>
            Turing <span style={{ color: "#9113ff" }}>ANDC Events</span>
          </h2>
          <p style={{ color: "#d3d3d3", maxWidth: "800px", margin: "0 auto 40px", lineHeight: 1.7 }}>
            Welcome to the Turing Society's Events section! Here, you will find a curated list of engaging activities designed to enrich your learning experience in computer science. Our events range from insightful workshops and inspiring guest lectures to collaborative hackathons and networking sessions.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "60px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#9113ff" }}>55+</div>
              <div style={{ color: "#d3d3d3", textTransform: "uppercase" }}>Events Hosted</div>
            </div>
            <div>
              <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#9113ff" }}>1200+</div>
              <div style={{ color: "#d3d3d3", textTransform: "uppercase" }}>Participants</div>
            </div>
            <div>
              <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#9113ff" }}>85+</div>
              <div style={{ color: "#d3d3d3", textTransform: "uppercase" }}>Speakers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section style={{ backgroundColor: "#0a0a0a", padding: "60px 40px" }}>
        <div className="container">
          <h2 style={{ fontSize: "2.5rem", color: "#fff", textAlign: "center", marginBottom: "30px" }}>
            Live <span style={{ color: "#9113ff" }}>Updates</span>
          </h2>
          <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { time: "2 hours ago", text: "Registration for the Annual TechFest is now open! Secure your spot and be part of an exciting technological experience." },
              { time: "1 day ago", text: "Congratulations to Team CodeNinjas for winning the Web Development Challenge!" },
              { time: "3 days ago", text: "New workshop on Blockchain Technology added to our events calendar." },
            ].map((a, i) => (
              <div key={i} style={{ background: "#1c1c1c", borderRadius: "8px", padding: "20px", borderLeft: "3px solid #9113ff" }}>
                <div style={{ color: "#9113ff", fontSize: "0.8rem", marginBottom: "6px" }}>{a.time}</div>
                <p style={{ color: "#d3d3d3", lineHeight: 1.6, margin: 0 }}>{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Events;
