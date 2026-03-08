import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useParams } from "react-router-dom";

const ComingSoon = ({ section }: { section: string }) => {
  const { year } = useParams();

  return (
    <>
      <Navigation />
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a0030 100%)",
          textAlign: "center",
          padding: "120px 20px 60px",
        }}
      >
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontFamily: "Oxanium, sans-serif", marginBottom: 16 }}>
          {section} {year || "Archive"}
        </h1>
        <p style={{ fontSize: 18, color: "#aaa", maxWidth: 500 }}>
          {year === "2026"
            ? "Coming Soon! Stay tuned for updates."
            : "This section is under construction. Check back later!"}
        </p>
      </div>
      <Footer />
    </>
  );
};

export default ComingSoon;
