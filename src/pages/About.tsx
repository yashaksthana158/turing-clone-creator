import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const aboutImages = [
  "/Assets/About/1.jpg",
  "/Assets/About/2.JPG",
  "/Assets/About/3.JPG",
  "/Assets/About/4.jpg",
  "/Assets/About/5.jpg",
  "/Assets/About/6.jpg",
];

const About = () => {
  return (
    <div>
      <Navigation />

      {/* Hero Title */}
      <section style={{
        backgroundColor: "#000",
        paddingTop: "140px",
        paddingBottom: "40px",
        textAlign: "center",
      }}>
        <h1 style={{
          fontSize: "4rem",
          fontWeight: "bold",
          color: "#fff",
          textTransform: "uppercase",
          letterSpacing: "8px",
        }}>
          About <span style={{ color: "#9113ff" }}>Us</span>
        </h1>
      </section>

      {/* Content */}
      <section style={{ backgroundColor: "#000", padding: "0 40px 60px" }}>
        <div className="container" style={{ display: "flex", gap: "40px", flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Image Grid */}
          <div style={{
            flex: "1 1 400px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
          }}>
            {aboutImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`About ${i + 1}`}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "6px",
                }}
              />
            ))}
          </div>

          {/* Text */}
          <div style={{ flex: "1 1 400px", color: "#d3d3d3", lineHeight: 1.8, fontSize: "1rem" }}>
            <p>
              The <b style={{ color: "#9113ff" }}>Turing Society</b> is a dynamic and thriving departmental society
              that focuses on fostering a deep interest in the field of computer science and technology. With its roots
              in Acharya Narendra Dev College under the University of Delhi, the society is named after the legendary
              computer scientist Alan Turing. Its mission is to promote learning, innovation, and collaboration among
              students who are passionate about technology and its applications.
            </p>
            <br />
            <p>
              Turing Society serves as a platform for students to engage with the rapidly evolving world of technology.
              It regularly organizes events such as seminars, workshops and technical talks that explore cutting-edge
              topics in computer science, including artificial intelligence, machine learning, cybersecurity, and data science.
            </p>
            <br />
            <p>
              The society also organizes its flagship event "OVERLOAD++" — the annual fest of the Computer Science
              Department. It brings together enthusiasts for technical talks, intense coding challenges, thrilling gaming
              battles, and an adventurous treasure hunt, offering a unique platform for skill-building, networking, and
              showcasing talent across multiple tech domains.
            </p>
            <br />
            <p>
              By participating in various competitions, hackathons, and collaborative projects, students in the Turing
              Society develop problem-solving skills, creativity, and teamwork. The society's inclusive and encouraging
              environment ensures that every member has the opportunity to learn, grow, and contribute, making it a
              vibrant community for future tech leaders.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section style={{ backgroundColor: "#0a0a0a", padding: "60px 40px" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "2.5rem", color: "#fff", marginBottom: "10px" }}>
            Get in Touch with the Future
          </h2>
          <p style={{ color: "#d3d3d3", marginBottom: "40px" }}>
            Have an idea, question, or just want to geek out? Drop us a message!
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "60px", flexWrap: "wrap" }}>
            <div>
              <h3 style={{ color: "#9113ff", marginBottom: "8px" }}>Address</h3>
              <p style={{ color: "#d3d3d3" }}>
                Acharya Narendra Dev College,<br />Govindpuri, Kalkaji,<br />New Delhi 110019
              </p>
            </div>
            <div>
              <h3 style={{ color: "#9113ff", marginBottom: "8px" }}>Phone</h3>
              <p style={{ color: "#d3d3d3" }}>
                <a href="tel:+917428385311" style={{ color: "#d3d3d3" }}>+91 74283 85311</a>
              </p>
            </div>
            <div>
              <h3 style={{ color: "#9113ff", marginBottom: "8px" }}>Email</h3>
              <p style={{ color: "#d3d3d3" }}>
                <a href="mailto:turingandcs@gmail.com" style={{ color: "#d3d3d3" }}>turingandcs@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
